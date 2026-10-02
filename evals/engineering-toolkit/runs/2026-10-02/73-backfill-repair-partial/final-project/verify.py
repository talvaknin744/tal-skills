"""Protected literal expected-state oracle, independent of migration code."""

import json
from dataclasses import astuple

from migration import backfill_one
from model import Store


def inspect(store, expected):
    actual = {astuple(row) for row in store.rows()}
    expected = set(expected)
    assert actual == expected, {
        "missing": sorted(expected - actual),
        "extra": sorted(actual - expected),
    }


def source():
    store = Store()
    store.create(10, "original-x", "pending")
    store.create(20, "unrelated-z", "paid")
    return store


UNRELATED = (20, "unrelated-z", 1, "paid", None, None)


def attempt(store, operation=None, at="before_apply"):
    stages = []

    def checkpoint(stage):
        stages.append(stage)
        if operation is not None and stage == at:
            operation()

    result = backfill_one(store, 10, checkpoint)
    assert stages == ["after_read", "before_apply"], stages
    return result


def unchanged():
    store = source()
    assert attempt(store) is True
    inspect(store, [(10, "original-x", 1, "pending", 0, 1), UNRELATED])
    assert attempt(store) is True
    inspect(store, [(10, "original-x", 1, "pending", 0, 1), UNRELATED])


def update_after_read():
    store = source()
    assert attempt(store, lambda: store.update_old_writer(10, "paid"), "after_read") is False
    inspect(store, [(10, "original-x", 2, "paid", None, None), UNRELATED])
    assert attempt(store) is True
    inspect(store, [(10, "original-x", 2, "paid", 1, 2), UNRELATED])


def recreate_before_apply():
    store = source()

    def replace_source():
        store.delete(10)
        store.create(10, "replacement-y", "paid")

    assert attempt(store, replace_source) is False
    inspect(store, [(10, "replacement-y", 1, "paid", None, None), UNRELATED])
    assert attempt(store) is True
    inspect(store, [(10, "replacement-y", 1, "paid", 1, 1), UNRELATED])


def delete_before_apply():
    store = source()
    assert attempt(store, lambda: store.delete(10)) is False
    inspect(store, [UNRELATED])
    assert backfill_one(store, 10, lambda _: None) is False
    inspect(store, [UNRELATED])


def main():
    failures = []
    checks = [unchanged, update_after_read, recreate_before_apply, delete_before_apply]
    for check in checks:
        try:
            check()
        except Exception as error:
            failures.append({"check": check.__name__, "error": repr(error)})
    print(json.dumps({"checks": len(checks), "failures": failures, "runtime": "local in-memory authority"}))
    raise SystemExit(bool(failures))


if __name__ == "__main__":
    main()
