**The proposed cutover should stop before execution.** [migration.md](../final-project/migration.md) drops `full_name` while version 1 still reads and writes it. The configured cutover also takes a lock and can wait up to five seconds, so “entirely lock-free” is inaccurate. An atomic table rename changes which table serves traffic; it does not copy writes made afterward back to the retained old table. Once version 2 writes only `given_name` and `family_name`, renaming the old table back can lose those writes and leave version 2 incompatible.

[rollout.txt](../final-project/rollout.txt) also lacks a migration-worker owner, a tested pause/abort control, and a decision for a timed-out or uncertain cutover.

### Required gates and stop criteria

- **Before cutover:** Assign a named operator and test how this gh-ost version pauses, aborts, reports status, and resumes. Verify the shadow table’s complete row and value coverage, including concurrent updates and deletes. Stop on any missing, extra, or mismatched row, or unresolved copy/replay position.
- **Before removing `full_name`:** Prove that no version 1 process, open transaction, queued job, or replay can commit another `full_name`-only write. Enforce that at write admission or commit, rather than relying on deployment percentage. Version 2’s read behavior and any other writers are unspecified and must be checked. A bridge version that can maintain both name representations is the proposed compatibility stage; its conversion rules need verification.
- **During cutover:** Treat the five-second lock timeout as a hard stop for this attempt. Do not retry until migration status, serving table, outstanding locks, and worker position are reconciled. A lost reply is an *unknown outcome*, not proof that the old table still serves.
- **After cutover:** Stop promotion on the first incompatible query/write, unexplained committed-write result, or data mismatch. Record the service’s actual error and latency thresholds before rollout; “if a metric worsens” is not an actionable trigger. Preserve the old table and migration artifacts until recovery is settled.

| Outcome | Required recovery decision |
| --- | --- |
| Copying | Old `account` table serves; shadow coverage and worker position are currently unknown. The named operator must be able to pause and verify the worker within a proposed 60 seconds of a stop trigger. No switch while either fact is unknown. |
| Confirmed lock timeout or failed switch | Confirm old-table authority and worker state; pause further attempts and inspect lock cleanup. The lock wait is bounded at five seconds. If status cannot be confirmed within a proposed 60 seconds, handle it as unknown. |
| Unknown switch result | Pause further migration work through the tested control, retain both tables, and hold account traffic that is not proven compatible with either schema. Reconcile catalog/routing, tool status, and committed data. Escalate after 60 seconds if unresolved; do not infer failure or rename a table. |
| Confirmed success | Confirm new-table authority and copier/replay completion before releasing traffic. Block version 1, retain compatible bridge traffic, and decide within 60 seconds whether acceptance checks pass or traffic remains held. Do not rename the old table back after new writes. |

The 60-second response bounds are **proposed operating limits**, not behavior verified in the supplied project. The worker control and named owner are prerequisites because neither is documented.

### Validation to perform in a disposable target

1. Use the deployed database and gh-ost versions. Hold a conflicting lock in a second session for longer than five seconds; observe the actual timeout, serving table, worker state, lock cleanup, and safe retry after releasing it.
2. Exercise every eligible client and delayed writer at each stage. Verify that a version 1 write cannot commit after its drain gate, including a process resuming with a cached schema.
3. Keep an independent ledger of committed and rejected inserts, updates, and deletes during backfill and after cutover. Compare complete identities **and name values** in both directions between the ledger and serving table; check missing, extra, stale, and resurrected rows.
4. Rehearse recovery *after* version 2 writes. Verify a bridge application rollback on the current schema, or a separately designed forward/inverse migration that carries every post-cutover write and proves the name conversion is representable. An immediate old-table rename fails this test.

These are proposed checks; no migration or database validation was run. All files remain unchanged, and no external services were used.
