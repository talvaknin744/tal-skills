"""Protected local authority with atomic operations; no database runtime."""

from dataclasses import dataclass, replace
from threading import RLock


@dataclass(frozen=True)
class Row:
    key: int
    incarnation: str
    source_rev: int
    status_text: str
    status_code: int | None = None
    mapped_rev: int | None = None


class Store:
    def __init__(self):
        self._lock = RLock()
        self._rows = {}
        self._used_incarnations = set()

    def create(self, key, incarnation, status_text):
        with self._lock:
            if key in self._rows or incarnation in self._used_incarnations:
                raise ValueError("creation identity already used")
            if status_text not in {"pending", "paid"}:
                raise ValueError("unsupported status")
            self._used_incarnations.add(incarnation)
            self._rows[key] = Row(key, incarnation, 1, status_text)

    def update_old_writer(self, key, status_text):
        with self._lock:
            if status_text not in {"pending", "paid"}:
                raise ValueError("unsupported status")
            row = self._rows[key]
            self._rows[key] = replace(
                row, status_text=status_text, source_rev=row.source_rev + 1
            )

    def delete(self, key):
        with self._lock:
            del self._rows[key]

    def read_status(self, key):
        with self._lock:
            row = self._rows.get(key)
            return None if row is None else row.status_text

    def read_version(self, key):
        with self._lock:
            row = self._rows.get(key)
            return None if row is None else (row.incarnation, row.source_rev)

    def read_snapshot(self, key):
        with self._lock:
            return self._rows.get(key)

    def map_if_revision(self, key, revision, code):
        with self._lock:
            row = self._rows.get(key)
            if row is None or row.source_rev != revision:
                return False
            self._rows[key] = replace(row, status_code=code, mapped_rev=revision)
            return True

    def map_if_current(self, key, incarnation, revision, code):
        with self._lock:
            row = self._rows.get(key)
            if row is None or (row.incarnation, row.source_rev) != (incarnation, revision):
                return False
            self._rows[key] = replace(row, status_code=code, mapped_rev=revision)
            return True

    def rows(self):
        with self._lock:
            return tuple(sorted(self._rows.values(), key=lambda row: row.key))
