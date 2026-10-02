# Billing-export service

This bundle is authored synthetic evidence shaped like a local release review.
It is not captured production output, a Kubernetes API response or a completed
rollout rehearsal. Times within each schedule are independent. Each export is
identified by `(tenant_id, export_id)` across queue deliveries and worker revisions.
Exports run for 12–24 hours in checkpointable 100-row batches.

The product promises a durable result for each accepted export, or a terminal
business failure with its recorded cause. A controlled retirement leaves the
logical export eligible to continue. The business failure limit is three;
malformed records remain subject to that limit. Maintenance accounting and
business failure accounting are distinct fields in the job record.

## Queue and storage interfaces

- `receive()` reserves a delivery; the worker can have a buffered delivery that
  has not entered its handler. A receive already in flight may return after the
  poll loop's stop event is set. Readiness controls inbound HTTP routing, not
  queue receives or buffered handler admission.
- `claim(key, worker_revision)` returns an ownership epoch and server-confirmed
  lease expiry. `renew(key, epoch)` and `release(key, epoch)` compare the current
  epoch; a stale release cannot clear a successor's claim. Server authority owns
  lease time. Losing a lease is not itself a business failure.
- `commit_batch(key, epoch, operation_id, rows, cursor, format)` atomically checks
  current ownership and unexpired lease, deduplicates the stable operation ID,
  publishes rows and advances the durable cursor. The older `save_progress`
  interface writes progress without this epoch/effect transaction.
- `finish(key, epoch, result_id)` atomically checks ownership and stores one
  durable final result receipt. A redelivery after an ACK response is lost can
  inspect that receipt. Stable batch/result identities survive process changes.
- `inspect(key, operation_id=None)` returns durable progress, ownership, an
  operation receipt when present and the final result receipt. A client timeout
  alone says nothing about whether a mutation committed.
- `maintenance_defer(key, epoch, checkpoint_receipt)` requires current ownership
  and confirmed compatible durable progress. It increments maintenance_deferrals
  and releases the claim without incrementing business_failures.
- `business_fail(key, epoch, cause)` increments business_failures and dead-letters
  on the third business failure. `ack(delivery)` removes that delivery; completion
  ACK is valid only when the final result receipt exists. ACK is not a checkpoint.

Input manifest `accepted-manifest-v2` and layout `export-layout-v2` are required
to interpret version-2 checkpoints. Revision 7 reads and writes format 2.
Revision 8 reads formats 2 and 3, but its configured default write format is 3.
Revision 7 cannot read format 3. A revision-8 new-job smoke test is the only
compatibility rehearsal present. Jobs with no final receipt still need their
inputs and an executable continuation path; the smoke test does not establish
backward continuation or rollback after format-3 progress is written.

The platform grants one 90-second termination budget, including the 15-second
preStop hook. The hook in deployment.json currently only sleeps. The worker gets
the remaining time after the hook, and the platform can kill it at the original
deadline. Typical checkpoint latency is five seconds, not a maximum. New worker
capacity and compatibility must exist before another accepted-work owner is
retired. A PDB limits voluntary eviction admission; this specified ordinary
Deployment rollout is controlled by its RollingUpdate strategy, not a job-aware
PDB gate. No cluster action is authorized by this local preparation assignment.
