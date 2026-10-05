# Performance skills

Promoted, self-contained skills for this concern.

## Model-invoked

- [capacity-planning](./capacity-planning/SKILL.md): Model backend or infrastructure capacity for growth, backlog recovery, rollout headroom, fleet or pool sizing, autoscaling, downstream limits, and cost per useful operation; exclude inventory without sizing decisions.
- [data-layout-performance](./data-layout-performance/SKILL.md): Optimize measured Go/Python hot paths affected by layout, locality, allocation, or false sharing. Use for AoS/SoA, hot/cold splits, or bounded rings; ordinary backend changes and dependency waits use existing routes.
- [database-performance](./database-performance/SKILL.md): Diagnose database performance and validate query, index, transaction, pool, or maintenance changes. Use costly queries, plan regressions, contention, or saturation; duplicate-effect correctness alone follows its existing route.
- [load-testing](./load-testing/SKILL.md): Build or assess load tests for demand, saturation, overload, and recovery. Use workload models, generator ceilings, misleading throughput or percentile claims, or capacity experiments; ordinary unit assertions follow their route.
- [overload-control](./overload-control/SKILL.md): Design admission, shedding, tenant fairness, bounded queues, and adaptive concurrency when demand exhausts service capacity. Use for overload containment and recovery; replica forecasts and duplicate-effect correctness follow separate workflows.
- [performance-diagnosis](./performance-diagnosis/SKILL.md): Diagnose backend latency, throughput plateaus, or resource saturation; validate bounded improvements. Use for unexplained slowness, profiling, pool waits, throttling, or distributed paths; capacity forecasts and workload construction follow separate workflows.
