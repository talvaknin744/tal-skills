**Rollout decision: stop before cutover.** The supplied plan drops `full_name` while version 1 still reads and writes it. It also treats renaming the retained table back as a lossless rollback, although version 2 may have written new records or values after cutover. Both are blocking gaps in [migration.md](../final-project/migration.md) and [rollout.txt](../final-project/rollout.txt).

### Gaps and stop criteria

| Gap | Stop criterion |
| --- | --- |
| Version 1 becomes incompatible when `full_name` is dropped. | Do not switch while any version 1 process, open transaction, queued job, or replay can still make an account read or write. Verify exclusion at the operation boundary, not from deployment percentages. |
| Version 2 writes only the new fields, so the retained old table cannot contain all post-switch writes. | Do not offer “rename old table back” as rollback. Keep both representations maintained through the rollback window, or prove a durable replay or forward-repair path that preserves every accepted post-switch write. |
| The backfill’s name-splitting rule, concurrent update handling, and completion evidence are absent. | Stop if the mapping is undefined, any required range or replay tail is unfinished, or a consistent comparison shows any unexplained missing, extra, deleted, or value-different account. |
| The cutover takes a lock. Its configured **five second lock timeout** does not make the process lock-free or prove the outcome of a lost reply. | On lock timeout, blocked switch, or unknown result, stop retrying and reconcile the serving table, migration status, worker state, and outstanding locks first. |
| No worker owner or verified stop signal is recorded. | Do not start cutover until a named operator has tested a supported pause or abort action and can observe that the worker stopped. Proposed operational bounds: confirm stop within 30 seconds; if switch state remains unknown after 60 seconds, escalate and keep account mutations held. These bounds are proposals, not guarantees of the supplied tool version. |

### Required state decisions

| Outcome | Serving state and worker decision | Traffic and recovery |
| --- | --- | --- |
| Copying, before switch | Old `account` is authoritative; copy position and catch-up lag are **unknown**. Proposed operator keeps the worker running only while progress and invariants hold, and pauses it at a failed gate. | Keep version 2 new-only paths closed. Resume only from verified durable progress. |
| Switch blocked or confirmed failed | Confirm old `account` still serves; inspect locks and tool status. Proposed operator pauses the worker and resolves the blocker before any retry. | Permit version 1 only after old authority is confirmed. A five second timeout alone is not that confirmation. |
| Switch outcome unknown | Authority and worker state are **unknown**. Proposed operator pauses the worker, checks catalog/routing and migration status, and preserves both tables. | Hold account mutations until authority is known; no cleanup or second switch. Escalate if unresolved within the proposed 60 second decision bound. |
| Switch confirmed successful | Confirm the new table serves and whether the worker finished or remains active. | Exclude version 1 immediately. Admit new-only writes only after data checks and a post-switch write recovery path are proven; otherwise keep a bridge writer that maintains both representations. |

A safe revised order is to retain `full_name`, introduce a bridge that writes both representations, backfill and reconcile, drain version 1 and its delayed work, then enable new-only reads and writes. During rollback, disable **all** new-only reads, including predicates and index queries, and verify fallback before admitting old-only writers. Keep the bridge writer until that boundary is proven. Retire `full_name` only after the rollback path no longer depends on it.

### Validation to perform before any production cutover

1. Record the exact deployed gh-ost version and its stop, timeout, and status behavior; assign the migration operator and verify the stop signal.
2. In a disposable target, hold a conflicting lock from another session. Attempt cutover with the configured five second wait, then check the actual serving table, locks, worker state, and traffic. Release the blocker and verify a supported retry. These are **unexecuted** steps.
3. Build an independent ledger of accepted and rejected account mutations. At one consistent observation cut, compare the complete expected and actual identity sets **in both directions**, plus `full_name`, `given_name`, `family_name`, revisions, updates, and deletes. The project supplies no rows, mapping rule, or ledger, so value correctness is currently unresolved.
4. Exercise version 1, the bridge, version 2, queued work, an intervening update, and rollback **after** version 2 writes. Verify that every accepted write survives and every supported reader returns the intended value.

The supplied atomic rename describes only the local table switch. No migration or validation was run, no external service was used, and no project files were changed.
