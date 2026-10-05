# Overload control

## What it does

Designs and reviews admission, shedding, bounded queues, tenant fairness, and recovery controls so useful, on-time work stays protected as demand exceeds usable capacity. It accounts for admitted work, durable acceptance, rejection, execution, and cleanup ownership.

## When to reach for it

Use [overload-control](../../skills/performance/overload-control/SKILL.md) when a resource or dependency is running out of usable capacity and the task is to contain demand or recover safely. It is not the workflow for replica forecasting or duplicate-effect correctness; see [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) or [messaging-reliability](../../skills/engineering/messaging-reliability/SKILL.md) for those jobs.

## It's working if

- The protected resource, useful outcome, acceptance boundary, and evidence gaps are stated.
- Every affected admission path has a budget, decision signal, disposition, and execution or cleanup owner.
- Waiting count, bytes, and age are bounded where relevant, with explicit priority and accepted-work behavior.
- Interacting controls have observable bounds under slowdown, capacity loss, missing signals, and recovery.
- A matched comparison reports useful throughput, latency, occupancy, queue age, tenant outcomes, and downstream attempts, or gives the unexecuted procedure and acceptance conditions.

## Where it fits

This is the overload containment and recovery skill in the performance path. Start from the incident or demand evidence; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to locate an unexplained bottleneck, [load-testing](../../skills/performance/load-testing/SKILL.md) to establish delivered demand and outcomes, and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) for growth and failure envelopes. The [reading path](../reading-paths.md#overload-and-tenant-isolation) points to SRE and AWS primary material.
