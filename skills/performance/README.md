# Performance skills

6 installable skills in this bucket. Each link opens the package entrypoint (`SKILL.md`).

## Model-invoked

- [capacity-planning](./capacity-planning/SKILL.md) — Model backend or infrastructure capacity for traffic growth, workload changes, backlog recovery, rollouts, and failure headroom. Use for fleet or pool sizing, autoscaling plans, downstream limits, and cost per useful operation; deployment inventory alone needs no sizing analysis.
- [data-layout-performance](./data-layout-performance/SKILL.md) — Assess or optimize measured Go and Python hot paths affected by data layout, CPU-cache locality, allocation, or shared-line contention. Use for AoS/SoA choices, hot/cold splitting, false sharing, and bounded ring/cache proposals; ordinary backend changes and dependency waiting keep their existing route.
- [database-performance](./database-performance/SKILL.md) — Diagnose database workload latency or throughput and validate query, index, transaction-lifetime, pool, or maintenance improvements. Use for expensive queries, plan regressions, contention, and database saturation; duplicate-effect or isolation correctness alone has its existing route.
- [load-testing](./load-testing/SKILL.md) — Build or assess backend load tests and benchmark evidence for representative demand, saturation, overload, and recovery. Use for workload models, generator limits, misleading throughput or percentile claims, and capacity experiments; ordinary unit-test assertions have their existing route.
- [overload-control](./overload-control/SKILL.md) — Design, implement, or review load shedding, admission limits, tenant fairness, bounded queues, and adaptive concurrency when demand or dependency slowdown exhausts service resources. Use for overload containment and recovery; replica forecasting and duplicate-effect correctness have separate workflows.
- [performance-diagnosis](./performance-diagnosis/SKILL.md) — Diagnose backend latency regressions, throughput plateaus, or resource saturation and validate a bounded improvement. Use for unexplained slowness, profiling, pool waits, container throttling, and distributed critical paths; capacity forecasts and workload construction have separate workflows.
