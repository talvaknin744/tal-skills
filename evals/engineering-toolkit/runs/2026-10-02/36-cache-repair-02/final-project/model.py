"""Protected local adapters with the semantics specified in contract.md."""
from copy import deepcopy
from threading import Lock


def token(record):
    return record["incarnation"], record["revision"]


class Source:
    def __init__(self, records):
        self._lock = Lock()
        self._records = deepcopy(records)
        self.after_capture = None
        self.captures = 0
        self.token_reads = 0

    def _capture(self, key):
        with self._lock:
            self.captures += 1
            record = deepcopy(self._records[key])
            callback = self.after_capture
        if callback is not None:
            callback()
        return record

    def read_snapshot(self, key):
        return self._capture(key)

    def read_value(self, key):
        record = self._capture(key)
        return record["value"] if record["present"] else None

    def read_token(self, key):
        with self._lock:
            self.token_reads += 1
            return token(self._records[key])

    def current(self, key):
        with self._lock:
            return deepcopy(self._records[key])

    def update(self, key, value):
        with self._lock:
            record = self._records[key]
            if not record["present"]:
                raise ValueError("cannot update an absent row")
            record["revision"] += 1
            record["value"] = value
            return deepcopy(record)

    def delete(self, key):
        with self._lock:
            record = self._records[key]
            record["revision"] += 1
            record["present"] = False
            record["value"] = None
            return deepcopy(record)

    def recreate(self, key, incarnation, value):
        with self._lock:
            old = self._records[key]
            if old["present"] or incarnation <= old["incarnation"]:
                raise ValueError("recreation needs deletion and a larger incarnation")
            record = {"incarnation": incarnation, "revision": 1,
                      "present": True, "value": value}
            self._records[key] = record
            return deepcopy(record)


class Cache:
    def __init__(self, state=None):
        self._lock = Lock()
        self._rows = deepcopy((state or {}).get("rows", {}))
        self._floors = {key: tuple(value)
                        for key, value in (state or {}).get("floors", {}).items()}

    def lookup(self, key):
        with self._lock:
            return deepcopy(self._rows.get(key))

    def floor(self, key):
        with self._lock:
            return self._floors.get(key)

    def observe_change(self, key, record):
        with self._lock:
            incoming = token(record)
            if incoming < self._floors.get(key, (-1, -1)):
                return False
            self._floors[key] = incoming
            cached = self._rows.get(key)
            if cached is not None and token(cached) != incoming:
                self._rows.pop(key)
            return True

    def publish_if_current(self, key, record):
        with self._lock:
            incoming = token(record)
            if incoming < self._floors.get(key, (-1, -1)):
                return False
            self._floors[key] = incoming
            self._rows[key] = deepcopy(record)
            return True

    def put_unchecked(self, key, record):
        with self._lock:
            self._rows[key] = deepcopy(record)

    def evict(self, key):
        with self._lock:
            self._rows.pop(key, None)

    def view(self):
        with self._lock:
            return deepcopy({key: record for key, record in self._rows.items()
                             if record["present"]})

    def dump_state(self):
        with self._lock:
            return {"rows": deepcopy(self._rows),
                    "floors": {key: list(value)
                               for key, value in self._floors.items()}}
