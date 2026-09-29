"""Protected stdlib behavioral checks; no sleeps or external services."""
if not __debug__:
    raise RuntimeError("Acceptance checks require assertions; disable Python optimization")

import json
import threading
from projection import Projection


def event(sequence, key, kind, value=None):
    result = {"sequence": sequence, "key": key, "kind": kind}
    if kind == "put":
        result["value"] = value
    return result


def restored(projection):
    return Projection(json.loads(json.dumps(projection.dump_state())))


def paused_snapshot_delete():
    projection = Projection()
    projection.install_snapshot({"deleted": "v9", "untouched": "v8"}, 9)
    paused, release = threading.Event(), threading.Event()
    errors = []

    def before_publish():
        paused.set()
        if not release.wait(3):
            raise AssertionError("snapshot hook was not released")

    def snapshot():
        try:
            projection.install_snapshot({"deleted": "v10", "untouched": "v8"}, 10, before_publish)
        except BaseException as exc:
            errors.append(exc)

    worker = threading.Thread(target=snapshot, daemon=True)
    worker.start()
    assert paused.wait(3), "snapshot did not reach the publication barrier"
    live_done = threading.Event()
    captured = {}

    def live():
        try:
            projection.apply(event(11, "deleted", "delete"))
            captured["view"] = projection.view()
            captured["state"] = projection.dump_state()
        except BaseException as exc:
            errors.append(exc)
        finally:
            live_done.set()

    live_worker = threading.Thread(target=live, daemon=True)
    live_worker.start()
    try:
        assert live_done.wait(3), "live update/view/state blocked behind diagnostic hook"
        assert "deleted" not in captured["view"], "live DELETE must be visible before baseline publishes"
    finally:
        release.set()
        worker.join(3)
        live_worker.join(3)
    assert not worker.is_alive() and not live_worker.is_alive(), "threads did not terminate"
    assert not errors, repr(errors)
    assert projection.view() == {"untouched": "v8"}, "paused snapshot resurrected completed DELETE"
    restarted = Projection(json.loads(json.dumps(captured["state"])))
    restarted.install_snapshot({"deleted": "v10", "untouched": "v8"}, 10)
    assert restarted.view() == {"untouched": "v8"}, "serialized DELETE frontier was lost"
    restarted.apply(event(10, "deleted", "put", "stale"))
    assert "deleted" not in restarted.view(), "older live put resurrected deletion after restart"
    restarted.apply(event(12, "deleted", "put", "fresh"))
    assert restarted.view() == {"untouched": "v8", "deleted": "fresh"}, "newer live put was incorrectly suppressed"


def snapshot_boundary_and_omission():
    projection = Projection()
    projection.apply(event(3, "omitted", "put", "old"))
    projection.apply(event(12, "future", "put", "new"))
    projection.install_snapshot({"base": "at10"}, 10)
    assert projection.view() == {"base": "at10", "future": "new"}, "snapshot omission or later live merge is incorrect"
    projection = restored(projection)
    projection.install_snapshot({"base": "at8", "omitted": "old"}, 8)
    projection.apply(event(9, "absent", "put", "stale"))
    assert projection.view() == {"base": "at10", "future": "new"}, "published snapshot boundary regressed after restart"
    projection.install_snapshot({"base": "at13"}, 13)
    projection.apply(event(12, "future", "put", "new"))
    assert projection.view() == {"base": "at13"}, "newer complete baseline did not absorb old live frontier"
    detached = projection.view()
    detached["base"] = "mutated"
    assert projection.view() == {"base": "at13"}, "view aliases internal state"


def per_key_and_duplicate_order():
    projection = Projection()
    projection.apply(event(20, "a", "delete"))
    projection.apply(event(18, "b", "put", "b18"))
    projection.apply(event(19, "a", "put", "a19"))
    projection.apply(event(18, "b", "put", "b18"))
    projection = restored(projection)
    projection.apply(event(17, "b", "put", "b17"))
    assert projection.view() == {"b": "b18"}, "per-key stale-event handling failed"


if __name__ == "__main__":
    checks = [paused_snapshot_delete, snapshot_boundary_and_omission, per_key_and_duplicate_order]
    failures = []
    for check in checks:
        try:
            check()
        except BaseException as exc:
            failures.append({"check": check.__name__, "error": str(exc)})
    print(json.dumps({"checks": len(checks), "passed": len(checks) - len(failures), "failures": failures}, sort_keys=True))
    raise SystemExit(bool(failures))
