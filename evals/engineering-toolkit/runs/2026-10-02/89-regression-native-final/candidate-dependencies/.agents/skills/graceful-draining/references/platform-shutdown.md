# Platform shutdown

Use the applicable branch after identifying the installed version, controller,
broker, queue type, and worker framework. Configuration names alone do not prove
the runtime behavior; verify the actual signal and delivery path.

## Kubernetes services and worker Deployments

- `preStop` and application shutdown share the termination grace allowance. The
  countdown starts before the hook; the stop signal follows hook completion. A
  sleep that consumes most of the allowance can prevent checkpointing. Measure
  hook time, signal delivery, bounded persistence, and safety margin together.
- Verify PID 1 receives and forwards the configured stop signal. Once grace
  expires, remaining processes can be killed. Treat a stalled checkpoint as a
  deadline failure with visible recoverable or unresolved work.
- Terminating Service endpoints advertise `ready: false`; `serving` supports
  drain-aware routing. Routing changes and pod termination propagate concurrently.
  In-flight requests and existing connections still need application behavior.
  Readiness does not stop outbound queue polling, prefetch, or internal schedulers.
- Keep liveness appropriate for an active drain. Restarting a healthy draining
  worker because it stopped accepting work defeats the transition. Readiness
  and job admission serve separate control paths.
- Deployment `maxSurge` and `maxUnavailable` shape replica replacement, not job
  completion. Budget old draining pods alongside new capacity. A PDB does not
  constrain a Deployment controller's rolling update. `progressDeadlineSeconds`
  reports stalled rollout progress; define the actual operational response.
- Force deletion removes the API object without confirmation that its process
  stopped. Protect shared writes against an old owner that may still run. A long
  grace period can support planned retention but cannot preserve memory through
  node loss or other abrupt failure.

Use the [Pod lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#termination-of-pods),
[lifecycle hooks](https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/),
[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/),
and [disruption](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
documentation for the deployed version. Prove admission stops, the signal reaches
the worker, and durable progress is available after termination in an authorized
integration environment.

## Kubernetes Jobs

For a real Job controller, inspect `restartPolicy`, `backoffLimit`,
`activeDeadlineSeconds`, and failure policy. Pod failure policy is stable since
1.31 and requires `restartPolicy: Never`. An ordered `Ignore` rule matching
`DisruptionTarget` can exclude documented disruption failures from Job backoff.
It applies only when the actual condition matches. Arbitrary rollout deletion,
exit 137/143, and queue redelivery are not sufficient evidence.

This policy changes a Job-controller counter; it does not preserve in-memory
progress, remove duplicate execution, or repair an application's retry ledger.
Check [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/) and
the [failure-policy examples](https://kubernetes.io/docs/tasks/job/pod-failure-policy/)
before changing configuration. Test the matching and nonmatching failure paths.

## Amazon ECS service-managed workers

Use this branch when task scale-in protection participates in retention. Confirm
the task's protected state and expiry **before queue receive**. Inspect per-task
failure/error bodies as well as transport status. Acquisition failure or an
uncertain response keeps new admission closed. Protection and queue acceptance
are separate operations; preserve any racing receipt's identity and recoverable
disposition. See the [protection endpoint](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection-endpoint.html).

Protection defaults to 120 minutes; requests allow 1–2,880 minutes. Plan renewal
and checkpoint margin against the confirmed expiry. Failed renewal closes new
admission and triggers bounded finish-or-resume for accepted work. Serialize
protection transitions, settle pending receives, and retain protection while
owned work still needs it. A retiring worker keeps admission closed after release.
Test a delayed release racing with new admission; a local flag does not order
remote protection requests.

The protection promise covers service autoscaling and deployment scale-in.
Keep [Spot interruption](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html#fargate-spot-termination-notices),
[explicit stops](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_StopTask.html),
[unhealthy-task replacement](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_HealthCheck.html),
and crashes in the recovery plan. Protection cannot replace durable continuation
or resource-enforced fencing.

Budget protected old workers alongside replacements. Check `maximumPercentage`,
available capacity, and deployment-tool timeouts. All protected workers can block
progress; `DEPLOYMENT_BLOCKED` requires a capacity or safe-retirement decision,
not removal of protection merely to finish deployment. Verify the supported
service/agent configuration in the [protection guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection.html).

For rolling deployments configured with
[`earlySuccessCriteria.sourceServiceRevisionCleanup=DEFERRED`](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/early-success-criteria.html),
deployment success can precede old-revision cleanup. Automatic deployment
rollback monitoring ends at completion; cleanup is attempted for up to two weeks.
Completed `DescribeServiceDeployments` counts are snapshots. Use `DescribeServices`
for live service counts, plus actual tasks and durable job outcomes, to establish
retirement. Keep an explicit cleanup deadline and recovery owner after deployment
completion. Confirm the selected strategy and CLI/SDK/IaC support; early success
does not establish accepted-work completion.

## Queues and task frameworks

Find what stops new deliveries, what happens to reserved work, who renews leases
or heartbeats during shutdown, and when acknowledgment or requeue occurs. Keep
those background mechanisms alive until durable completion or safe release.

- **SQS:** Visibility extensions cannot exceed 12 hours from the original
  `ReceiveMessage`; heartbeats do not restart that clock. A 24-hour computation
  needs bounded resumable steps or a suitable durable execution model.
  `maxReceiveCount` belongs to broker redrive, independently of application
  business failures. Account for duplicate delivery and DLQ recovery.
  See [processing duration](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/best-practices-processing-messages-timely-manner.html)
  and [dead-letter queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html).
- **RabbitMQ:** Consumer cancellation stops new dispatch while existing
  deliveries remain in flight. Connection or channel loss can requeue
  unacknowledged deliveries. Acknowledgment-timeout behavior depends on broker
  version and queue type; size work slices against the real limit. See
  [consumers](https://www.rabbitmq.com/docs/consumers) and
  [acknowledgments](https://www.rabbitmq.com/docs/confirms#automatic-requeueing).
- **Celery:** Verify warm/soft shutdown, reserved work, acknowledgment settings,
  pool, and broker heartbeat behavior for the installed version. Version 5.6
  changed prefork warm shutdown to retain broker heartbeats; a waiting process on
  an older release can lose its deliveries while appearing to drain. See the
  [worker guide](https://docs.celeryq.dev/en/stable/userguide/workers.html#worker-shutdown).
- **Rails with Shopify job-iteration:** Verify the installed gem, Active Job,
  and backend together. The [pinned guide](https://github.com/Shopify/job-iteration/blob/c3b0eb1db5bd6681664913d57dfe5b5b28ab2ad8/guides/iteration-how-it-works.md)
  documents cursor continuation through Active Job retries; backend-level retries
  such as Sidekiq retries restart from the beginning. Exercise configured retry
  and exhausted-retry fallback separately. For [Sidekiq deployment](https://github.com/sidekiq/sidekiq/wiki/Deployment),
  `TSTP` stops fetching and `TERM` begins bounded shutdown. Size each iteration,
  cursor publication, and teardown to the actual remaining timeout. The
  [iteration implementation](https://github.com/Shopify/job-iteration/blob/c3b0eb1db5bd6681664913d57dfe5b5b28ab2ad8/lib/job-iteration/iteration.rb)
  advances the cursor after the callback; abrupt death can replay a completed
  effect. Apply the [effect reconciliation boundary](durable-handoff.md#checkpoint-boundaries)
  and verify planned interruptions separately from logical business failures.

For durable workflow engines, preserve their execution model and version-routing
guarantees. Use their documented worker shutdown and history/checkpoint semantics
instead of layering a second scheduler over existing durable ownership.
