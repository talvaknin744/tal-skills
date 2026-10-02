## Why imp-884 failed

The pages were resumable, but the **delivery failure budget was not**. A’s and B’s shutdowns saved progress and let another host resume, yet each `TaskCancelled` became `queue.fail`. C’s shutdown raised `failure_count` to 3, and the queue moved imp-884 to the dead-letter list before its expected 18-hour run could finish. C’s last durable cursor is absent from the log. [Incident timeline](../final-project/incident.md)

The proposed change is **not yet a graceful drain**:

- `shutdown()` marks health unavailable but does not stop `poll_forever()` from taking deliveries. With one handler slot, additional deliveries may also be waiting in the pool. [Worker pseudocode](../final-project/worker.pseudo)
- `cancel_all()` reaches the handler’s exception path, which calls `fail`; wiring this function to SIGTERM would still spend the failure budget. An 80-second wait followed by `exit(0)` also gives no assurance that every handler stopped and every delivery was settled. [Worker pseudocode](../final-project/worker.pseudo)
- Raising the limit from 3 to 10 only postpones this failure and lets malformed input consume seven extra attempts. It does not prevent a deferred import from landing on another host that the same rollout is about to retire. [Queue contract and rollout order](../final-project/incident.md)

## Bounded shutdown and rollout protocol

1. **Before terminating A, prepare compatible replacement capacity and close claims for the entire retiring worker generation.** Enforce that exclusion in the queue’s claim operation, or pause all retiring consumers and settle pending `take` calls before releasing any delivery. Record running *and reserved* deliveries from the queue’s ownership view. Changing one host’s health status is insufficient.
2. **On the first SIGTERM, fix a 90-second deadline.** Stop polling and new page starts; keep lease renewal and checkpoint dependencies running. Repeated signals must not restart the clock. Use the saved completed-page cursor as the recovery point; finish or stop the current page, then flush a newer cursor if time permits. Replaying from the previous valid cursor is acceptable under the stated page-reprocessing contract.
3. **Settle each owned delivery while the worker is still quiescent.** `ack` only after durable terminal completion. For unfinished work, confirm the cursor and call `defer`, which leaves `failure_count` unchanged; keep renewing the lease until that disposition is confirmed. Route only a *verified planned drain* through this path. Malformed input must still call `fail` and reach the existing limit of 3.
4. **Use internal deadlines within the supervisor’s 90 seconds.** A concrete acceptance target is: handler stopped by 60 seconds, checkpoint or valid prior cursor and `defer` confirmed by 75 seconds, cleanup complete by 80 seconds, leaving 10 seconds of margin. Measure page-stop, persistence, and queue-call bounds before adopting those numbers. Never defer while an old handler can still write. If the bound cannot be met, surface the unresolved delivery; a kill and lost lease can still increment the queue counter under its current contract.
5. **Let only eligible successors reclaim the same `job_id`.** Validate checkpoint meaning across versions and reject stale-owner cursor writes or cleanup with a delivery token or ownership epoch. Track a finite job-age or progress-stall escalation so repeated deferrals remain visible.

For **imp-884**, recovery requires inspecting C’s last committed cursor and effects since that cursor, then validating a compatible successor before an authorized redrive of the same logical job. The supplied log does not establish C’s recovery point.

## Evidence required before accepting the change

Exercise a real supervisor-driven A→B→C rollout and observe: retiring-generation claims stop before A defers; pending receives and reserved deliveries are accounted for; the 90-second deadline and lease renewals hold; each planned handoff keeps `failure_count` unchanged; cursors advance without stale-owner writes; and the import eventually reaches durable completion and `ack`. Separately, verify malformed input still dead-letters on its third failure, plus blocked checkpoint, slow page cancellation, lost lease, repeated SIGTERM, and a crash between page effect and cursor commit.

Log `job_id`, worker generation, delivery/owner token, cursor revision, disposition, and counter before and after each handoff. Alert on unfinished age, stalled cursor, deadline misses, and unresolved ownership. The supplied project contains an incident note and pseudocode, so signal behavior, queue claim exclusion, and these recovery guarantees remain **unverified**; no files were changed or deployments performed.
