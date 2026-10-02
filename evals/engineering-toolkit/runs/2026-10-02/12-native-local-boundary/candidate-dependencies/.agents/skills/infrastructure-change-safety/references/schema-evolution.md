# Schema and representation evolution

Use when an online backfill, index change or persisted-format transition overlaps
reader/writer generations or shard completion. Keep schema installation, data
coverage/catch-up, index usability and application exposure as separate gates.

## Publish a usable schema

Identify every participating writer, reader, cached schema and delayed job.
Specify which representations each stage can maintain and interpret. Observe
completion on every required shard before exposing a column or publishing a
shared schema cache; an arbitrary shard's response or a submitted completion
command does not prove fleet readiness. Include handwritten SQL and external
writers when an ORM excludes a transitioning field.

Use the selected engine's build, validation and publication protocol. In an
F1-style index transition, every eligible writer must maintain the new index
before backfill begins; reads wait for reorganization/publication. F1's
intermediate permissions and commit-time schema leases describe that historical
engine design, not application deployment leases or a portable database API.

## Protect concurrent transformation

First establish that every relevant writer, including old-only writers,
atomically advances the authoritative source revision on every business
mutation. Otherwise revision equality cannot detect stale data; choose another
enforceable change-detection protocol. Read source identity, incarnation, revision
and payload from one consistent snapshot. Where delete/recreate can reuse identity/revision, use a non-reused
incarnation or equivalent durable version. Apply a derived value conditionally
against both the observed incarnation and revision; replay cannot overwrite a
newer mutation or a replacement entity. Specify deletion and retry handling,
bounded source membership, coverage and the actual snapshot/log catch-up rule.
Completion of a cursor alone does not establish those conditions.

If old writers leave a new representation stale, readers must retain a supported
fallback until those writers lose eligibility and reconciliation completes.
For example, a bridge can write old/new values and source/mapped revisions in one
local transaction. Read all compatibility fields in one row snapshot; trust the
new value only when non-null source/mapped revisions match and the value is supported.
A predicate using only a new-field index can miss stale/unmapped rows, even if
point lookups fall back correctly. Cross-store dual writes need their own durable
partial-success and repair protocol.

## Preserve the writer floor through rollback

Before making new-only reads authoritative, close incompatible writer admission
and account for queued/replayed work and open transactions. Enforce eligibility
at the actual write/commit boundary or establish that those writers drained.
Deployment percentages and process heartbeats are insufficient evidence.

During the rollback interval, retain writers that maintain both representations
and values/schema old readers can interpret. Keep rollback writes through that
bridge. Before admitting old-only writers, restore the reader fallback and stop
new-only predicates, or keep the writer floor. After incompatible new values or
destructive retirement, select a compatible forward repair or scoped
restore/replay path. A retained table or recreated column alone does not recover
post-switch writes or discarded values. Verify the deployed engine's revert
strategy, retained artifacts, catch-up and representability limits.

## Verify the expected state

Force an intervening update, delete/recreate with a reused numeric revision,
partial shard completion, a cached-schema restart and an old writer resuming
across the eligibility boundary. Rehearse rollback after new writes.

Use an independent ledger of definitive commits/rejections and expected
identities/values; reconcile unknown outcomes and choose one supported
observation cut. Enumerate expected and actual base/transformed/index results
and compare complete sets in both directions, including extra/resurrected rows
and orphan entries. Do not derive expectations from migration code or job
success. Report proposed checks separately from executed database evidence.
Source scope and engine-specific limits are in [sources.md](sources.md).
