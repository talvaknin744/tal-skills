# Temporal AI workflows

## What it does

Guides durable AI and agent business processes with explicit decisions, permissions, tool effects, context, approvals, limits, and recovery boundaries.

## When to reach for it

Use [temporal-ai-workflows](../../skills/temporal/temporal-ai-workflows/SKILL.md) when Temporal owns a durable model/tool workflow, bounded reasoning loop, shared conversation state, human approval, or agent recovery. Generic prompt tuning and AI tasks without Temporal are outside its scope.

## It's working if

- The business task, stable identity, successful outcome, and interruption points are named.
- Model calls, network I/O, and tool effects have deterministic orchestration boundaries and explicit owners.
- Model output is validated against schema, allowed tools, arguments, and business preconditions before effects.
- Applicable turn, tool, time, retry, and spend limits lead to observable terminal or escalation outcomes.
- Failure checks cover uncertain effects, invalid output, approval races, shared state, cancellation, and budget exhaustion as applicable.

## Where it fits

This skill owns durable AI workflow boundaries. Pair it with [reliability](temporal-reliability.md) for duplicate external effects, [safe deployments](temporal-safe-deployments.md) for histories and code evolution, and [production readiness](temporal-production-readiness.md) for workload limits. The [Temporal catalog](../../integrations/temporal/README.md) provides broader SDK and deployment guidance. Semantic answer quality needs separate evaluation; durable completion does not prove it.
