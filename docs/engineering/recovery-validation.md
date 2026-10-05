# recovery-validation

## What it does

Validates backup and disaster-recovery claims by rehearsing restores, measuring recoverable loss and time to application usability, and checking restored state against business invariants. Acceptance belongs to the application, beyond an archive, restore command, or open database socket.

## When to reach for it

Use it for restore runbooks, recovery drills, failed restores, and RPO/RTO evidence. Ordinary backup scheduling alone does not require a drill. Use `microservice-operations` for broader service readiness and operations.

## It's working if

- The recovery point, dependency inventory, acceptance invariants, loss budget, timing boundary, and isolated target are explicit.
- The restored application authenticates with its intended identity and privileges against the intended history and dependency versions.
- Usable data, lost acknowledgements, elapsed time, and unresolved external effects are measured against stated boundaries.
- Restored business invariants and derived state are checked; inconsistent local effects/completion records have a repair disposition.
- Backup identity, tool versions, executed checks, observed RPO/RTO, and objective gaps are reported distinctly.

## Where it fits

This is the restore evidence specialist. It hands broader dependency containment and service readiness to `microservice-operations`, and coordinates with data owners when recovered histories or derived state need repair. See [the recovery skill](../../skills/engineering/recovery-validation/SKILL.md) and [recovery reading path](../reading-paths.md).
