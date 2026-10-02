# Primary grounding

Inspected 2026-10-01. These original policies derive from the sources below;
historical provider numbers and current development defaults are not portable
settings. No load or cluster experiment is claimed.

- Google SRE: [handling overload](https://sre.google/sre-book/handling-overload/),
  chapter 21; [cascading failures](https://sre.google/sre-book/addressing-cascading-failures/),
  queue/overload sections; [Workbook managing load](https://sre.google/workbook/managing-load/),
  chapter 11. Read admission, useful capacity and interacting-control material.
- AWS first-party PDFs: [load shedding](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf),
  2019 pp. 2–13; [fairness](https://d1.awsstatic.com/builderslibrary/pdfs/fairness-in-multi-tenant-systems-david-yanacek.pdf),
  2020 pp. 5–15; [dependency isolation](https://d1.awsstatic.com/builderslibrary/pdfs/Dependency_Isolation_by_DavidYanacek.pdf),
  main prose. Examples motivate resource and quota checks, not universal algorithms.
- [Envoy adaptive concurrency](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/adaptive_concurrency_filter.html):
  full page, retrieved development snapshot 1.40.0-dev; verify installed behavior.
- [Kubernetes HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/):
  controller, readiness, metric and stabilization sections; actual version governs.
- gRPC [cancellation](https://grpc.io/docs/guides/cancellation/) and
  [deadlines](https://grpc.io/docs/guides/deadlines/): full guides. Permit ownership
  is a derived application requirement.
- [RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms), version 4.3:
  acknowledgement, prefetch/requeue sections. Durable business acceptance and
  duplicate-safe effects require their own contract.
- [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html), §§9.2.2, 10.2.3, 15.6.4,
  and [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585.html), §§4, 7.2: HTTP retry,
  503 and 429 boundaries.

## Resident fairness and reserve recovery

Added 2026-10-02 after the independently reviewed scheduling research of
2026-10-01. [Borg](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/43438.pdf),
2015, §§2.5, 3.2, 5.1, 6.2, supports placement/runtime separation and the cost of
preemption without guaranteed advance notice; the research read main prose
§§1–8.3 and inspected figures 5 and 12. This package's resident-state accounting,
reserve/reclaim contract and verification schedules are original application
requirements, not a provider guarantee or reproduced cluster result.

Rechecked official [SQS fair queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues.html),
[detection](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fair-queues-detailed.html)
and [visibility](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)
on 2026-10-02: full guides' substantive sections. Fair delivery uses tenant group
identity, with concurrency and recent processing-time detection; standard groups
do not order messages or rate-limit tenants. Visibility can end while execution
continues and does not prevent every duplicate. Dynamic approximate thresholds,
in-flight quotas and visibility limits remain documentation for the adopted
service, not portable fairness settings or completion promises. No broker or
worker experiment was run.
