# Sources and scope

Reviewed 2026-09-29; shutdown timing contracts rechecked 2026-10-02. These instructions are an original synthesis for job-preserving
shutdown. Platform facts come from primary documentation; the common protocol
and verification scenarios are design recommendations, not vendor guarantees.

The user-supplied [DDIA second-edition draft](https://github.com/YZXBiz/ddia/tree/157c2b303db17188dc4509c809552fd378e78b25/raw)
was also read selectively in chapters 6 and 8–13. The files identify themselves
as early-release material; they were not verified against the final publication.
The relevant additions concern reproducible inputs, clock domains, recovery
boundaries, and the limits of processing guarantees. Current product contracts
take precedence over historical or draft examples.

- The official SRE chapters on [reliability testing](https://sre.google/sre-book/testing-reliability/)
  and [data pipelines](https://sre.google/sre-book/data-processing-pipelines/)
  support independently validating restored checkpoints and controlling output
  publication. The [noninteractive canary guidance](https://sre.google/workbook/canarying-releases/)
  evaluates completed work and output quality over a representative work-unit
  duration; healthy replacement pods alone are insufficient evidence.
- [Python's monotonic-clock contract](https://docs.python.org/3/library/time.html#time.monotonic)
  illustrates elapsed-time semantics; use the target runtime's supported clock
  and verify its suspend behavior. Persisted deadlines need a shared time model.
- [SQS DeleteMessage](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_DeleteMessage.html)
  documents possible repeat delivery even after deletion in standard queues.
  Retention follows the actual replay horizon, rather than acknowledgment alone.

- Google's [SRE Workbook: Data Processing Pipelines](https://sre.google/workbook/data-processing/)
  provides the book basis for checkpointing, recoverable processing, idempotent
  mutation, and correctness/freshness objectives. Apply those mechanisms to the
  application's actual durable boundaries.
- Martin Kleppmann's [How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)
  explains paused owners and resource-enforced fencing. It supports the ownership
  caveat; it does not establish that a chosen provider accepts fencing tokens.
- Kubernetes, ECS, SQS, RabbitMQ, and worker-framework references are co-located with their
  applicable rules in [platform shutdown](platform-shutdown.md). Recheck versions,
  limits, and enabled features when implementing those branches.
- Shopify's [background-job account](https://shopify.engineering/high-availability-background-jobs)
  (2021-07-08) corroborates checkpointed iteration under frequent deployments.
  The job-iteration guide/source were inspected at commit
  `c3b0eb1db5bd6681664913d57dfe5b5b28ab2ad8`; installed releases still need checking.
- AWS's [task-protection introduction](https://aws.amazon.com/blogs/containers/announcing-amazon-ecs-task-scale-in-protection/)
  (2022-11-10) demonstrates protection before queue receive. The
  [Blu Insights account](https://m2-beta.bluinsights.aws/blog/scaling-out-in-policies-and-task-protection-in-practice/)
  (2023-10, month only) reports remaining admission/deactivation races. Its
  custom scaler and workload thresholds are not adopted. Current
  [ALB behavior](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html#deregistration-delay)
  distinguishes completed deregistration from its displayed `draining` state;
  the historical article's full-delay generalization is not used.
- [SQS at-least-once delivery](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html)
  supports treating duplicate delivery as a recovery case even while work is
  expected to remain invisible.
- Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents)
  informs the concise entrypoint, conditional references, and observable
  completion criteria.

The 2026-10-02 additions turn existing ownership and checkpoint rules into
observable tests: inventory after authoritative admission closes, actual mixed
reader/writer semantics, and a first-stop drain deadline that repeated signals
cannot extend. Python's [signal delivery contract](https://docs.python.org/3/library/signal.html#execution-of-python-signal-handlers)
does not guarantee immediate handling during a long C operation; bounded local
database calls and a separate supervisor limit are still needed. Kubernetes'
[termination sequence](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination-flow)
starts the grace countdown before `preStop`. These contracts motivate the tests;
they do not promise that arbitrary worker code finishes within grace.

Local deterministic tests can demonstrate the chosen state machine's behavior.
They do not validate a production orchestrator's signal propagation, broker
configuration, external deduplication, or crash durability. Record those evidence
boundaries in the resulting design, review, or implementation report.
