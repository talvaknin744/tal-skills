## Current evidence

**The proposed exposure is blocked.** Shard `40-80` is still running the migration and has neither `status_code` nor a usable index. An accepted completion command is not completion. Because requests can reach any shard and restarts share one schema cache, publishing the cache from `-40` and enabling V2 now is unsafe. [rollout.md](../final-project/rollout.md), [fleet.csv](../final-project/fleet.csv)

The independent ledger and complete transformed-table observation disagree at cut 207:

| Key | Expected at cut 207 | Observed |
| --- | --- | --- |
| 11 | `order-a`, rev 1, pending/code 0 | Matches |
| 22 | `order-b`, rev 2, paid/code 1 | Matches |
| 43 | `order-c`, rev 1, paid/code 1 | Missing |
| 99 | Deleted at commit 207 | Extra row at rev 1 |

Commit 206 was rejected, so it does not change key 11. The equal counts of three hide both errors; the backfill cannot be marked complete. The code mapping above follows the supplied rows and should be confirmed against the application contract. [commits.csv](../final-project/commits.csv), [derived.csv](../final-project/derived.csv)

The listed V0, V1, and V2 application writers each advance `source_rev` on business mutations. V0 writes only `status_text`; V1 and V2 write both representations in one row transaction. V0 transactions can commit after deployment and an old payload can replay, while no minimum writer is enforced at commit. Maintenance writers have no supplied contract. Thus “100% V1 deployed” does not establish a V1 writer floor. V1’s fallback remains necessary, and a paid listing that searches only the new index can omit stale or unmapped rows. Handwritten reporting SQL also needs review. [versions.csv](../final-project/versions.csv), [rollout.md](../final-project/rollout.md)

## Bounded exposure sequence

1. **Set the cutover contract.** Identify the database engine’s migration, lock, timeout, and revert behavior; the serving table and shadow-table ownership; every writer and reporting query; and explicit deadlines for switch wait, lag, and the rollback decision. Stop if authority or writer eligibility cannot be established.
2. **Finish schema installation.** Require the same migration UUID to be *complete* on every shard, with the column and usable index present. Then generate and publish a schema cache compatible with every shard, and verify restarted processes and handwritten SQL against it. Do not use a submitted `COMPLETE` command as the gate.
3. **Establish the V1 bridge.** Keep `refund_pending` disabled. Run V1 dual writes and fallback reads, including a listing path that still finds stale rows. Enforce V1 or later at the actual write/commit boundary, or prove older transactions and replayable work have drained and cannot be admitted. Audit maintenance writers before relying on revision guards.
4. **Reconcile the data.** Backfill from a consistent source snapshot and a defined catch-up position. Apply each mapping only while its **incarnation and revision** still match; handle deletes and retries. Repair key 43 and remove key 99, then compare complete source, transformed, and listing-index sets at one observation cut, including values and revisions. A finished cursor or equal counts is insufficient.
5. **Switch authority, if the shadow-table switch is required, then expose V2 reads.** Use the configured lock wait and a named recovery owner. Before or after a confirmed failed switch, retain the proven old authority; after an unknown outcome, reconcile catalog, routing, migration status, and writes before cleanup or retry. After confirmed success, verify catch-up and post-switch writes before code-only reads. Halt exposure at any failed gate.
6. **Enable code 2 separately.** Retire V0 and V1 readers, queued work, and rollback paths first, or provide and verify a lossless way for them to interpret `refund_pending`.

## Rollback limits

A rollback from code-only V2 reads to V1 fallback is supportable only while dual writes, `status_text`, and values V1 understands remain intact. Re-admitting V0 writers requires restoring fallback and stopping code-only predicates first.

Deploying V0 and renaming a retained table is **not an established rollback**. The reverse stream already lags five minutes; a rename could discard post-switch writes. Twenty-four hours of retention does not cover an unbounded replay, an already open transaction, or the catch-up and acceptance time for a 24-hour queued job. Once code 2 is written, V0 and V1 cannot represent that value under the supplied contract. Recovery then needs a verified compatible forward repair or a scoped restore and replay with complete write coverage. [rollout.md](../final-project/rollout.md)

## Checks still to execute

No live database command or rehearsal is supplied as executed evidence. Before exposure, verify all-shard completion and cache restarts; V0 commit rejection or complete drain, including replay; intervening update and delete/recreate with a reused numeric revision; full row and index comparisons against an independent commit ledger; and old/new reader plus reporting-query behavior. In a disposable target, hold a conflicting switch lock, observe the bounded failure and serving authority, then retry; also rehearse rollback after post-switch writes while the reverse stream is behind. Record actual bounds and outcomes before treating any of these as passed. [rollout.md](../final-project/rollout.md)

All supplied files remain unchanged; this review used only local evidence.
