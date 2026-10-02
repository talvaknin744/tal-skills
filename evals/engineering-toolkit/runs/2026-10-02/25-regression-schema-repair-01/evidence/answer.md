The proposed cutover should **stop before step 2** of [rollout.txt](../final-project/rollout.txt). It replaces the table while version 1 clients still read and write `full_name`, which [migration.md](../final-project/migration.md) says will be dropped.

| Gap | Required gate or recovery decision |
| --- | --- |
| Incompatible client order | Keep `full_name` available until no version 1 write can commit, including open transactions, queued jobs, and retries. Prove version 2 reads and writes remain compatible during the overlap. |
| Incomplete copy evidence | Record full backfill coverage and the change-replay position. Before cutover, reconcile inserts, updates, deletes, and name values against a fixed source position; require **zero unexplained differences**. |
| Lock-free claim | The stated atomic cutover acquires a lock. Its five-second lock timeout is a **stop signal**, not proof that the operation cannot block. On timeout, inspect the serving table and migration worker before any retry. |
| Rename called “rollback” | Renaming the old table back can hide writes made to the new table after cutover. Version 2 writes only the new name fields, so old readers may also be unable to use those writes. Specify a supported reverse-sync or forward-repair procedure, including how every post-cutover write is preserved and represented. |
| No decision owner or state record | Assign an operator and record the serving table, shadow/old table identities, worker and replay position, outstanding locks, and permitted traffic at each decision point. A lost cutover reply must be treated as **unknown outcome** until those facts are reconciled. |

**Concrete stop criteria:** Do not attempt cutover with any eligible version 1 writer, unresolved backfill or replay event, unexplained row/value mismatch, or unassigned recovery owner. Stop automatic promotion or retry on a five-second lock timeout, an unknown cutover outcome, any schema compatibility error, or a breach of the service’s predeclared error and latency limits. After a confirmed cutover, preserve the new table and its writes while deciding repair; do not automatically rename the old table back because a metric worsens.

**Validation to perform in a disposable environment:** Run both client generations through each proposed schema stage; include an in-flight version 1 transaction and a delayed job. Compare complete row identities and `full_name` ↔ `given_name`/`family_name` values, including intervening updates and deletes. Hold a conflicting lock from another session, attempt cutover, and verify the five-second timeout outcome, serving table, worker state, lock cleanup, and controlled retry. Then test successful cutover with new writes and rehearse the documented recovery path, proving those writes remain visible and usable.

These are proposed checks only. I read the two supplied files, changed none, and ran no migration or external service.
