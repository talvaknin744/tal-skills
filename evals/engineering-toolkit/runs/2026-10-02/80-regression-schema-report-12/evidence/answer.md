**The rollout should stop before cutover.** [migration.md](../final-project/migration.md) drops `full_name` while version 1 clients still read and write it. [rollout.txt](../final-project/rollout.txt) explicitly keeps those clients running. The proposed cutover would make them incompatible with the serving table.

| Gap | Required correction |
| --- | --- |
| “Entirely lock-free” claim | Record the short cutover lock and five-second lock timeout. A timeout needs an authority check before retry; it does not, by itself, prove which table is serving. |
| Lossless rollback claim | Renaming the old table back would omit post-cutover writes to the new table. Version 2’s new-column-only writes also lack a stated way to restore `full_name`. Specify and rehearse a write-preserving rollback or forward repair. |
| Missing compatibility stage | Retain `full_name` while version 1, open transactions, and queued or replayed work can use it. A bridge writer that maintains both representations is needed for a rollback window; its behavior is not specified. |
| Backfill proof | Define the name transformation, catch-up rule, delete handling, and complete value comparison. A finished copy or matching row count is insufficient. |
| Worker ownership | Name a migration on-call owner, a tested worker stop/pause control, durable progress to retain, and who decides whether to retry after interruption. |

**Proposed stop criteria:** Do not attempt cutover while any version 1 writer can commit against a schema without `full_name`, while any eligible writer’s representation contract is unknown, or while even one required account is missing or has a mismatched value. Abort the cutover attempt on the configured five-second lock timeout. Stop new-version admission and retries immediately if the serving table is uncertain, a schema error appears, or the migration worker’s state cannot be established. Before starting, the service owner should also set numeric error-rate and latency limits from the current baseline.

**Cutover decisions to document and rehearse:**

| Outcome | Authority, worker, traffic, and bounded action |
| --- | --- |
| Copying | Old table serves; shadow coverage is partial. Migration on-call pauses or stops the worker within a proposed 30 seconds of a stop trigger, records its durable position, and permits only traffic compatible with the old schema. |
| Confirmed failed switch | Verify the old table still serves, inspect locks and worker state, stop further cutover attempts within 30 seconds, then retry only after catch-up and lock clearance are confirmed. |
| Unknown outcome | Stop retries and new-only admissions immediately. Within a proposed 60 seconds, reconcile catalog/table names, routing, migration status, locks, and committed writes. Escalate and keep incompatible traffic fenced if authority remains unproven. |
| Confirmed success | Verify the new table serves and record worker disposition within 60 seconds. Under the submitted schema, version 1 traffic must be stopped; rollback cannot be declared safe until post-switch writes have a tested preservation path. |

**Validation, without executing it here:** In a disposable target, hold a conflicting lock from a second session, attempt the switch, and verify the five-second timeout, serving table, worker state, lock cleanup, and safe retry. Then rehearse a successful switch with version 1 and version 2 reads and writes, an intervening update, a delete and recreate, delayed work, and rollback after new writes. Compare complete account identity and value sets in both directions against an independent commit ledger, including missing, extra, deleted, and changed rows.

The supplied files provide no commit ledger, bridge-writer contract, worker control, or observed database result. Those checks remain **unresolved**, including independent value correctness, cutover behavior in the deployed engine, and coverage of every foreground writer. No migration was run and no files were changed.
