"""Protected deterministic stdlib checks with independently literal outcomes."""
if not __debug__:
    raise RuntimeError("Run checks without Python optimization")

import json
import threading
from model import Cache, Source
from service import EntityService


def row(incarnation, revision, value):
    return {"incarnation": incarnation, "revision": revision,
            "present": True, "value": value}


def check_view(cache, expected):
    actual = cache.view()
    assert set(actual) == set(expected), ("identity sets differ", actual, expected)
    assert actual == expected, ("record values differ", actual, expected)


def run_paused(call, mutation):
    reached, release = threading.Event(), threading.Event()
    errors, returns = [], []

    def pause():
        reached.set()
        if not release.wait(3):
            raise AssertionError("diagnostic barrier was not released")

    def work():
        try:
            returns.append(call(pause))
        except BaseException as exc:
            errors.append(repr(exc))

    worker = threading.Thread(target=work, daemon=True)
    worker.start()
    try:
        assert reached.wait(3), "read did not reach the declared boundary"
        mutation()
    finally:
        release.set()
        worker.join(3)
    assert not worker.is_alive(), "read thread remained active"
    assert not errors, errors
    return returns


def recreate_during_delayed_fill():
    source = Source({"item": row(41, 7, "old-blue")})
    cache = Cache()
    service = EntityService(source, cache)
    service.changed("item", source.current("item"))

    def mutation():
        service.changed("item", source.delete("item"))
        service.changed("item", source.recreate("item", 42, "new-red"))
        assert service.read("item") == "new-red"

    result = run_paused(lambda pause: service.read("item", pause), mutation)
    assert result == ["old-blue"], "the overlapping read lost its captured result"
    check_view(cache, {"item": row(42, 1, "new-red")})
    assert service.read("item") == "new-red", "subsequent read regressed"


def payload_and_token_capture():
    source = Source({"item": row(8, 1, "before")})
    cache = Cache()
    service = EntityService(source, cache)
    service.changed("item", source.current("item"))

    def capture(pause):
        source.after_capture = pause
        return service.read("item")

    def mutation():
        source.after_capture = None
        service.changed("item", source.update("item", "after"))
        assert service.read("item") == "after"

    result = run_paused(capture, mutation)
    assert result == ["before"]
    check_view(cache, {"item": row(8, 2, "after")})
    assert service.read("item") == "after", "old payload was relabelled as current"


def stale_fill_rejected_after_json_restart():
    source = Source({"item": row(12, 6, "departed")})
    cache = Cache()
    service = EntityService(source, cache)
    captured = source.current("item")
    assert service.finish_fill("item", captured) is True
    service.changed("item", source.delete("item"))
    cache.evict("item")
    restored = Cache(json.loads(json.dumps(cache.dump_state())))
    resumed = EntityService(source, restored)
    assert resumed.finish_fill("item", captured) is False
    assert resumed.read("item") is None
    check_view(restored, {})
    fresh = source.recreate("item", 13, "reborn")
    resumed.changed("item", fresh)
    assert resumed.finish_fill("item", fresh) is True, "new incarnation was rejected"
    check_view(restored, {"item": row(13, 1, "reborn")})


def per_key_order_and_reordered_notification():
    source = Source({"a": row(1, 99, "a99"), "b": row(30, 1, "b1")})
    cache = Cache()
    service = EntityService(source, cache)
    service.changed("a", source.current("a"))
    service.changed("b", source.current("b"))
    assert service.read("a") == "a99"
    assert service.read("b") == "b1"
    assert service.changed("a", row(1, 98, "a98")) is False
    assert service.finish_fill("a", row(1, 98, "a98")) is False
    assert service.finish_fill("b", row(30, 1, "b1")) is True
    check_view(cache, {"a": row(1, 99, "a99"), "b": row(30, 1, "b1")})


def atomic_publication_not_compare_then_set():
    source = Source({"item": row(22, 3, "past")})
    cache = Cache()
    service = EntityService(source, cache)
    old = source.current("item")
    service.changed("item", old)
    original_floor = cache.floor
    triggered = []

    def competing_floor(key):
        observed = original_floor(key)
        if not triggered:
            triggered.append(True)
            newer = source.update("item", "current")
            service.changed("item", newer)
            cache.publish_if_current("item", newer)
        return observed

    cache.floor = competing_floor
    service.finish_fill("item", old)
    if not triggered:
        newer = source.update("item", "current")
        service.changed("item", newer)
        cache.publish_if_current("item", newer)
    check_view(cache, {"item": row(22, 4, "current")})


def cache_hit_and_one_miss_capture():
    source = Source({"item": row(9, 2, "stable")})
    cache = Cache()
    service = EntityService(source, cache)
    callbacks = []
    service.changed("item", source.current("item"))
    assert service.read("item", lambda: callbacks.append("miss")) == "stable"
    assert callbacks == ["miss"]
    assert source.captures == 1, "miss performed extra authority captures"
    assert source.token_reads == 0, "payload and token were read separately"
    assert service.read("item", lambda: callbacks.append("hit")) == "stable"
    assert source.captures == 1 and callbacks == ["miss"], "cache hit bypassed cache"
    check_view(cache, {"item": row(9, 2, "stable")})


if __name__ == "__main__":
    checks = [recreate_during_delayed_fill, payload_and_token_capture,
              stale_fill_rejected_after_json_restart,
              per_key_order_and_reordered_notification,
              atomic_publication_not_compare_then_set,
              cache_hit_and_one_miss_capture]
    failures = []
    for check in checks:
        try:
            check()
        except BaseException as exc:
            failures.append({"check": check.__name__, "error": repr(exc)})
    print(json.dumps({"checks": len(checks), "passed": len(checks) - len(failures),
                      "failures": failures, "scope": "local specified adapters"},
                     sort_keys=True))
    raise SystemExit(bool(failures))
