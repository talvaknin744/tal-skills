# Temporal reliability

## What it does

Guides Temporal failure paths involving duplicate Activity effects, ambiguous timeouts, compensation, durable waits, and cancellation. The application remains responsible for external-effect safety while Temporal preserves orchestration progress.

## When to reach for it

Use [temporal-reliability](../../skills/temporal/temporal-reliability/SKILL.md) for business mutations such as payments or provisioning when interruption can leave an effect partial or uncertain. Generic SDK setup and Worker tuning belong to the official Temporal catalog.

## It's working if

- The logical operation, required outcome, irreversible effects, and source of truth are named.
- Each mutation has a stable operation identity and an identified duplicate-enforcement boundary.
- Timeout, cancellation, and lost acknowledgments are treated as uncertain until reconciled.
- Recovery and ownership are defined for partial success, including failed compensation where relevant.
- Checks assert business state and external-effect counts, with mocks and remaining provider guarantees clearly bounded.

## Where it fits

This skill owns business effect and recovery correctness. Pair it with [safe deployments](temporal-safe-deployments.md) when code or routing changes affect open runs, and [production readiness](temporal-production-readiness.md) when workload or recovery evidence gates a launch. For bounded model and tool loops, use [AI workflows](temporal-ai-workflows.md). The [Temporal reading path](../reading-paths.md) routes broader streaming-time questions to stream-processing design.
