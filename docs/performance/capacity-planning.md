# Capacity planning

## What it does

Models a capacity envelope tied to useful work, resource demand, and promised operating scenarios. Headroom is usable capacity remaining after promised demand and failure scenarios are accounted for. It covers growth, workload changes, backlog recovery, rollouts, failure headroom, downstream limits, and cost per useful operation.

## When to reach for it

Use [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) for fleet or pool sizing, autoscaling plans, downstream ceilings, growth, or recovery decisions. A deployment inventory alone does not need sizing analysis; use [load-testing](../../skills/performance/load-testing/SKILL.md) to establish experimental evidence or [overload-control](../../skills/performance/overload-control/SKILL.md) to design immediate demand containment.

Invocation: automatic

## It's working if

- Demand, objectives, scenario scope, units, timing boundaries, and measured versus assumed inputs are explicit.
- Each resource estimate has assumptions and a corresponding measurement, including downstream ceilings and uncertainty.
- Failure and scaling scenarios state usable capacity, constraints, headroom or shortfall, delays, and feasible overload behavior.
- Recommendations connect representative measurements or targeted experiments to useful throughput, latency, correctness, and backlog recovery.
- The capacity envelope includes calculations, triggers and bounds, cost basis, evidence, and conditions still needed to demonstrate a forecast.

## Where it fits

This is the sizing and scenario-modeling skill in the performance path. Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to locate the binding constraint, [load-testing](../../skills/performance/load-testing/SKILL.md) to validate material assumptions, and [overload-control](../../skills/performance/overload-control/SKILL.md) to define behavior when demand exceeds the envelope. The [reading path](../reading-paths.md#growth-failure-capacity-and-backlog) points to queueing mean accounting, SRE load management, and the actual autoscaler.
