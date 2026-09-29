# Projection contract

This local model projects one authoritative source log, identified as `catalog-v1`,
into a string-key/string-value cache. Source sequence numbers are nonnegative integers with one
meaning in this log incarnation. They are not wall-clock times. Live events have
`sequence`, `key`, `kind` (`put` or `delete`), and a `value` for puts. Live events may arrive out of order and may be redelivered. Each sequence
identifies one immutable event. Caller input is trusted and well formed; handling
conflicting duplicates, other log incarnations, or malformed events is out of scope.

`Projection(state=None)` starts empty or restores its own JSON-serializable
`dump_state()` output. `view()` returns a detached dictionary of visible keys.
`apply(event)` applies a live event atomically. A duplicate or older event cannot
regress state, including after restart. Deletes have no visible value. Independent
keys can have different newest event sequences.

`install_snapshot(rows, at_sequence, before_publish=None)` receives a detached,
complete source snapshot as of that sequence. An absent key was absent at that
source boundary. Snapshot acquisition already happened: the method first copies
its inputs, then calls `before_publish()` exactly once when supplied, and only then
publishes. The callback is a diagnostic barrier; live `apply`, `view`, and
`dump_state` must continue while it waits. Do not hold an exclusive projection lock
across the callback, omit it, or change its position after publication.

Publication preserves all live events newer than the snapshot boundary, including
deletions. An older snapshot cannot replace a newer published baseline. A snapshot
can remove stale keys that are absent at its boundary. Events at or below a
published snapshot boundary add no information and cannot revive removed keys.
All public methods must be safe when the verifier invokes them concurrently.

Restart means JSON round-tripping the returned state into a fresh Projection;
retained ordering information must still reject stale snapshots and live events.
This models state serialization, not crash-atomic disk persistence. Snapshot install
and individual live events are atomic within one process; no multi-process cache,
CDC client, stream reconnect, storage durability, or network behavior is supplied.
