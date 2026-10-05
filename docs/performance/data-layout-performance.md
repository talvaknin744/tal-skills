# Data-layout performance

## What it does

Assesses or optimizes measured Go and Python hot paths where data layout, CPU-cache locality, allocation, or shared-line contention may matter. It chooses a representation from the access pattern and semantics, and may conclude that the existing structure is the right choice.

## When to reach for it

Use [data-layout-performance](../../skills/performance/data-layout-performance/SKILL.md) for evidence-backed AoS/SoA, hot/cold splitting, false sharing, or bounded ring/cache proposals. Ordinary backend changes and dependency waiting keep their existing route; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to establish the bottleneck and [database-performance](../../skills/performance/database-performance/SKILL.md) for database work or waits.

## It's working if

- Profiles or an explicit experiment establish that the path matters to CPU, allocation, retention, contention, or a latency cohort.
- Required numeric, ordering, exactness, full/empty, and ownership semantics have an independent correctness oracle.
- Each proposed transformation names its mechanism, preconditions, cost boundary, and expected observation.
- Representative repeated comparisons include production-paid preparation and operation or service outcomes, alongside kernel timing.
- The result shows preserved behavior and worthwhile measured benefit, or explains why the change is unjustified or still unverified.

## Where it fits

This specialist skill addresses representation and memory behavior after a hot path has evidence behind it. Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to establish criticality, [load-testing](../../skills/performance/load-testing/SKILL.md) to assess service-level effects, and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) when the outcome affects fleet headroom. The [reading path](../reading-paths.md#cpu-cache-sensitive-go-and-python-paths) points to Go, NumPy, Cython, and Linux primary contracts.
