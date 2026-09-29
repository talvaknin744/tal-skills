# Graceful draining of long-running jobs: primary-source research

Researched 2026-09-29. This report addresses a 12–24 hour logical job that is interrupted on three successive worker pods during one deployment and exhausts a retry budget of three. It distinguishes documented platform behavior from the proposed design. No live cluster, broker, or application was available; the scenarios below are proposed evaluations, not executed tests.

## Diagnosis and scope

**Synthesis:** the failure joins three different lifecycles: the business job, a worker's ownership interval, and a deployment generation. A shutdown becomes a failed business attempt, and work is reassigned to another member of the generation being retired. The job can therefore fail without three business failures. Increasing the retry count changes how many interruptions it survives; it does not establish a safe handoff.

Before recommending configuration, identify what “job” and “retry” mean in this application:

| Actual mechanism | Evidence to inspect | Where the budget lives |
| --- | --- | --- |
| Queue consumer inside a Deployment | Consumer acknowledgment mode, visibility/lease renewal, receipt history, worker signal handler | Broker delivery count, application ledger, framework retry count, or several simultaneously |
| Kubernetes `Job` | Owner reference, `restartPolicy`, `backoffLimit`, `podFailurePolicy`, `activeDeadlineSeconds` | Job controller and possibly an application budget |
| Durable workflow plus workers | Execution history, activity/workflow attempt policy, version routing, worker ownership | Workflow engine; activity retries and workflow retries are different |
| Custom database-backed worker | Claim transaction, owner/epoch fields, lease expiry, checkpoint transaction | Application state machine |

This distinction prevents a Kubernetes Job policy from being offered as a fix for a queue worker whose application has already marked the logical job failed.

## What the primary sources establish

1. **A termination hook has a budget, not an assurance of completion.** Kubernetes starts the grace-period countdown before `preStop`; the hook completes before the stop signal is sent. Hook time and application shutdown time consume the same allowance. A long sleep can leave too little time to save progress. [Container lifecycle hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/)

2. **Termination and endpoint changes are concurrent control-plane activities.** Terminating endpoints advertise `ready: false`; `serving` can distinguish ongoing draining. After the grace period, remaining processes are killed. Force deletion removes the API object without waiting for confirmation that the process stopped. Consequently, API disappearance is not proof that an old writer is dead. Confirm the container's actual stop signal and that PID 1 forwards it. [Pod lifecycle and termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#termination-of-pods)

