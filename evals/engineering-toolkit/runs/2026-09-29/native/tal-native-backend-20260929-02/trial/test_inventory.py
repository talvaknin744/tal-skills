"""Additional failure and concurrency checks against disposable SQLite files."""

from contextlib import closing
from pathlib import Path
import queue
import sqlite3
import tempfile
import threading
import unittest
from unittest.mock import patch

import inventory


class InventoryTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="inventory-tests-")
        self.addCleanup(temporary.cleanup)
        self.path = Path(temporary.name) / "inventory.sqlite"
        inventory.initialize(self.path)

    def counts(self):
        with closing(sqlite3.connect(self.path)) as connection:
            return tuple(connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
                         for table in ("reservations", "reservation_receipts"))

    def competing(self, *requests):
        """Observe both callers at BEGIN while another connection owns the writer lock."""
        started = queue.Queue()
        outcomes = queue.Queue()
        connect = sqlite3.connect

        def traced_connect(*args, **kwargs):
            connection = connect(*args, **kwargs)
            connection.set_trace_callback(
                lambda sql: started.put(None) if sql.startswith("BEGIN") else None
            )
            return connection

        def attempt(key, body):
            try:
                outcomes.put(inventory.reserve(self.path, "tenant-a", key, body))
            except BaseException as error:
                outcomes.put(error)

        threads = [threading.Thread(target=attempt, args=request, daemon=True)
                   for request in requests]
        with closing(connect(self.path)) as blocker:
            blocker.execute("BEGIN IMMEDIATE")
            with patch.object(inventory.sqlite3, "connect", side_effect=traced_connect):
                try:
                    for thread in threads:
                        thread.start()
                    for _ in threads:
                        started.get(timeout=3)
                finally:
                    blocker.rollback()
                    for thread in threads:
                        thread.join(timeout=8)
        self.assertFalse(any(thread.is_alive() for thread in threads))
        return [outcomes.get_nowait() for _ in threads]

    def test_receipt_write_failure_rolls_back_every_effect_and_key(self):
        with closing(sqlite3.connect(self.path)) as connection, connection:
            connection.execute("""
                CREATE TRIGGER reject_receipt BEFORE INSERT ON reservation_receipts
                BEGIN SELECT RAISE(ABORT, 'injected receipt failure'); END
            """)
        with self.assertRaisesRegex(sqlite3.IntegrityError, "injected receipt failure"):
            inventory.reserve(self.path, "tenant-a", "retry", {"sku": "gear", "quantity": 2})
        self.assertEqual(inventory.stock(self.path, "tenant-a", "gear"), 5)
        self.assertEqual(self.counts(), (0, 0))

        with closing(sqlite3.connect(self.path)) as connection, connection:
            connection.execute("DROP TRIGGER reject_receipt")
        receipt = inventory.reserve(self.path, "tenant-a", "retry", {"sku": "bolt", "quantity": 3})
        self.assertEqual(receipt["remaining"], 5)
        self.assertEqual(self.counts(), (1, 1))

    def test_competing_conflicting_intents_have_one_winner(self):
        outcomes = self.competing(
            ("shared", {"sku": "gear", "quantity": 2}),
            ("shared", {"sku": "gear", "quantity": 3}),
        )
        receipts = [value for value in outcomes if isinstance(value, dict)]
        conflicts = [value for value in outcomes if isinstance(value, inventory.ReservationConflict)]
        self.assertEqual((len(receipts), len(conflicts)), (1, 1), outcomes)
        self.assertEqual(inventory.stock(self.path, "tenant-a", "gear"), 5 - receipts[0]["quantity"])
        self.assertEqual(self.counts(), (1, 1))
        self.assertEqual(inventory.reserve(self.path, "tenant-a", "shared", {
            "sku": "gear", "quantity": receipts[0]["quantity"]}), receipts[0])

    def test_competing_distinct_keys_cannot_oversell(self):
        outcomes = self.competing(
            ("first", {"sku": "gear", "quantity": 4}),
            ("second", {"sku": "gear", "quantity": 4}),
        )
        self.assertEqual(sum(isinstance(value, dict) for value in outcomes), 1, outcomes)
        self.assertEqual(sum(isinstance(value, inventory.InsufficientStock) for value in outcomes), 1, outcomes)
        self.assertEqual(inventory.stock(self.path, "tenant-a", "gear"), 1)
        self.assertEqual(self.counts(), (1, 1))

    def test_receipt_types_stay_stable_after_stock_is_exhausted(self):
        class ClientString(str):
            pass

        body = {"sku": ClientString("gear"), "quantity": 5, "tenant": object()}
        first = inventory.reserve(self.path, ClientString("tenant-a"), ClientString("key"), body)
        expected = first.copy()
        first["remaining"] = 99
        inventory.initialize(self.path)
        replay = inventory.reserve(self.path, "tenant-a", "key", {"sku": "gear", "quantity": 5})
        self.assertEqual(replay, expected)
        self.assertEqual({key: type(value) for key, value in replay.items()},
                         {key: type(value) for key, value in expected.items()})
        self.assertEqual(inventory.stock(self.path, "tenant-a", "gear"), 0)
        self.assertEqual(self.counts(), (1, 1))

    def test_validation_precedes_replay_and_conflict_precedes_stock(self):
        class ClientInt(int):
            pass

        inventory.reserve(self.path, "tenant-a", "key", {"sku": "gear", "quantity": 1})
        for body in ({"sku": "gear", "quantity": True},
                     {"sku": "gear", "quantity": ClientInt(1)},
                     {"sku": "gear", "quantity": 1, "extra": None}):
            with self.subTest(body=body), self.assertRaises(ValueError) as error:
                inventory.reserve(self.path, "tenant-a", "key", body)
            self.assertIs(type(error.exception), ValueError)
        for body in ({"sku": "missing", "quantity": 1},
                     {"sku": "gear", "quantity": 10**100}):
            with self.subTest(body=body), self.assertRaises(inventory.ReservationConflict):
                inventory.reserve(self.path, "tenant-a", "key", body)
        self.assertEqual(inventory.stock(self.path, "tenant-a", "gear"), 4)
        self.assertEqual(self.counts(), (1, 1))

    def test_large_positive_int_is_insufficient_without_consuming_key(self):
        with self.assertRaises(inventory.InsufficientStock):
            inventory.reserve(self.path, "tenant-a", "large", {"sku": "gear", "quantity": 10**100})
        self.assertEqual(self.counts(), (0, 0))
        receipt = inventory.reserve(self.path, "tenant-a", "large", {"sku": "gear", "quantity": 1})
        self.assertEqual(receipt["remaining"], 4)

    def test_initialization_preserves_existing_inventory_and_reservations(self):
        # Model the original fixture, which predates durable receipt storage.
        with closing(sqlite3.connect(self.path)) as connection, connection:
            connection.execute("DROP TABLE reservation_receipts")
            connection.execute("UPDATE inventory SET quantity = 2 WHERE tenant = 'tenant-a' AND sku = 'gear'")
            connection.execute("INSERT INTO reservations (tenant, sku, quantity) VALUES ('tenant-a', 'gear', 3)")
        inventory.initialize(self.path)
        inventory.initialize(self.path)
        self.assertEqual(inventory.stock(self.path, "tenant-a", "gear"), 2)
        self.assertEqual(self.counts(), (1, 0))
        inventory.reserve(self.path, "tenant-a", "new", {"sku": "gear", "quantity": 1})
        self.assertEqual(self.counts(), (2, 1))


if __name__ == "__main__":
    unittest.main()
