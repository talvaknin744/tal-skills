# Performance and capacity skill design

This focused addition serves senior backend and infrastructure decisions: locate
the constraint, measure demand credibly, size useful capacity and contain overload.
The workflows follow Writing for Agents: precise discovery, ordered decisions,
conditional references and observable completion criteria.

| Skill | Independent trigger and result | Boundary with existing coverage |
| --- | --- | --- |
| [overload-control](../../../skills/performance/overload-control/SKILL.md) | Admission/shedding, fairness and recovery policy with resource/ownership evidence | Deepens the mechanism beyond broad microservice readiness; duplicate effects keep their existing contract |
| [performance-diagnosis](../../../skills/performance/performance-diagnosis/SKILL.md) | Supported explanation of a latency or throughput constraint, then a verified bounded intervention | Runtime correctness and topology selection remain separate decisions |
| [load-testing](../../../skills/performance/load-testing/SKILL.md) | Reproducible workload, delivered-demand accounting and bounded benchmark claim | Failure-test oracles remain useful; ordinary unit assertions need no load model |
| [capacity-planning](../../../skills/performance/capacity-planning/SKILL.md) | Resource/queue model and normal/failure capacity envelope with cost and scaling conditions | Safe execution of a rollout is separate from its capacity forecast |
| [database-performance](../../../skills/performance/database-performance/SKILL.md) | Workload diagnosis and measured query/pool/transaction/maintenance tradeoff | Isolation, durable uniqueness and ORM lifecycle correctness keep their existing routes |
| [data-layout-performance](../../../skills/performance/data-layout-performance/SKILL.md) | Criticality-gated Go/Python layout experiment preserving retention, numeric and ownership semantics | CPU-cache locality differs from service-cache consistency; ordinary backend code receives its usual treatment |

Adaptive concurrency, tenant fairness, queue/backpressure design and recovery are
branches of overload control. Autoscaling stability, pool budgets and failure
headroom live in capacity planning. Distributed critical paths and runtime
attribution live in diagnosis. This preserves independent invocation where the
question changes while avoiding a separate always-loaded skill for every mechanism.

## Source scope

- [Measurement and capacity](measurement-and-capacity.md): Gregg, k6, Prometheus,
  SRE, queueing, PostgreSQL and conditional runtime/container contracts.
- [Overload control](overload-control.md): SRE, AWS, Envoy, HPA, gRPC, broker and
  HTTP boundaries, with application requirements distinguished from source claims.
- [Data layout](data-layout.md): the supplied performance note audited against
  primary runtime, numeric-buffer and hardware contracts, with correctness and
  criticality limits.

The records identify inspected sections and documentation versions. Historical
case studies, authored fixtures and derived models do not establish production
capacity or portable speedups. Each skill carries its own source record and all
runtime references, so it remains installable independently.

## Verification

Each skill has two substantive [evaluation cases](../../../evals/README.md) and
one nontrigger case, with raw project inputs isolated from scoring criteria.
The [performance corpus checks](../../../tests/performance/evals.test.mjs) validate
that packaging and isolation; they do not execute or grade an agent.
See the [verification record](verification.md) for checks and forward trials
actually performed and their capability/coverage limits.
