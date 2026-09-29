"""Public acceptance checks. Run explicitly with python3 -B verify.py."""

import json
import queue
import sqlite3
import tempfile
import threading
from pathlib import Path

import inventory


def same(actual, expected):
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True), (actual, expected)


def rejects(kind, call):
    try:
        call()
    except kind:
        return
    raise AssertionError(f"expected {kind.__name__}")


def count(path):
    with sqlite3.connect(path) as connection:
        return connection.execute("SELECT COUNT(*) FROM reservations").fetchone()[0]


def normal(path):
    result = inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 2})
    assert type(result["reservation_id"]) is int
    same({key: result[key] for key in ("tenant", "sku", "quantity", "remaining")},
         {"tenant": "tenant-a", "sku": "gear", "quantity": 2, "remaining": 3})
    same((inventory.stock(path, "tenant-a", "gear"), count(path)), (3, 1))


def replay_after_lost_response(path):
    first = inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 2})
    # Transport loses this already committed response; the database stays intact.
    inventory.initialize(path)
    inventory.reserve(path, "tenant-a", "other", {"sku": "gear", "quantity": 1})
    replay = inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 2})
    same(replay, first)
    same((inventory.stock(path, "tenant-a", "gear"), count(path)), (2, 2))


def changed_intent(path):
    inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 2})
    for body in ({"sku": "gear", "quantity": 1}, {"sku": "bolt", "quantity": 2}):
        rejects(inventory.ReservationConflict, lambda body=body: inventory.reserve(path, "tenant-a", "one", body))
    same((inventory.stock(path, "tenant-a", "gear"), inventory.stock(path, "tenant-a", "bolt"), count(path)), (3, 8, 1))


def tenant_authority_and_scope(path):
    first = inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 2, "tenant": "tenant-b"})
    same(first["tenant"], "tenant-a")
    same(inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 2}), first)
    second = inventory.reserve(path, "tenant-b", "one", {"sku": "gear", "quantity": 2})
    same(second["tenant"], "tenant-b")
    same((inventory.stock(path, "tenant-a", "gear"), inventory.stock(path, "tenant-b", "gear"), count(path)), (3, 5, 2))


def malformed_input(path):
    bodies = [None, [], {}, {"sku": "gear"}, {"sku": "", "quantity": 1},
              {"sku": 7, "quantity": 1}, {"sku": "gear", "quantity": True},
              {"sku": "gear", "quantity": 0}, {"sku": "gear", "quantity": -1},
              {"sku": "gear", "quantity": 1.0}, {"sku": "gear", "quantity": "1"},
              {"sku": "gear", "quantity": 1, "override": True}]
    for body in bodies:
        rejects(ValueError, lambda body=body: inventory.reserve(path, "tenant-a", "bad", body))
    for tenant, key in [("", "x"), (None, "x"), ("tenant-a", ""), ("tenant-a", 1)]:
        rejects(ValueError, lambda tenant=tenant, key=key: inventory.reserve(path, tenant, key, {"sku": "gear", "quantity": 1}))
    same((inventory.stock(path, "tenant-a", "gear"), count(path)), (5, 0))


def rejection_does_not_reserve_key(path):
    rejects(inventory.InsufficientStock, lambda: inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 6}))
    rejects(inventory.InsufficientStock, lambda: inventory.reserve(path, "tenant-a", "one", {"sku": "missing", "quantity": 1}))
    receipt = inventory.reserve(path, "tenant-a", "one", {"sku": "gear", "quantity": 5})
    same(receipt["remaining"], 0)
    same(count(path), 1)


def overlapping_duplicates(path):
    barrier = threading.Barrier(2)
    completed = queue.Queue()

    def attempt():
        try:
            barrier.wait(timeout=3)
            completed.put(("ok", inventory.reserve(path, "tenant-a", "parallel", {"sku": "gear", "quantity": 2})))
        except BaseException as error:
            completed.put(("error", f"{type(error).__name__}: {error}"))

    threads = [threading.Thread(target=attempt, daemon=True) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=8)
    assert not any(thread.is_alive() for thread in threads), "reservation caller did not finish"
    outcomes = [completed.get_nowait() for _ in threads]
    assert all(status == "ok" for status, _ in outcomes), outcomes
    results = [result for _, result in outcomes]
    same(results[0], results[1])
    same((inventory.stock(path, "tenant-a", "gear"), count(path)), (3, 1))


def main():
    checks = [normal, replay_after_lost_response, changed_intent, tenant_authority_and_scope,
              malformed_input, rejection_does_not_reserve_key, overlapping_duplicates]
    results = []
    for check in checks:
        with tempfile.TemporaryDirectory(prefix="inventory-acceptance-") as temporary:
            path = Path(temporary) / "inventory.sqlite"
            inventory.initialize(path)
            try:
                check(path)
            except Exception as error:
                results.append({"check": check.__name__, "status": "fail", "error": f"{type(error).__name__}: {error}"})
            else:
                results.append({"check": check.__name__, "status": "pass"})
    print(json.dumps({"sqlite": sqlite3.sqlite_version, "checks": results}, indent=2))
    return int(any(result["status"] != "pass" for result in results))


if __name__ == "__main__":
    raise SystemExit(main())
