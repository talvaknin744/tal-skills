# Status representation backfill

The existing source is `status_text`: pending or paid. The new representation is
`status_code`: pending maps to 0 and paid maps to 1. Foreground writers can update,
delete and recreate an order while a backfill attempt is running. Each creation
receives a non-reused incarnation; source revisions begin at 1 for that creation.
Every foreground business update atomically changes text and advances source
revision. Old writers do not populate the new fields.

`backfill_one(store, key, checkpoint)` must preserve the current source identity,
text and revision. It may mark a derived code current only for the source state
it observed. A stale or missing source returns False without mutation. A fresh
retry must be able to map the current row. Existing rows unrelated to the key
must remain unchanged.

For a present source, invoke checkpoint("after_read") and then
checkpoint("before_apply") once each. These hooks let the local exercise insert
foreground operations; they are not locks or production synchronization. Keep
this public interface. Only migration.py is editable. model.py supplies the
authority's declared primitives and verify.py supplies deterministic schedules.
This in-memory exercise does not implement database isolation, online DDL,
replication, process failure or a full migration deployment.
