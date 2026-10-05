# Temporal production readiness

## What it does

Turns workload, capacity, isolation, data-lifetime, and recovery assumptions into bounded evidence for a particular Temporal launch, migration, or capacity change.

## When to reach for it

Use [temporal-production-readiness](../../skills/temporal/temporal-production-readiness/SKILL.md) when schedules, fan-out, history growth, tenant isolation, or recovery evidence affect a readiness decision. Customer stories motivate failure questions; they do not supply sizing defaults or platform guarantees.

## It's working if

- The assessed workload, environment, business owner, arrival pattern, deadline, and unknown requirements are recorded.
- Each relevant limit has an enforcing boundary, bound, and evidence or a concrete gap.
- Business completion and freshness are measured separately from Temporal availability and execution status.
- Each selected rehearsal has workload, injected failure, invariant, measurement, and an application-derived threshold.
- The verdict states tested envelope, checks run, blockers, and the next observable condition for each blocker.

## Where it fits

This skill owns workload-specific readiness evidence, not SDK tuning. Pair it with [safe deployments](temporal-safe-deployments.md) for rollout compatibility and [reliability](temporal-reliability.md) for effect safety and recovery. Use [AI workflows](temporal-ai-workflows.md) when model/tool loops introduce lifecycle risks. The broader [Temporal catalog](../../integrations/temporal/README.md) supplies SDK, Worker, Cloud, and deployment guidance.