3. **A Deployment controls replica availability, not business completion.** `maxUnavailable` and `maxSurge` shape replica replacement. A long-running terminating pod can continue consuming capacity alongside replacements. `progressDeadlineSeconds` reports stalled progress; it is not a business-job deadline or automatic recovery policy. The optional terminating-replica status field depends on Kubernetes version and feature-gate support. [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

4. **PDBs do not constrain a Deployment's own rolling update.** They participate in eviction decisions, while direct deletion can bypass them. The `DisruptionTarget` condition has particular documented reasons, including eviction API, preemption, and certain kubelet/controller actions. Do not assume every deletion, exit 137/143, or rollout has that condition. [Disruptions](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)

5. **Kubernetes Jobs have a targeted budget fix.** Pod failure policy is stable since 1.31 and requires `restartPolicy: Never`. An `Ignore` rule matching `DisruptionTarget` excludes matching failures from the Job backoff counter and permits replacement; rule order matters. It does not preserve in-memory progress or make effects unique. Kubernetes also documents that the same program can sometimes start twice even with parallelism and completions set to one. [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/), [worked disruption-policy example](https://kubernetes.io/docs/tasks/job/pod-failure-policy/)

6. **A queue can count delivery rather than business failure.** SQS `maxReceiveCount` controls redrive after repeated receives. An application-only “do not increment retry” flag does not change the broker's count. DLQ retention and redrive behavior also belong in recovery planning. [SQS dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)

7. **A 24-hour lease assumption can be invalid.** SQS visibility cannot extend beyond 12 hours from the original `ReceiveMessage` request; heartbeat extensions do not reset that ceiling. AWS recommends smaller steps or an orchestration service for longer work. This is a concrete reason to inspect platform limits before suggesting a 24-hour visibility timeout. [SQS processing duration](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/best-practices-processing-messages-timely-manner.html)

8. **Stopping admission and releasing deliveries are separate operations.** RabbitMQ consumer cancellation prevents future deliveries but does not discard or requeue already dispatched messages. Its acknowledgment timeout can close a channel and requeue deliveries. The current documentation gives a 30-minute default and says that from 4.3 acknowledgment timeouts apply only to quorum queues; verify the deployed version and queue type. [RabbitMQ consumers](https://www.rabbitmq.com/docs/consumers)

9. **A disconnected worker may already have produced an effect.** RabbitMQ automatically requeues unacknowledged deliveries when their channel or connection closes. SQS standard queues explicitly provide at-least-once delivery. A checkpoint, acknowledgment, and external effect therefore cannot be assumed to succeed together merely because the worker executes them in sequence. [RabbitMQ acknowledgments](https://www.rabbitmq.com/docs/confirms#automatic-requeueing), [SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html)

10. **Framework versions change drain behavior.** Celery's warm shutdown waits for executing tasks, but version 5.6 changed prefork shutdown to keep broker heartbeats running; earlier versions could lose their connection while waiting. Soft shutdown, introduced in 5.5, is time-limited and disabled by default. Reserved ETA work needs separate attention. A “graceful shutdown enabled” claim needs the actual framework version and configuration. [Celery 5.6 worker guide](https://docs.celeryq.dev/en/stable/userguide/workers.html#worker-shutdown)

11. **Expiry does not fence an old owner.** Kleppmann's analysis demonstrates a paused process resuming after its lease expires. A monotonically increasing fencing token works only when the protected storage/resource checks it and rejects older writes. Checking a lease locally before a remote mutation leaves a timing gap. [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)

12. **Durable intermediate state is an established recovery technique.** Google's SRE Workbook explains checkpointing for interrupted or rescheduled long-running pipelines and idempotent mutations for safe reprocessing. It also describes correctness and freshness objectives, selective reprocessing, and canaries that compare output before applying production mutations. This is the most directly useful freely accessible book chapter for this skill. [SRE Workbook: Data Processing Pipelines](https://sre.google/workbook/data-processing/)

## Proposed protocol: synthesis from those constraints

Design against two independent promises: **safety** (no lost job, skipped committed work, duplicate irreversible effect, or stale-owner overwrite) and **liveness** (the logical job eventually progresses or reaches an explicit, observable terminal decision). Preserving the retry budget alone proves neither.

Use a stable logical job ID across worker changes. Record worker generation, ownership epoch, durable checkpoint revision, input/schema version, logical deadline, business-failure count, and interruption history separately. Derive the minimal fields from the actual engine: use its durable primitives when available rather than adding a competing scheduler.

1. **Prepare an eligible destination.** Start sufficient compatible capacity before retiring owners. Establish which generation may claim new or resumed jobs. Mark the retiring generation ineligible before it can receive a handoff; stopping only pod A still lets B or C reclaim the same job immediately before their own termination. Apply the exclusion at the authoritative claim/admission point, not solely in readiness or a locally cached flag. Account for claims already in flight when the gate changes.
2. **Quiesce each retiring worker.** Stop HTTP job admission, polling, prefetch, and internal scheduling as applicable; readiness alone does not stop an outbound queue consumer. Track admitted/reserved work and children. Keep the dependencies required to finish or checkpoint alive, including broker heartbeats and the storage/network path. Expose a distinct draining state without turning an otherwise healthy drain into a liveness failure.
3. **Finish or checkpoint within a measured bound.** If remaining work fits the shutdown budget, finish and durably record its outcome before acknowledging completion. Otherwise reach a safe checkpoint, commit resumable progress, and transfer eligibility through a durable mechanism. Checkpoint publication must account for effects since the previous checkpoint; an opaque progress percentage is insufficient. If progress and queue transfer cannot be atomic, use an existing durable outbox/claim record with reconciliation rather than acknowledging and hoping a subsequent publish succeeds.
4. **Transfer ownership safely.** Claim the next ownership epoch atomically; require conditional checkpoint/final-state writes for that epoch. Fence every mutable resource that needs exclusivity, or supply its idempotency/reconciliation contract. The old owner must not clear a newer lease during cleanup. If a third-party effect offers neither fencing nor deduplication, an ambiguous outcome needs reconciliation before another attempt; do not label it a successful handoff.
5. **Retire on evidence.** Require either durable terminal completion or a recoverable continuation with valid ownership semantics. Observe the successor resume, the old worker cease protected writes, and the old generation's owned/reserved work reach zero before retirement. Checkpoint incompatibility between releases is a deployment blocker requiring migration or retention of compatible workers.

Choose one of two operational strategies explicitly:

| Strategy | When suitable | Required consequence |
| --- | --- | --- |
| Retain old workers until their jobs finish | Work cannot checkpoint, coexistence is safe, and the infrastructure can support the maximum drain duration | Separate admission from lifetime; budget overlapping capacity and keep old code/config available. A normal rolling restart alone is insufficient. |
| Bound the work slice and resume durably | Long jobs have safe checkpoints or can be expressed as durable steps | Test progress restoration and mixed-version compatibility; choose checkpoint frequency from recovery cost and persistence overhead. |

A long termination grace period can support the first strategy for a planned rollout, but cannot be its crash-recovery story. If the platform cannot preserve the pod for the required duration and the computation cannot resume, state that limitation rather than promising successful draining.

## Retry and recovery policy

**Synthesis:** classify a verified planned interruption separately from a business exception, poison input, user cancellation, or unknown-outcome effect. Preserve the logical job's failure budget on a safe continuation, while retaining interruption telemetry and separate progress/deadline controls. This is not a blanket instruction to ignore every killed process or make retries unlimited.

Inspect all counters before changing one: broker delivery limits, framework attempts, application business failures, Kubernetes backoff, workflow/activity retries, and deployment health deadlines. A change in one layer may leave another layer exhausting first. If the broker cannot distinguish interruption from failure, design continuation/durable ownership around its actual redelivery contract and retain a recovery path from the DLQ. Do not invent a native “ignore deploys” feature.

For jobs already failed during a rollout: identify the last durable checkpoint, reconcile uncertain effects, establish current ownership, verify a compatible worker, and resume/redrive with the original logical identity. Record operator actions. Alert on oldest unfinished job, time since durable progress, interruption count per deployment, drain deadline violations, fencing rejections, and broker/application budget divergence. Investigate recurring interruptions even if business retries remain available.

## Recommended skill and evaluation boundary

Add one focused **`graceful-draining`** skill. Trigger on deployments, shutdown, scaling down, node maintenance, long-running workers, and repeated interruption of jobs. Its central workflow should establish the runtime and counters, state the safety/liveness contract, choose finish-versus-resume, implement admission/ownership transitions, and verify the failure windows. Conditional references can cover Kubernetes, queue/framework semantics, and checkpoint/rollout evidence. Keep Temporal-specific replay and version-routing mechanics in the existing Temporal skills; the new skill should route to them when applicable.

Use separate raw fixtures and reviewer rubrics. The following cases exercise useful behavior rather than paraphrase the instructions:

| Fixture | Necessary observed behavior |
| --- | --- |
| Three old workers, one fresh generation, a checkpointable 24-hour task, budget three | Simulate sequential old-pod termination; job resumes on eligible new capacity with preserved progress, unchanged business-failure count, and recorded interruptions. Reject a fix consisting only of increasing retries. |
| `preStop` consumes most of a short grace period while an outbound consumer keeps fetching | Stop claims independently of readiness; demonstrate a bounded checkpoint before the hard deadline and account for already reserved work. |
| Crash after external mutation, before checkpoint/acknowledgment | Retry with stable operation identity or reconcile the outcome; no silent skip or duplicate irreversible mutation. |
| Lease expires while old worker is paused, new worker advances, old worker resumes | Reject old checkpoint/result writes at the protected resource and conditionalize lease cleanup. |
| Broker redrive limit three, application excludes deployment interruptions | Detect the remaining broker counter and demonstrate recovery without claiming the application flag changes broker semantics. |
| SQS-backed computation lasting 24 hours | Detect the 12-hour visibility ceiling; use bounded resumable steps or an appropriate durable execution model. |
| Actual Kubernetes Job, disruption condition present, versus generic Deployment worker | Use a version-compatible failure policy only for the Job; do not transfer its guarantee to application retries or assume every deletion matches. |
| New binary cannot load an old checkpoint | Gate rollout/handoff or retain compatible capacity; demonstrate the migration/rollback path without re-running uncertain effects. |
| Hung checkpoint writer or repeatedly interrupted job | Bound shutdown and total recovery; surface stalled progress and an actionable terminal/escalation state instead of spinning forever. |

The first implementation fixture should model the user's exact A → B → C failure with a deterministic scheduler and persisted ledger. A later integration test must use the actual broker/framework and Kubernetes environment because an in-memory model cannot validate signal propagation, eviction behavior, visibility limits, or framework acknowledgment semantics.
