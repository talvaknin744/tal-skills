# Overload control

## What it does

Designs and reviews admission, shedding, bounded queues, tenant fairness, and recovery controls so useful, on-time work stays protected as demand exceeds usable capacity. It accounts for admitted work, durable acceptance, rejection, execution, and cleanup ownership.

## When to reach for it

Use [overload-control](../../skills/performance/overload-control/SKILL.md) when a resource or dependency is running out of usable capacity and the task is to contain demand or recover safely. It is not the workflow for replica forecasting or duplicate-effect correctness; see [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) or [messaging-reliability](../../skills/engineering/messaging-reliability/SKILL.md) for those jobs.

Invocation: automatic

## It's working if

- The protected resource, useful outcome, acceptance boundary, and evidence gaps are stated.
- Every affected admission path has a budget, decision signal, disposition, and execution or cleanup owner.
- Waiting count, bytes, and age are bounded where relevant, with explicit priority and accepted-work behavior.
- Interacting controls have observable bounds under slowdown, capacity loss, missing signals, and recovery.
- A matched comparison reports useful throughput, latency, occupancy, queue age, tenant outcomes, and downstream attempts, or gives the unexecuted procedure and acceptance conditions.

## Where it fits

This is the overload containment and recovery skill in the performance path. Start from the incident or demand evidence; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to locate an unexplained bottleneck, [load-testing](../../skills/performance/load-testing/SKILL.md) to establish delivered demand and outcomes, and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) for growth and failure envelopes. The [reading path](../reading-paths.md#overload-and-tenant-isolation) points to SRE and AWS primary material.

## Sources

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
