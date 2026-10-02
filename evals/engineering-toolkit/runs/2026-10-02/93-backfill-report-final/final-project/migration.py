"""Application backfill attempt."""


def backfill_one(store, key, checkpoint):
    source = store.read_snapshot(key)
    if source is None:
        return False
    checkpoint("after_read")
    checkpoint("before_apply")
    code = {"pending": 0, "paid": 1}[source.status_text]
    return store.map_if_current(key, source.incarnation, source.source_rev, code)
