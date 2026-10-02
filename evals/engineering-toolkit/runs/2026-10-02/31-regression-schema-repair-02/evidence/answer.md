## Review

The rollout in [migration.md](../final-project/migration.md) and [rollout.txt](../final-project/rollout.txt) is **not ready to execute**.

- **The cutover breaks version 1 clients.** They still read and write `full_name` when the plan removes it. The plan also does not say how writes made by version 1 during backfill populate `given_name` and `family_name`, or how delayed jobs and retries are handled.
- **The proposed rollback can lose committed writes.** After cutover, the retained old table does not automatically receive writes to the new serving table. Renaming it back could discard every intervening write. An atomic rename only makes the name switch atomic; it does not make copy, application rollout, and rollback one transaction.
- **The cutover takes a lock.** The stated five-second lock timeout contradicts “entirely lock-free.” A timeout or lost response also needs an explicit check of which table is serving before anyone retries or cleans up.
- **Completion and ownership are undefined.** There is no row-and-value reconciliation, catch-up rule, worker stop signal, recovery owner, or decision deadline. The database and gh-ost versions, exact cutover status contract, and retained-table behavior are not supplied.

## Required rollout gates

1. **Before backfill:** Assign a migration owner and service owner; verify the exact tool/database cutover and stop controls. Define the `full_name` ↔ name-fields mapping, including nulls and names that cannot be split or reconstructed without loss. Inventory all readers and writers, including jobs, retries, and open transactions.
2. **Before cutover:** Keep `full_name` on the serving schema. Prove every writer still eligible at commit time maintains the fields its readers need, or drain and block that writer. Reconcile the complete account identity set and mapped values, including updates and deletes; require **zero unexplained mismatches, missing ranges, or unapplied changes**. Do not cut over while version 1 can reach a schema without `full_name`.
3. **Before admitting version 2:** Establish a tested recovery path for writes made after cutover. One option is to keep both representations current in the *serving* table through a rollback window and test a reverse schema change on that current table. Returning to a stale old table requires a complete, durable replay and reconciliation of post-cutover writes. Version 2’s stated new-fields-only writes do not meet either condition by themselves.
4. **During promotion:** Stop immediately on the five-second lock timeout, an uncertain cutover response, any schema error, any unexplained data mismatch, or a breach of the service’s agreed latency/error limits. Those numeric service limits must be recorded before starting. Freeze further client promotion and reconcile serving state before retry or cleanup.

## Cutover outcome record to add

These are **proposed actions**, not observed database behavior. Assign named people and rehearse the proposed 60-second worker-control and five-minute decision bounds before rollout.

| Outcome | Serving state and action |
| --- | --- |
| Copying, before switch | Old table serves; shadow coverage and worker position must be recorded. Migration owner may continue only while catch-up and validation pass. On a stop trigger, pause or terminate the worker within 60 seconds using a verified control; keep version 2 closed. |
| Confirmed failed switch | Confirm old table still serves, inspect locks and worker position, stop the worker within 60 seconds, and verify lock release. Do not retry until the blocker, copy coverage, and catch-up state are known. |
| Unknown switch outcome | Serving table and worker state are **unknown**. Freeze promotion and incompatible writes; permit only traffic proven compatible with either state. Migration owner and service owner inspect catalog/routing, gh-ost status, and committed data. If unresolved after five minutes, keep the rollout stopped and escalate; do not rename or clean up either table. |
| Confirmed successful switch | New table serves; verify the worker’s documented completed state and retain recovery artifacts. Reconcile post-switch commits before accepting the stage. If validation fails, stop incompatible admission and use the tested repair/reverse path—not an immediate old-table rename. |

## Validation to perform in a disposable target

- Run version 1, a compatible bridge version, and version 2 against each schema stage; include a delayed version 1 job and an open transaction crossing the cutover boundary.
- Hold a conflicting lock in a separate session, attempt cutover, and verify the observed wait, timeout or abort, serving table, worker state, and lock cleanup. Then release the lock and test a supported retry.
- Use an independent ledger of committed writes and deletes. Compare **complete identities and values in both directions** at one defined observation cut, including intervening updates, deletes, null or ambiguous names, and post-cutover writes.
- Rehearse a lost cutover response and a rollback request **after** new writes. Verify that the chosen recovery path preserves every committed value and that each client allowed back can read and write it.

No migration or validation was run, and no files were changed.
