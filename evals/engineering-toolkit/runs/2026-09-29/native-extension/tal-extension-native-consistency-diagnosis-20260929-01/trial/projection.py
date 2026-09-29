"""A local snapshot/live cache projection; inputs follow contract.md."""
import threading


class Projection:
    def __init__(self, state=None):
        self._lock = threading.Lock()
        state = state or {}
        self._rows = dict(state.get("rows", {}))
        self._snapshot_sequence = state.get("snapshot_sequence", -1)
        # A key absent from rows but present here records a live deletion.
        # Only events newer than the complete snapshot need per-key records.
        self._key_sequences = dict(state.get("key_sequences", {}))

    def install_snapshot(self, rows, at_sequence, before_publish=None):
        snapshot = dict(rows)
        if before_publish is not None:
            before_publish()
        with self._lock:
            if at_sequence <= self._snapshot_sequence:
                return
            newer = {
                key: sequence
                for key, sequence in self._key_sequences.items()
                if sequence > at_sequence
            }
            for key in newer:
                if key in self._rows:
                    snapshot[key] = self._rows[key]
                else:
                    snapshot.pop(key, None)
            self._rows = snapshot
            self._snapshot_sequence = at_sequence
            self._key_sequences = newer

    def apply(self, event):
        with self._lock:
            sequence, key = event["sequence"], event["key"]
            if sequence <= self._snapshot_sequence:
                return
            if sequence <= self._key_sequences.get(key, -1):
                return
            if event["kind"] == "delete":
                self._rows.pop(key, None)
            else:
                self._rows[key] = event["value"]
            self._key_sequences[key] = sequence

    def view(self):
        with self._lock:
            return dict(self._rows)

    def dump_state(self):
        with self._lock:
            return {
                "rows": dict(self._rows),
                "snapshot_sequence": self._snapshot_sequence,
                "key_sequences": dict(self._key_sequences),
            }
