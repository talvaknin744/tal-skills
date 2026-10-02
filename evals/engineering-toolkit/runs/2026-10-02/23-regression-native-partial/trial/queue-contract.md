# Queue fixture contract

This is a specified local queue contract, not a claim about a named cloud queue.
Work takes up to 18 hours and is resumable in stable 100-item batches. Admission
checks and claims run independently from HTTP readiness. A claim begun before the
admission stop can still complete. Queue items contain immutable accepted input
IDs and version-2 checkpoint references; these inputs are retained for 30 days.

Each job has `failure_count`, initially zero, and `maintenance_deferrals`, initially
zero. `fail(job, generation, reason)` increments failure count and dead-letters on
the third real failure. `defer(job, generation, verified_checkpoint_ref)` releases
ownership for a compatible successor and increments only maintenance deferrals.
Defer is allowed only for a confirmed durable checkpoint and current ownership.

The store atomically fences progress/effect commits by current ownership generation.
The queue exposes `inspect(job)` to resolve a lost response to checkpoint/defer.
An unconfirmed write may already exist and must be reconciled against the store.
New claims receive a larger generation. A killed owner eventually loses its lease;
lease expiry alone consumes no business failure. The successor resumes from the
last confirmed checkpoint and reconciles effect IDs before replaying the batch.

Checkpoint writes normally finish within five seconds; this is an observed p99,
not a hard upper bound. The current store can be unavailable. The grace deadline
remains 90 seconds. Planned replacement can reach A, B, and C while one job runs.
The poison-job control always fails its business calculation and must exhaust
exactly three genuine failures. Planned deferrals must not make poison work immortal.

All records here are synthetic planning facts. No cluster, durable queue, kill
test, 18-hour execution, or checkpoint-store fault has been run for this fixture.
