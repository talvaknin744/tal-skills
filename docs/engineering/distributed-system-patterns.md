# distributed-system-patterns

## What it does

Choose and specify a distributed topology from the constraint it must satisfy.

## When to reach for it

Use when selecting or reviewing serving, partitioning, ownership, movement or batch-stage patterns against a measured constraint. Isolated retry or duplicate-effect changes belong with their operation-level contract.

## It's working if

- The plan identifies the limiting constraint from the actual request or job path, data placement, deployment shape and measurements.
- The selected pattern's completeness, freshness, ordering, ownership and recovery requirements are explicit.
- The design defines component roles, interfaces, coordination and failure behavior, supported by evidence beyond pattern names.
- The decision compares relevant alternatives with operational and resource costs, then state observations that validate or overturn the choice.

## Where it fits

Compose with architecture for a broader system decision, concurrency-correctness for invariants across actors, or background-maintenance for shared resources.

Canonical skill: [skills/engineering/distributed-system-patterns/SKILL.md](../../skills/engineering/distributed-system-patterns/SKILL.md).
