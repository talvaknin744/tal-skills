# Overload control: primary-source reading

Read on **2026-10-01**. This research supports a focused `overload-control` skill for admission, load shedding, resource isolation, tenant fairness, and recovery. **Source claims** describe the cited system or specification; **derived requirements** are proposed checks for this repository. They require implementation and workload evidence before becoming a capacity claim. No service, cluster, load generator, or controller was exercised during this reading.

## Reading ledger

All listed sections were read through their complete prose. PDF page numbers below are physical pages, including covers. Diagrams were encountered through extracted text and captions; their pixels were not inspected. Linked further reading was not implicitly read.

| Primary source | Version/date and exact reading scope |
| --- | --- |
| [Google SRE, Handling Overload](https://sre.google/sre-book/handling-overload/) | Official first-book chapter 21, HTML copyright 2017; complete chapter from introduction through Conclusions. |
| [Google SRE, Addressing Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/) | Official first-book chapter 22; complete sections Service Unavailability, Preventing Server Overload, Queue Management, and Load Shedding and Graceful Degradation. |
| [Google SRE Workbook, Managing Load](https://sre.google/workbook/managing-load/) | Official 2018 workbook chapter 11; complete chapter, including both case studies, all Autoscaling subsections, and Combining Strategies to Manage Load. |
| [AWS, Using load shedding to avoid overload](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf) | David Yanacek, PDF copyright 2019, 13 pages; complete main prose on pp. 2–13 and further-reading titles. |
| [AWS, Fairness in multi-tenant systems](https://d1.awsstatic.com/builderslibrary/pdfs/fairness-in-multi-tenant-systems-david-yanacek.pdf) | David Yanacek, PDF copyright 2020, 18 pages; pp. 5–15, from Fairness in multi-tenant systems through Evaluating admission control accuracy. |
| [AWS, Dependency isolation](https://d1.awsstatic.com/builderslibrary/pdfs/Dependency_Isolation_by_DavidYanacek.pdf) | 14-page first-party PDF; complete main prose, including concurrency, allocation, timeouts, caching, partitioning, visibility, and conclusion. The retrieved PDF declares no publication date or revision number. |
| [Envoy, Adaptive Concurrency](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/adaptive_concurrency_filter.html) | Retrieved `latest` banner: `1.40.0-dev-c66182`; complete page: controller, minRTT, gradient, headroom, limitations, example, runtime settings, and statistics. A development documentation snapshot, not a deployed-version recommendation. |
| [Kubernetes, Horizontal Pod Autoscaling](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | Live official documentation, `autoscaling/v2`; footer modified 2026-08-03, `1e6f856b11`. Read all main prose from How does a HorizontalPodAutoscaler work? through What's next, including readiness, metrics, policies, stabilization, and tolerance. Version-gated features require the actual cluster version. |
| [gRPC, Cancellation](https://grpc.io/docs/guides/cancellation/) and [Deadlines](https://grpc.io/docs/guides/deadlines/) | Complete guides and language-support notes. Footers: cancellation 2024-02-29, `4f733b4`; deadlines 2025-07-07, `78db5a6`. Language examples were not executed. |
| [RabbitMQ, Consumer Acknowledgements and Publisher Confirms](https://www.rabbitmq.com/docs/confirms) | Banner 4.3; complete sections The Basics, Acknowledgement Modes and Data Safety, Negative Acknowledgement and Requeuing, Channel Prefetch and subheadings, Prefetch and Throughput, and Automatic Requeueing. |
| [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) and [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585.html) | 9110, June 2022: complete §§9.2.2, 10.2.3, 15.6.4. 6585, April 2012: complete §§4 and 7.2. |

The former AWS article URLs now redirect to Builder Center, whose retrieved metadata shows 2026 migration dates. The first-party PDFs above establish the historical editions actually read; those migration dates are not used as original publication dates. Provider examples are explanatory history, not current configuration guidance.

## Findings and implementation implications

### Useful work and cheap rejection

**Source claim.** AWS distinguishes goodput—responses usable before the client's timeout—from offered throughput. It describes overload amplifying through wasted work and retries, recommends measuring clients as well as servers, separates successful latency from fast rejection latency, and notes that rejecting traffic also consumes capacity. [AWS load shedding](https://d1.awsstatic.com/builderslibrary/pdfs/using-load-shedding-to-avoid-overload.pdf).

**Derived requirement.** State the useful-result contract, measure demand before rejection, and place admission before the expensive constrained operation. Report accepted successes, accepted failures/timeouts, rejections, and their latencies separately. Include parsing, authentication, TLS, logging, and connections in rejection-path costs.

**Limit/counterexample.** Rejecting after expensive authentication or retaining a thread while delaying errors can exhaust the same resource being protected. A low overall median can merely reflect fast failures.

**Discriminating verification.** Hold capacity fixed, increase offered demand beyond saturation, and compare client-observed useful completions, resource occupancy, and rejection cost. A flatter server latency graph alone does not establish improvement.

### Resource signals, criticality, and retry scope

**Source claim.** Google warns that request costs vary, explains task-local resource signals and propagated criticality, and distinguishes local overload with alternate capacity from fleet-wide overload. Its per-request and per-client retry budgets prevent recursive amplification; sparse clients have weak evidence for adaptive throttling. [Handling Overload](https://sre.google/sre-book/handling-overload/).

**Derived requirement.** Choose signals for the measured constraint: CPU alone cannot reveal a blocked pool. Identify who assigns trusted priority and propagate it consistently. Treat quota exhaustion, local saturation, dependency failure, and deadline expiry as separate causes. Name the retry owner, remaining deadline, aggregate budget, and alternative destination before recommending another attempt.

**Limit/counterexample.** A retry to another replica sharing the same saturated database adds load without adding capacity. A caller-controlled priority flag can defeat admission policy.

**Discriminating verification.** Compare one constrained instance against all instances constrained; record attempts per logical operation and total dependency work. The source's numerical budgets and CPU-centric assumptions are examples, not defaults.

### Rate, concurrency, and resource isolation

**Source claim.** AWS shows that concurrency rises with latency even at unchanged arrival rate. Async I/O moves resource pressure rather than removing it. An overall cap protects a server, while dependency/API bulkheads preserve unrelated work; hard allocation can strand capacity, and borrowing can weaken isolation. [Dependency isolation](https://d1.awsstatic.com/builderslibrary/pdfs/Dependency_Isolation_by_DavidYanacek.pdf).

**Derived requirement.** Separate arrival-rate budgets from in-flight limits. Use average arrival rate and mean residence time only as a stable, consistently scoped Little's Law crosscheck. Define global, dependency, tenant, and workload limits, including nested acquisition, release ownership, and total fleet downstream concurrency. Guard the whole resource-holding scope, including retries and backoff where they retain resources.

**Limit/counterexample.** A constant rate limit does not bound requests waiting on a slow database. A cap around each individual RPC can leave an expensive paginated operation holding resources between calls. Per-replica limits multiply during scale-out.

**Discriminating verification.** Increase dependency latency at constant demand and test unrelated endpoints concurrently. Inspect occupancy, useful throughput, and starvation, not just remote RPC latency.

### Queues, expiry, and recovery capacity

**Source claim.** Google explains that queues add memory and delay, with different needs for stable and bursty traffic. It describes deadline-aware removal of stale requests and warns that surviving capacity during cascading failure may be much lower than pre-incident capacity. [Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/).

**Derived requirement.** Inventory each queue, including executor waits, pool waiters, socket/proxy buffers, and prefetch. Bound count and bytes where item sizes vary; record age and expiry behavior. Recheck usefulness before expensive execution. Define recovery against currently usable capacity, including warmup and backlog drain.

**Limit/counterexample.** A bounded queue can still contain only expired work. LIFO may improve fresh-request latency while starving older requests; business ordering and fairness requirements decide whether it applies. Transient buffering cannot absorb sustained excess demand indefinitely.

**Discriminating verification.** Burst, sustain overload, then lower demand. Check occupancy bounds, deadline misses, oldest age, cleanup, and time to stable useful throughput. Include reduced capacity rather than assuming every replica is healthy.

### Tenant fairness and distributed quotas

**Source claim.** AWS distinguishes server protection from per-tenant fairness, describes token-bucket bursts and reclaiming borrowed capacity, and explains inaccuracies from uneven routing, distributed counters, and high-cardinality keys. It recommends evaluating actual admission against intended quotas. [Fairness](https://d1.awsstatic.com/builderslibrary/pdfs/fairness-in-multi-tenant-systems-david-yanacek.pdf).

**Derived requirement.** Name the tenant identity, resource accounting unit, guaranteed share, borrowable share, starvation policy, and quota scope. Bound limiter state. Specify counter consistency, overshoot allowance, topology changes, and limiter-dependency failure behavior. Measure effective fleet admission and rejection by tenant/work class; preserve aggregate accounting where per-tenant metric cardinality is too high.

**Limit/counterexample.** Equal request counts are not equal resource usage. Dividing a global quota across replicas assumes distribution that sticky connections may violate. Shared counters can become a hot-key dependency. Reservations exceeding physical capacity cannot guarantee all tenants' peaks simultaneously.

**Discriminating verification.** Run one expensive tenant beside normal tenants, then simultaneous tenant peaks, uneven routing, restart, and scale-out. Compare promised shares, actual resource use, quota error, and bounded state.

### Adaptive concurrency requires observable control

**Source claim.** Envoy's gradient controller compares sampled latency with a periodically measured minRTT and adjusts concurrency with headroom. It requires control over relevant cluster concurrency. Probe windows reduce admission and may produce 503s; jitter and retries to other hosts mitigate that specific case. [Envoy adaptive concurrency](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/adaptive_concurrency_filter.html).

**Derived requirement.** Establish a measured fixed-limit baseline first. Define sampling populations, delay, minimum/maximum bounds, probe behavior, and interaction with retries, routing, scaling, and uncontrolled callers. Observe the limit, admitted/rejected counts, sampled latency, baseline latency, and resource occupancy together. Provide a reversible operational fallback.

**Limit/counterexample.** An estimator driven only by completed requests may react late to stalled work; a changing request mix can change latency without congestion. Bypass traffic breaks the documented control premise. Envoy's probe-retry advice does not authorize repeated retries during shared-dependency overload.

**Discriminating verification.** Exercise step changes in demand, dependency delay, low traffic, mixed cost, synchronized probes, bypass traffic, and recovery. Compare against the fixed limit and look for oscillation, overshoot, and starvation.

### Coordinated shedding, routing, and scaling

**Source claim.** The SRE Workbook's Dressy case shows fast shedding making a CPU-cost-based load balancer favor the overloaded region. Its autoscaling guidance covers startup, unhealthy instances, stateful hotspots, backend constraints, bounds, and manual overrides. [Managing Load](https://sre.google/workbook/managing-load/).

**Derived requirement.** Draw the signal path across admission, load balancing, autoscaling, and dependency protection. Include rejected demand in the capacity decision where accepted-only utilization hides need. Reserve usable capacity for the stated failure scenario and account for detection, provisioning, warmup, and scale-in/draining. Keep downstream budgets valid at maximum replicas.

**Limit/counterexample.** Adding application replicas cannot fix a shared database bottleneck and may block its recovery. Adding cold replicas or instances that cannot own a hot partition is not immediate useful capacity. Treat the chapter's fictional utilization correction as an illustration, not a transferable formula.

**Discriminating verification.** Shed while scaling is enabled, remove capacity, and observe routing and scaling decisions. Verify that rejected demand does not attract more traffic to saturated targets or suppress needed growth.

### Kubernetes-specific scaling boundaries

**Source claim.** HPA is a periodic control loop. Its calculation handles missing metrics and readiness conservatively, supports several metric sources, chooses the largest recommendation across metrics, and applies configured bounds and scale behavior. Stabilization and tolerance address flapping. [HPA](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/).

**Derived requirement.** Inspect the actual version, resource requests, metric adapter, freshness, readiness behavior, scaling bounds, node availability, and rollout controller before editing configuration. Time from overload to useful new capacity must be observed separately from an HPA recommendation. Define behavior when metrics fail or maximum capacity is reached.

**Limit/counterexample.** Low application CPU can coexist with dependency-pool saturation. A Pod or replica count is not a readiness or warmup proof. Newer live documentation does not establish that a deployed API supports every field.

**Discriminating verification.** Delay readiness, remove metric samples, cap replicas or node supply, and test a rollout under demand. Correlate recommendations, admitted traffic, ready capacity, downstream occupancy, and recovery.

### Cancellation is a lifecycle protocol

**Source claim.** gRPC cancellation generally cannot interrupt an application handler; the handler coordinates cessation and outgoing-call cleanup. [Cancellation](https://grpc.io/docs/guides/cancellation/). Deadline propagation support varies by language; gRPC deducts elapsed time when propagating timeout budgets, while spawned activity remains the application's responsibility. [Deadlines](https://grpc.io/docs/guides/deadlines/).

**Derived requirement.** Specify who owns each permit, task, connection, waiter, and timer from admission through completion. Release an in-flight permit when the protected work actually stops or its owned scope ends. Detach a cancelled waiter from shared work using explicit shared-operation ownership. Carry remaining budgets and recheck them after queueing.

**Limit/counterexample.** Releasing a permit merely because the caller stopped waiting can allow live downstream work to exceed the cap. Cancellation does not establish that a mutation was never applied or rolled back. A shared request may still serve other callers.

**Discriminating verification.** Cancel before admission, while waiting, during execution, and during cleanup; race completion with cancellation. Confirm no double release, leak, abandoned task, lost shared response, or unsafe retry after an uncertain effect.

### Durable acceptance changes the shedding boundary

**Source claim.** RabbitMQ separates publisher confirms from consumer acknowledgements. Manual acknowledgement and prefetch bound outstanding deliveries; automatic acknowledgement can overload consumers and loses recovery safety. Unacknowledged deliveries requeue after channel loss, and repeated immediate requeues can create costly loops. [RabbitMQ acknowledgements](https://www.rabbitmq.com/docs/confirms).

**Derived requirement.** Classify work as unaccepted, transiently admitted, or durably accepted. For a promised durable job, bound intake/prefetch and execution while retaining recoverable ownership or an explicit business-approved terminal disposition. State when application acceptance, broker durability, processing, and acknowledgement occur. Measure durable backlog age and redelivery rate separately from request shedding.

**Limit/counterexample.** Dropping an expired synchronous request is different from deleting a promised job. Moving overload into an unbounded durable queue postpones the capacity problem. Retry safety still requires effect deduplication; requeue is not proof of rollback. RabbitMQ prefetch does not constrain `basic.get` polling.

**Discriminating verification.** Interrupt a worker after acceptance and during effect/ack boundaries. All accepted jobs must remain accounted for; prefetched memory stays bounded and dependency recovery avoids a redelivery storm.

### Response semantics and retry safety

**Source claim.** HTTP 503 indicates temporary overload or maintenance and can carry `Retry-After`; the header supports a date or delay. Automatic retries of non-idempotent operations require evidence of safe semantics or non-application. [RFC 9110 §§9.2.2, 10.2.3, 15.6.4](https://www.rfc-editor.org/rfc/rfc9110.html). HTTP 429 indicates rate limiting but leaves identity/counting policy to the server; returning an error under extreme demand still costs resources. [RFC 6585 §§4, 7.2](https://www.rfc-editor.org/rfc/rfc6585.html).

**Derived requirement.** Preserve the deployed protocol contract, expose an intelligible rejection reason, and define client backpressure and bounded retry behavior together. Rejection must happen before the promised effect, or return an outcome contract that accounts for ambiguity.

**Limit/counterexample.** A status code alone neither establishes fleet-wide retryability nor limits retry attempts. A common retry time can synchronize clients. An overloaded server may lack capacity to produce one application response for every connection.

**Discriminating verification.** Run the real client/SDK through each rejection reason, including retry hints and deadline exhaustion; inspect wire attempts and effect count.

## Proposed skill completion bar

These are original repository requirements derived from the reading, rather than guarantees supplied by a provider:

1. Identify the constrained resource and draw admission/queue/execution/retry ownership for every affected path.
2. Specify one reviewable policy: limit scope and units, signal, priority/fairness, transient versus durable treatment, rejection/degradation contract, cleanup, recovery, and operational fallback.
3. Demonstrate the harmful case against a baseline and the policy under the same workload. At minimum cover the implicated burst or slowdown, unrelated traffic, cancellation cleanup, and recovery; add topology, durable ownership, or controller interaction cases when those branches apply.
4. Account for offered demand, accepted useful work, rejection, late work, resource bounds, tenant behavior, downstream limits, and recovery. Record any unexecuted production conditions and unsupported capacity claim explicitly.

The source set supports a common overload-control workflow with conditional references for tenant fairness, adaptive concurrency, queues/durable work, and scaling interaction. It does not justify universal rejection thresholds, a mandatory adaptive algorithm, or copying historical provider defaults into another stack.
