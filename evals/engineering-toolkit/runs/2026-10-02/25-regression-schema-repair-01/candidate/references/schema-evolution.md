# Schema and representation evolution

Use when schema cutover, online backfill, index change or persisted-format
transition overlaps reader/writer generations or shard completion. Keep schema installation, data
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

## Record cutover authority and recovery

For a table/index authority switch, fill a state record from the selected
engine's lock, timeout and migration-status contract. In each row name the
serving object/schema, copy or replay worker state, recovery owner, stop trigger,
maximum wait/decision time and permitted traffic. Use actual identities and
bounds; a named owner or threshold without the surviving state is incomplete.

| Outcome | State and recovery decision to establish |
| --- | --- |
| Before switch / copying | Current authority serves; record partial destination coverage and worker position. The owner can pause/stop within its budget and resume from supported durable progress. |
| Blocked or confirmed failed switch | Confirm which authority remains serving, outstanding locks and whether workers continue, pause or terminate. Apply the bounded abort/cleanup path; retry only after that state and catch-up eligibility are established. |
| Unknown switch outcome | Reconcile catalog/routing, migration status and durable data before destructive cleanup or another switch. Preserve compatible traffic where proven; bound investigation and escalate unresolved ownership/state rather than infer failure from elapsed time. |
| Confirmed successful switch | Confirm new authority and worker disposition; preserve post-switch writes. The owner has a bounded acceptance decision and either continues, stops incompatible admission or uses the supported forward/rollback repair with complete write coverage. |

An atomic local switch does not make copy, application rollout and rollback one
atomic transaction. Declare the timeout outcome the engine actually guarantees;
a client timeout or lost reply may require the unknown-outcome row.

## Protect concurrent transformation

Before relying on revision guards, produce a matrix for **every writer generation
eligible in each stage**, including old, bridge, current/new, maintenance and
replayed work. For each entry state whether every business mutation atomically
advances the authoritative revision, which representations/values it maintains,
the code or supplied contract evidence, and its enforced admission/drain boundary.
Report each generation's evidence explicitly; unknown maintenance blocks that
guard and revision-equality reads. Closing admission later cannot repair an
unsafe overlap. Choose another enforceable change-detection protocol if needed.

Read source identity, incarnation, revision
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

For a locking cutover, propose or run a disposable-target rehearsal with an
independent session holding the conflicting lock. Attempt the switch with its
configured wait bound; observe blocking and bounded timeout/abort. Assert the
declared serving authority, worker state, lock cleanup and traffic behavior
afterwards. A confirmed failed atomic switch should preserve its documented
pre-switch authority; an ambiguous timeout requires reconciliation. Release the
blocker, then verify a supported retry and successful cutover with post-switch
writes and every supported client. State expected observations even when the
rehearsal is unexecuted.

Use an independent ledger of definitive commits/rejections and expected
identities/values; reconcile unknown outcomes and choose one supported
observation cut. Enumerate expected and actual base/transformed/index results
and compare complete sets in both directions, including extra/resurrected rows
and orphan entries. Do not derive expectations from migration code or job
success. Report proposed checks separately from executed database evidence.
Show value and revision differences as well as missing/extra identities. In a
review, give the expected mapping and complete comparison for the supplied
observation cut; if only keys or counts were checked, leave value correctness
unresolved. A proposed later value check is not an observed value comparison.
Source scope and engine-specific limits are in [sources.md](sources.md).
