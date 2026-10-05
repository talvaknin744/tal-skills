# microservice-extraction

## What it does

Moves one capability incrementally from a monolith while keeping business behavior usable through observable stages. It judges progress by the intended benefit, not by the amount of monolith removed.

## When to reach for it

Use it to plan, review, or implement an incremental service extraction, including migration seams, code/data separation, coexistence, and cutover recovery. It excludes choosing boundaries from scratch and ordinary deployments. Start with `microservice-boundaries` if the seam is not decided; use `microservice-operations` for general operating readiness.

## It's working if

- The selected slice, benefit, callers, readers, writers, constraints, invariants, and material unknowns are recorded.
- Each migration stage declares caller routing, authority for every mutable record, a transition condition, and a recovery path.
- Coexistence covers old/new consumers, schema, jobs, in-flight work, and shadow execution without duplicate customer effects.
- Before and after ownership transfer, authoritative state and recovery action are explicit; irreversible effects have treatment.
- The stage is verified or its evidence gap is explicit; completion retires obsolete routes/writers after the recovery window and checks the original goal.

## Where it fits

This is the migration execution specialist after a boundary is chosen. It works with `microservice-data` for authority transfer, `microservice-integration` for consumer compatibility, and `microservice-operations` for rollout readiness. See [the extraction skill](../../skills/engineering/microservice-extraction/SKILL.md) and [long-running jobs and rollout path](../reading-paths.md).
