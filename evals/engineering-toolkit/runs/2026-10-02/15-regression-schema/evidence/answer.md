The plan has two release-blocking gaps:

1. **Cut-over breaks version 1.** [rollout.txt](../final-project/rollout.txt) replaces the schema while version 1 clients still use `full_name`. [migration.md](../final-project/migration.md) drops that column at cut-over, so those reads and writes can fail. Version 2 writes only `given_name` and `family_name`, leaving version 1 without a maintained value even if `full_name` is retained.
2. **The proposed rollback can lose writes.** The old table stops receiving writes after cut-over. Renaming it back would omit later writes, and version 2 would encounter the old schema. An atomic rename makes the switch atomic; it does not make rollback lossless. The cut-over also takes a short lock, so “entirely lock-free” is inaccurate.

**Replace the rollout sequence** with a compatible schema and an intermediate client release that maintains both name representations. Backfill using an agreed mapping, including ambiguous names; keep old readers supported while they exist. Close version 1 write admission and drain in-flight and replayable work before dropping `full_name`. Retire it only after the rollback window and its dependent clients have ended.

**Stop criteria to put in the runbook:**

- Do not start without a named migration owner, an exercised way to pause or abort the worker before cut-over, and recorded thresholds for service errors, latency, and replication lag.
- Do not cut over while any eligible client or queued job requires a field being dropped, any writer fails to maintain the required representations, any backfill range or concurrent change remains unapplied, or any account fails the agreed value mapping.
- Stop the cut-over attempt on the configured five-second lock timeout or a schema-related application error. Do not automatically retry before inspecting the lock holder and migration state.
- Do not use table rename as rollback after new writes. Keep a compatible application rollback path, or specify and rehearse how *all* post-cut-over writes will be reconciled or replayed before switching authority.

**Validation to perform before a real rollout:** Test every supported client generation against each schema stage; compare every account’s identity and name values against the agreed mapping, including concurrent updates and deletes; verify the shadow table has caught up at cut-over; and rehearse interruption before cut-over and recovery after version 2 writes. Check accepted writes, rejected writes, and unknown outcomes against an independent commit record—not just row counts or migration-worker success.

This is a review of the two supplied files. I ran no migration, changed no files, and used no external services.
