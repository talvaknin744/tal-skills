"""Application backfill attempt."""


def backfill_one(store, key, checkpoint):
    snapshot = store.read_snapshot(key)
    if snapshot is None:
        return False
    checkpoint("after_read")
    checkpoint("before_apply")
    code = {"pending": 0, "paid": 1}[snapshot.status_text]
    return store.map_if_current(key, snapshot.incarnation, snapshot.source_rev, code)
