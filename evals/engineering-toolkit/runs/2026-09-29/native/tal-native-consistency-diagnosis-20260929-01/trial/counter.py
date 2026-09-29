import threading


class Counter:
    def __init__(self):
        self._value = 0
        self._lock = threading.Lock()

    def value(self):
        with self._lock:
            return self._value

    def increment(self, after_snapshot=None):
        with self._lock:
            observed = self._value
        if after_snapshot:
            after_snapshot(observed)
        with self._lock:
            # The diagnostic snapshot may be stale; mutate the current value.
            self._value += 1
