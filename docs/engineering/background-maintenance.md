# background-maintenance

## What it does

Design or assess maintenance work that reduces storage or index debt while preserving foreground objectives.

## When to reach for it

Use for compaction, reclamation, rebalancing, backfills or index maintenance that compete with serving resources. Finite local cleanup stays outside this boundary.

## It's working if

- Name the debt, its arrival rate, completion or freshness horizon, and the foreground objective.
- Choose policies from observed distributions and state eligibility, useful yield, cost and starvation behavior.
- Bound shared CPU, memory, I/O, network and outstanding work; define the measured signal, actuator, bounds and recovery.
- Preserve live-data, deletion, reader and placement invariants across pause, restart, ownership transfer and uncertain publication.
- Report useful yield, foreground results, actual checks and remaining correctness or capacity gaps.

## Where it fits

Compose with capacity-planning for sizing, graceful-draining for deployment handoff, or idempotency for uncertain side effects.

Canonical skill: [skills/engineering/background-maintenance/SKILL.md](../../skills/engineering/background-maintenance/SKILL.md).
