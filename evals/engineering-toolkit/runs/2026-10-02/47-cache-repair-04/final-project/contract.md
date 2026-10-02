# Local cache contract

`service.py` is the editable client of the protected `model.py` adapters. Use only
Python's standard library and preserve the `EntityService(source, cache)`,
`read(key, before_fill=None)`, `changed(key, record)`, and
`finish_fill(key, record)` interfaces. Other files are protected inputs.

Each authoritative record has an integer `incarnation`, an integer `revision`,
`present`, and `value` (a string when present, otherwise `None`). Keys supplied
here are already known to the source; deletion retains their versioned record.
The source authority allocates a larger incarnation when
the same key is created again; incarnations are immutable and never reused.
Revisions increase within one incarnation, including deletion, and restart at 1
for a new incarnation. These are supplied ordering facts, not timestamps or a
claim that arbitrary UUIDs can be ordered. A record is one indivisible snapshot.

The source offers `read_snapshot`, `read_value`, and `read_token`. A source capture
invokes its diagnostic `after_capture` callback after releasing its lock. The
callback may pause while another writer commits. Only `read_snapshot` captures
payload, presence and token together. Source read counters are diagnostic facts.

The cache stores values and a separate per-key ordering floor. Its
`observe_change(key, record)` and `publish_if_current(key, record)` transitions
are atomic. They compare `(incarnation, revision)` in that order, and an older
record cannot replace a newer observed record. `publish_if_current` returns a
boolean. The legacy `put_unchecked` method provides no such protection. Cache
value eviction retains the ordering floor. JSON `dump_state`/construction retain
both values and floors. Public observations are detached copies.

For this fixture, a source mutation and its confirmed `changed` notification
complete before a subsequently invoked read. Such reads must respect the
announced record, including deletion or recreation. A read already overlapping
the change may return its captured source value, but its delayed fill must not
regress cache state. This is not latest-value-at-response behavior.

On a cache miss, use one authoritative record capture. On a hit, use the cached
record without an authoritative capture. If supplied, `before_fill` runs exactly
once after the miss capture and before publication. Source mutations, change
notifications and cache observations must continue while either diagnostic
callback waits; do not hold a client lock across a callback. `finish_fill` also
accepts a previously captured record after cache JSON restoration. A rejected
fill must leave cache state intact. Unrelated keys have independent ordering.

All inputs are trusted, well formed and follow the source's ordering rules.
Unknown commit outcomes, conflicting records with the same token, missing change
notifications, cache metadata destruction, multi-process operation and failure
of adapter calls are outside this fixture. JSON restoration is serialization,
not crash-safe disk durability. No Redis, database, CDC, network or external
service is implemented. Passing local checks establishes use of these specified
adapters, not production cache/store atomicity.
