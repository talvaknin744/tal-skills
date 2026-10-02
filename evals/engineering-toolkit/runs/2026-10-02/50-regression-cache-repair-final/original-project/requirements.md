# Account label cache

Two `LabelService` instances share the supplied database and cache adapters. A
database row has an immutable ID and a monotonically increasing integer
`revision`; every write increments that revision. Database reads capture the
row at invocation and may complete later. The database is authoritative.

Once `write(id, label)` resolves with revision R, a read invoked afterwards must
return revision R or newer. A read already running when the write occurs may
return its earlier snapshot. A completed older read must not cause subsequent
reads to regress. Repeated reads of a populated cache must avoid database reads.
Different IDs are independent. Keep the public `read` and `write` signatures.

`model.mjs` supplies these adapter contracts:

- `database.read(id)` and `database.write(id, label)` return detached records.
- `cache.get(id)`, `cache.set(id, record)`, and `cache.delete(id)` operate on
  evictable cached values. `set` unconditionally replaces the current value.
- `cache.advanceFloor(id, revision)` atomically raises a shared revision floor,
  never lowers it, and removes a value older than the resulting floor.
- `cache.publishIfFresh(id, record)` atomically rejects a record older than
  either the floor or the current cached value, returning `false`; otherwise it
  stores the record, raises the floor if needed, and returns `true`.
- `cache.evict(id)` removes the cached value. Revision floors are stored
  separately and survive this operation. This fixture assumes floors outlive
  every outstanding reader and all instances use the same floor store.

Edit only `service.mjs`. Run `node verify.mjs`; no installation is needed.
The supplied checks control asynchronous ordering without wall-clock sleeps.
This exercise covers successful adapter calls and overlapping operations.
Crashes between the database commit and cache update, unavailable adapters,
floor expiry, replica reads, and production storage implementations are outside
the supplied model. Passing these checks does not establish a distributed
transaction between a real database and a real cache.
