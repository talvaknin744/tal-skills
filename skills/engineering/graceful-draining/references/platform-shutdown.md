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

For durable workflow engines, preserve their execution model and version-routing
guarantees. Use their documented worker shutdown and history/checkpoint semantics
instead of layering a second scheduler over existing durable ownership.
