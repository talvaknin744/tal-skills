# graceful-draining

## What it does

Keep logical jobs recoverable while workers stop, roll out, scale down or transfer ownership.

## When to reach for it

Use when interruption during deployment, scale-down or maintenance threatens resumable work, retries or ownership. For scheduled maintenance use background-maintenance; for a Temporal deployment use temporal-safe-deployments when available.

## It's working if

- The review traces a job through admission, claim, effects, durable progress, acknowledgement and termination, and identifies the layer reporting failure.
- The recommendation selects finish-or-resume behavior per job class with a finite deadline, compatible successor and escalation path.
- Admission closes at the authoritative claim point; in-flight claims and checkpoint or acknowledgement dependencies are accounted for.
- Progress and ownership epochs persist, stale owners are fenced at protected resources, and uncertain effects have a reconciliation path.
- Checks exercise successive retirements and interruption boundaries, with durable outcomes, executed checks and platform gaps reported.

## Where it fits

Compose with idempotency for duplicate-safe effects, infrastructure-change-safety for rollout transitions, or background-maintenance for maintenance jobs.

Canonical skill: [skills/engineering/graceful-draining/SKILL.md](../../skills/engineering/graceful-draining/SKILL.md).
