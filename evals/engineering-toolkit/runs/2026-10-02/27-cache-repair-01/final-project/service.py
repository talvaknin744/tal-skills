"""Local cache client; public interfaces and adapters follow contract.md."""


class EntityService:
    def __init__(self, source, cache):
        self.source = source
        self.cache = cache

    def changed(self, key, record):
        return self.cache.observe_change(key, record)

    def finish_fill(self, key, record):
        return self.cache.publish_if_current(key, record)

    def read(self, key, before_fill=None):
        cached = self.cache.lookup(key)
        if cached is not None:
            return cached["value"] if cached["present"] else None
        record = self.source.read_snapshot(key)
        if before_fill is not None:
            before_fill()
        self.finish_fill(key, record)
        return record["value"] if record["present"] else None
