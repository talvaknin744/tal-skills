# background-maintenance

## What it does

Design or assess maintenance work that reduces storage or index debt while preserving foreground objectives.

## When to reach for it

Use when compaction, reclamation, rebalancing, backfills or index maintenance compete with serving resources. A finite local filename-filter pass belongs in ordinary application cleanup.

Invocation: automatic

## It's working if

- The report names the debt, its arrival rate, completion or freshness horizon, and the foreground objective.
- The recommendation selects policies from observed distributions and states eligibility, useful yield, cost and starvation behavior.
- Shared CPU, memory, I/O, network and outstanding work have explicit bounds, measured signals, actuators and recovery behavior.
- The design preserves live-data, deletion, reader and placement invariants across pause, restart, ownership transfer and uncertain publication.
- The report records useful yield, foreground results, actual checks and remaining correctness or capacity gaps.

## Where it fits

Compose with capacity-planning for sizing, graceful-draining for deployment handoff, or idempotency for uncertain side effects.

Canonical skill: [skills/engineering/background-maintenance/SKILL.md](../../skills/engineering/background-maintenance/SKILL.md).
