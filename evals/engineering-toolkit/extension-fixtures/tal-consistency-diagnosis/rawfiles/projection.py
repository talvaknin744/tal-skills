"""A local snapshot/live cache projection; inputs follow contract.md."""
import threading


class Projection:
    def __init__(self, state=None):
        self._lock = threading.Lock()
        self._rows = dict((state or {}).get("rows", {}))

    def install_snapshot(self, rows, at_sequence, before_publish=None):
        snapshot = dict(rows)
        if before_publish is not None:
            before_publish()
        with self._lock:
            self._rows = snapshot

    def apply(self, event):
        with self._lock:
            if event["kind"] == "delete":
                self._rows.pop(event["key"], None)
            else:
                self._rows[event["key"]] = event["value"]

    def view(self):
        with self._lock:
            return dict(self._rows)

    def dump_state(self):
        with self._lock:
            return {"rows": dict(self._rows)}
