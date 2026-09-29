import itertools
import json
import threading
import unittest

from projection import Projection


def event(sequence, key, kind, value=None):
    result = {"sequence": sequence, "key": key, "kind": kind}
    if kind == "put":
        result["value"] = value
    return result


def restart(projection):
    return Projection(json.loads(json.dumps(projection.dump_state())))


def replay(events):
    rows = {}
    for item in events:
        if item["kind"] == "put":
            rows[item["key"]] = item["value"]
        else:
            rows.pop(item["key"], None)
    return rows


class ProjectionTests(unittest.TestCase):
    def test_delayed_first_baseline_after_restart(self):
        projection = Projection()
        projection.apply(event(20, "a", "delete"))
        projection.apply(event(18, "b", "put", "b18"))
        projection = restart(projection)
        projection.install_snapshot({"a": "old", "base": "v10"}, 10)
        self.assertEqual(projection.view(), {"base": "v10", "b": "b18"})
        projection.apply(event(19, "a", "put", "stale"))
        self.assertNotIn("a", projection.view())

        projection.install_snapshot({"base": "v21"}, 21)
        projection = restart(projection)
        projection.apply(event(19, "a", "put", "stale"))
        projection.apply(event(18, "b", "put", "b18"))
        self.assertEqual(projection.view(), {"base": "v21"})

    def test_snapshots_publish_in_reverse_order(self):
        projection = Projection()
        reached = {cut: threading.Event() for cut in (1, 3)}
        release = {cut: threading.Event() for cut in (1, 3)}
        rows = {
            1: {"baseline": "old", "deleted": "old"},
            3: {"baseline": "new", "deleted": "old"},
        }
        calls, errors, captured = [], [], {}
        live_done = threading.Event()

        def publish(cut):
            def before_publish():
                calls.append(cut)
                reached[cut].set()
                if not release[cut].wait(3):
                    raise AssertionError("publication barrier was not released")

            try:
                projection.install_snapshot(rows[cut], cut, before_publish)
            except BaseException as exc:
                errors.append(exc)

        def live():
            try:
                projection.apply(event(4, "live", "put", "v4"))
                projection.apply(event(5, "deleted", "delete"))
                captured["view"] = projection.view()
                captured["state"] = projection.dump_state()
            except BaseException as exc:
                errors.append(exc)
            finally:
                live_done.set()

        workers = {
            cut: threading.Thread(target=publish, args=(cut,), daemon=True)
            for cut in (1, 3)
        }
        live_worker = threading.Thread(target=live, daemon=True)
        for worker in workers.values():
            worker.start()
        try:
            for barrier in reached.values():
                self.assertTrue(barrier.wait(3), "snapshot did not reach hook")
            # Both snapshots have copied their input but neither has published.
            rows[3]["baseline"] = "caller mutation"
            live_worker.start()
            self.assertTrue(live_done.wait(3), "hook blocked live operations")
            self.assertEqual(captured["view"], {"live": "v4"})
            self.assertEqual(restart(Projection(captured["state"])).view(),
                             {"live": "v4"})
            release[3].set()
            workers[3].join(3)
            self.assertFalse(workers[3].is_alive())
            self.assertEqual(projection.view(), {"baseline": "new", "live": "v4"})
        finally:
            for barrier in release.values():
                barrier.set()
            for worker in workers.values():
                worker.join(3)
            if live_worker.ident is not None:
                live_worker.join(3)
        self.assertFalse(any(worker.is_alive() for worker in workers.values()))
        self.assertFalse(live_worker.is_alive())
        self.assertEqual(errors, [])
        self.assertCountEqual(calls, [1, 3])
        self.assertEqual(projection.view(), {"baseline": "new", "live": "v4"})

    def test_zero_boundary_and_ignored_snapshot_hooks(self):
        projection = Projection()
        projection.install_snapshot({"a": "a0"}, 0)
        projection = restart(projection)
        calls = []
        projection.install_snapshot({"a": "a0"}, 0, lambda: calls.append(0))
        projection.install_snapshot({}, 1, lambda: calls.append(1))
        projection.install_snapshot({"a": "a0"}, 0, lambda: calls.append(0))
        projection.apply(event(0, "a", "put", "a0"))
        self.assertEqual(calls, [0, 1, 0])
        self.assertEqual(projection.view(), {})

    def test_delivery_orders_against_authoritative_log(self):
        log = [
            event(0, "a", "put", "a0"),
            event(1, "b", "put", "b1"),
            event(2, "a", "delete"),
            event(3, "c", "put", "c3"),
            event(4, "b", "delete"),
        ]
        operations = [("live", seq) for seq in range(len(log))]
        operations += [("snapshot", cut) for cut in (1, 3)]
        for order in itertools.permutations(operations):
            projection, known = Projection(), set()
            for kind, sequence in order:
                if kind == "live":
                    projection.apply(log[sequence])
                    known.add(sequence)
                else:
                    projection.install_snapshot(replay(log[:sequence + 1]), sequence)
                    known.update(range(sequence + 1))
                # Oracle replays all known source events in source order.
                expected = replay([log[seq] for seq in sorted(known)])
                self.assertEqual(projection.view(), expected, order)
                projection = restart(projection)
                self.assertEqual(projection.view(), expected, order)
                # Redeliver every known event after each serialization boundary.
                for seq in sorted(known, reverse=True):
                    projection.apply(log[seq])
                    self.assertEqual(projection.view(), expected, order)


if __name__ == "__main__":
    unittest.main()
