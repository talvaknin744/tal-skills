"""Additional contract and failure checks against disposable SQLite files."""

import queue
import sqlite3
import tempfile
import threading
import unittest
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

import inventory


class InventoryTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="inventory-tests-")
        self.addCleanup(temporary.cleanup)
        self.path = Path(temporary.name) / "inventory.sqlite"
        inventory.initialize(self.path)

    def reserve(self, key="one", quantity=2, **extra):
        return inventory.reserve(
            self.path, "tenant-a", key, {"sku": "gear", "quantity": quantity, **extra}
        )

    def assert_state(self, remaining, reservations, requests):
        with closing(sqlite3.connect(self.path)) as connection:
            self.assertEqual(connection.execute(
                "SELECT quantity FROM inventory WHERE tenant = 'tenant-a' AND sku = 'gear'"
            ).fetchone()[0], remaining)
            self.assertEqual(connection.execute(
                "SELECT COUNT(*) FROM reservations"
            ).fetchone()[0], reservations)
            self.assertEqual(connection.execute(
                "SELECT COUNT(*) FROM reservation_requests"
            ).fetchone()[0], requests)

    def compete(self, *attempts):
        barrier = threading.Barrier(len(attempts))
        results = queue.Queue()

        def run(attempt):
            try:
                barrier.wait(timeout=3)
                result = attempt()
            except BaseException as error:
                result = error
            results.put(result)

        threads = [threading.Thread(target=run, args=(attempt,), daemon=True)
                   for attempt in attempts]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=8)
        self.assertFalse(any(thread.is_alive() for thread in threads), "caller stuck")
        return [results.get_nowait() for _ in attempts]

    def test_distinct_keys_cannot_oversell(self):
        outcomes = self.compete(
            lambda: self.reserve("first", 4), lambda: self.reserve("second", 4)
        )
        self.assertEqual(sum(type(result) is dict for result in outcomes), 1, outcomes)
        self.assertEqual(sum(type(result) is inventory.InsufficientStock
                             for result in outcomes), 1, outcomes)
        self.assert_state(1, 1, 1)

    def test_overlapping_conflicting_intents(self):
        outcomes = self.compete(lambda: self.reserve(quantity=2),
                                lambda: self.reserve(quantity=3))
        successes = [result for result in outcomes if type(result) is dict]
        self.assertEqual(len(successes), 1, outcomes)
        self.assertEqual(sum(type(result) is inventory.ReservationConflict
                             for result in outcomes), 1, outcomes)
        receipt = successes[0]
        self.assertEqual(self.reserve(quantity=receipt["quantity"]), receipt)
        self.assert_state(5 - receipt["quantity"], 1, 1)

    def test_receipt_write_failure_rolls_back_every_effect(self):
        with closing(sqlite3.connect(self.path)) as connection:
            connection.execute("""
                CREATE TRIGGER fail_receipt AFTER INSERT ON reservation_requests
                BEGIN SELECT RAISE(ABORT, 'injected receipt failure'); END
            """)
        with self.assertRaisesRegex(sqlite3.IntegrityError, "injected receipt failure"):
            self.reserve()
        self.assert_state(5, 0, 0)
        with closing(sqlite3.connect(self.path)) as connection:
            connection.execute("DROP TRIGGER fail_receipt")
        self.assertEqual(self.reserve(quantity=1)["remaining"], 4)
        self.assert_state(4, 1, 1)

    def test_failed_commit_rolls_back_and_releases_connection(self):
        connect = sqlite3.connect

        def short_timeout(*args, **kwargs):
            kwargs["timeout"] = 0.01
            return connect(*args, **kwargs)

        # A live reader in rollback-journal mode lets the writer change rows,
        # but prevents COMMIT from obtaining its exclusive lock.
        with closing(connect(self.path)) as reader:
            self.assertEqual(reader.execute("PRAGMA journal_mode=DELETE").fetchone()[0],
                             "delete")
            reader.execute("BEGIN")
            reader.execute("SELECT * FROM inventory").fetchall()
            with patch.object(inventory.sqlite3, "connect", side_effect=short_timeout):
                with self.assertRaisesRegex(sqlite3.OperationalError, "locked"):
                    self.reserve()
            reader.rollback()
        self.assert_state(5, 0, 0)
        self.assertEqual(self.reserve(quantity=1)["remaining"], 4)
        self.assert_state(4, 1, 1)

    def test_validation_still_applies_to_used_keys(self):
        class IntSubclass(int):
            pass

        self.reserve()
        for quantity in (True, False, IntSubclass(2), 0, -2, 2.0, "2", None):
            with self.subTest(quantity=repr(quantity), kind=type(quantity)):
                with self.assertRaises(ValueError) as raised:
                    self.reserve(quantity=quantity)
                self.assertIs(type(raised.exception), ValueError)
        with self.assertRaises(ValueError) as raised:
            self.reserve(override=True)
        self.assertIs(type(raised.exception), ValueError)
        self.assert_state(3, 1, 1)

    def test_arbitrary_positive_integer_is_business_rejection(self):
        with self.assertRaises(inventory.InsufficientStock):
            self.reserve(quantity=10 ** 100)
        self.assert_state(5, 0, 0)
        self.reserve()
        with self.assertRaises(inventory.ReservationConflict):
            self.reserve(quantity=10 ** 100)
        self.assert_state(3, 1, 1)

    def test_legacy_tenant_is_ignored_and_body_is_unchanged(self):
        body = {"sku": "gear", "quantity": 2, "tenant": {"untrusted": ["tenant-b"]}}
        original = {"sku": "gear", "quantity": 2, "tenant": {"untrusted": ["tenant-b"]}}
        first = inventory.reserve(self.path, "tenant-a", "one", body)
        self.assertEqual(body, original)
        self.assertEqual(first, self.reserve(tenant=None))
        self.assertEqual(first["tenant"], "tenant-a")
        self.assertEqual(inventory.stock(self.path, "tenant-b", "gear"), 7)
        self.assert_state(3, 1, 1)

    def test_replay_keeps_original_receipt_after_stock_is_exhausted(self):
        class StringSubclass(str):
            pass

        first = inventory.reserve(self.path, StringSubclass("tenant-a"), "one",
                                  {"sku": StringSubclass("gear"), "quantity": 2})
        self.reserve("other", 3)
        inventory.initialize(self.path)
        replay = self.reserve()
        self.assertEqual(replay, first)
        self.assertEqual(replay["remaining"], 3)
        for field, value in first.items():
            self.assertIs(type(value), type(replay[field]))
        self.assert_state(0, 2, 2)

    def test_reinitialization_preserves_existing_inventory_and_reservations(self):
        with closing(sqlite3.connect(self.path)) as connection, connection:
            connection.execute("UPDATE inventory SET quantity = 4 WHERE tenant = 'tenant-a'"
                               " AND sku = 'gear'")
            connection.execute("INSERT INTO reservations (tenant, sku, quantity)"
                               " VALUES ('tenant-a', 'gear', 1)")
            connection.execute("DROP TABLE reservation_requests")
        inventory.initialize(self.path)
        self.assert_state(4, 1, 0)
        receipt = self.reserve()
        self.assertEqual(receipt["reservation_id"], 2)
        self.assert_state(2, 2, 1)


if __name__ == "__main__":
    unittest.main()
