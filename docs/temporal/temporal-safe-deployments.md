# Temporal safe deployments

## What it does

Guides code, Worker, payload, and workload changes while existing Temporal executions remain active. It preserves the business process across code that reconstructs it.

## When to reach for it

Use [temporal-safe-deployments](../../skills/temporal/temporal-safe-deployments/SKILL.md) when open or sleeping runs, pending Activities, handlers, child Workflows, or continued runs may encounter a deployment or migration. Production routing, resets, termination, and migration need authorization for those operations.

## It's working if

- Affected execution classes and their compatibility requirements are identified.
- Each class has a justified progression strategy, required retained artifacts or Workers, and a recovery path.
- Representative histories are replayed against the exact candidate when histories may encounter it.
- Changed Activity effects are verified separately from replay compatibility.
- The rollout or assessment names stop and restore conditions, evidence gaps, and old-code retirement conditions.

## Where it fits

This skill owns execution compatibility and rollout continuity. Pair it with [reliability](temporal-reliability.md) when external effects can repeat, and [production readiness](temporal-production-readiness.md) when capacity or operational evidence gates the change. Use [AI workflows](temporal-ai-workflows.md) for model/tool lifecycle concerns. The official Temporal catalog contains SDK and deployment-specific guidance; this skill is an assessment and workflow, not a replacement tuning manual.
