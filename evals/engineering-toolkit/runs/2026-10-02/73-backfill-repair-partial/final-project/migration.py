"""Application backfill attempt."""


def backfill_one(store, key, checkpoint):
    row = store.read_snapshot(key)
    if row is None:
        return False
    checkpoint("after_read")
    checkpoint("before_apply")
    code = {"pending": 0, "paid": 1}[row.status_text]
    return store.map_if_current(key, row.incarnation, row.source_rev, code)
