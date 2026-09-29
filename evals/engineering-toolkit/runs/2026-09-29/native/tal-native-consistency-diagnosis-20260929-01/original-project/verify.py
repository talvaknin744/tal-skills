"""Deterministic public behavior check using actual concurrent callers."""

import json
import queue
import threading

from counter import Counter


def main():
    counter = Counter()
    counter.increment()
    counter.increment()
    assert counter.value() == 2, "sequential increments"

    counter = Counter()
    barrier = threading.Barrier(2, timeout=2)
    observed = queue.Queue()
    failures = queue.Queue()

    def pause(snapshot):
        observed.put(snapshot)
        barrier.wait()

    def client():
        try:
            counter.increment(after_snapshot=pause)
        except BaseException as error:
            failures.put(f"{type(error).__name__}: {error}")

    threads = [threading.Thread(target=client, daemon=True) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=3)
    assert not any(thread.is_alive() for thread in threads), "owned caller did not finish"
    assert failures.empty(), list(failures.queue)
    snapshots = sorted(list(observed.queue))
    assert snapshots == [0, 0], snapshots
    actual = counter.value()
    print(json.dumps({"schedule": "read A; read B; release both; join both", "snapshots": snapshots,
                      "completed_calls": 2, "expected_value": 2, "actual_value": actual}))
    assert actual == 2, "two completed increments must add two"


if __name__ == "__main__":
    main()
