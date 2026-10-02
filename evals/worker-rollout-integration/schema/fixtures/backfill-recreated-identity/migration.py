"""Application backfill attempt."""


def backfill_one(store, key, checkpoint):
    status_text = store.read_status(key)
    if status_text is None:
        return False
    checkpoint("after_read")
    version = store.read_version(key)
    if version is None:
        return False
    checkpoint("before_apply")
    code = {"pending": 0, "paid": 1}[status_text]
    return store.map_if_revision(key, version[1], code)
