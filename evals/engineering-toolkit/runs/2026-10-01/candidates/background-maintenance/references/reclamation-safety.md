# Reclamation safety

Use when maintenance rewrites, moves, backfills, rebuilds, publishes, or deletes data, or
when workers can pause, restart, or transfer ownership. Apply these application
requirements through the actual storage engine's supported primitives.

## Publish before retiring

Trace one unit from a versioned input or snapshot through durable output,
authoritative publication, reader transition, and source retirement. Identify
which operation proves each boundary. Successful I/O or a buffered-copy return
does not by itself prove the required durability. A checkpoint must identify
the inputs and publication version needed to resume coherently.

Concurrent writes, deletes, and other maintenance can invalidate a selection.
Revalidate the relevant versions at an enforceable publication boundary, or use
a compatible snapshot/log protocol provided by the engine. Preserve deletion
markers and retention, repair, replication, and active-reader requirements.
An index rebuild needs a defined reader switch and update catch-up rule; a
rebalance needs the required placement and read/write routing through movement.
Neither inherits those guarantees from a compaction analogy.

Retire a source only with authoritative evidence that its replacement is durable
and all applicable references, readers, and retention conditions permit it.
Keep that evidence valid through deletion: close new reference/reader/hold
admission at the authority or use the engine's equivalent protection. A zero
count followed by new admission is insufficient for immutable retirement proof.
Separate discovering obsolete data from physically freeing it. Preserve the
evidence needed to recover after publication but before cleanup; make orphaned
output and incomplete retirement discoverable and bounded.

## Backfills and rebuilds

Define bounded source membership and the source contract for a snapshot,
resumable cursor, or scan plus catch-up. Persist progress in that contract's
identity/version domain. A cursor reaching its endpoint does not establish
complete coverage when inserts, deletes, or key changes can cross the cursor
while the scan runs. Separate an incomplete scan, a completed bounded scan, and
the required caught-up or published state.

Apply transformed results conditionally so replay or an older snapshot cannot
overwrite a newer authoritative value. Specify handling of concurrent mutations,
missing source records, and partial destination updates before marking completion
or switching readers. Snapshot coverage and catch-up guarantees come from the
actual source/engine contract; this is an independent application requirement,
not a mechanism established by the compaction sources.

## Ownership and uncertain work

Claim work at its authority and preserve a stable work identity across attempts.
Where exclusive publication or deletion matters, enforce the current version,
ownership epoch, or equivalent safety condition at that protected operation.
A pre-effect lease check can become stale while a worker pauses. A completion
update rejecting the old owner cannot undo earlier publication or deletion.

Define recovery at each durable boundary: before output durability, after durable
output but before publication, after publication with a lost response, and after
retirement authorization but before physical cleanup. Reconcile from durable
evidence instead of treating a timeout or absent worker as proof of no effect.
Use the engine's atomic boundary or durable protocol; when it cannot enforce the
invariant, state the gap and choose a compatible mechanism before destructive
work. A valid immutable retirement proof may be sufficient for cleanup even
after ownership changes; evaluate the proof's scope rather than imposing leases
on every cleanup operation.

Resume and cancellation must preserve semantic outcomes and release bounded
resources. Revalidate mutable eligibility and input versions, retain committed
progress, and leave unresolved work observable. For broader handoff or duplicate
effect protocols, compose the companion skills named in the entrypoint when
available; these checks define the local maintenance boundary.

## Engine expiration

Verify deletion and reclamation safety in the deployed engine, including retained
versions, tombstones, repair, and reader semantics. A TTL or apparently expired
file alone may not prove it is safe to drop. The reviewed Cassandra 5.0 UCS
documentation warns that `unsafe_aggressive_sstable_expiration` skips shadowing
checks and can make deleted data reappear. Treat that as a concrete correctness
boundary, not a generic way to accelerate reclamation.

The lifecycle above is original verification synthesis. The Dropbox account
and UCS documentation do not establish a universal durable handoff, fencing,
or reclamation protocol; [the ledger](sources.md) records their limited scope.
