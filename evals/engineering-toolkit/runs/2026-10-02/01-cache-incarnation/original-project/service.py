"""Local cache client; public interfaces and adapters follow contract.md."""


class EntityService:
    def __init__(self, source, cache):
        self.source = source
        self.cache = cache

    def changed(self, key, record):
        return self.cache.observe_change(key, record)

    def finish_fill(self, key, record):
        floor = self.cache.floor(key)
        if floor is not None and record["revision"] < floor[1]:
            return False
        self.cache.put_unchecked(key, record)
        return True

    def read(self, key, before_fill=None):
        cached = self.cache.lookup(key)
        if cached is not None:
            return cached["value"] if cached["present"] else None
        value = self.source.read_value(key)
        incarnation, revision = self.source.read_token(key)
        record = {"incarnation": incarnation, "revision": revision,
                  "present": value is not None, "value": value}
        if before_fill is not None:
            before_fill()
        self.finish_fill(key, record)
        return value
