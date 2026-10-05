# graceful-draining

## What it does

Keep logical jobs recoverable while workers stop, roll out, scale down or transfer ownership.

## When to reach for it

Use when interruption during deployment, scale-down or maintenance threatens resumable work, retries or ownership. For scheduled maintenance use background-maintenance; for a Temporal deployment use temporal-safe-deployments when available.

## It's working if

- Trace a job through admission, claim, effects, durable progress, acknowledgement and termination; name the layer reporting failure.
- Choose finish-or-resume behavior per job class with a finite deadline, compatible successor and escalation path.
- Close admission at the authoritative claim point, account for in-flight claims and preserve checkpoint or acknowledgement dependencies.
- Persist progress and ownership epochs, fence stale owners at protected resources and reconcile uncertain effects.
- Exercise successive retirements and interruption boundaries; report durable outcome, checks and platform gaps.

## Where it fits

Compose with idempotency for duplicate-safe effects, infrastructure-change-safety for rollout transitions, or background-maintenance for maintenance jobs.

Canonical skill: [skills/engineering/graceful-draining/SKILL.md](../../skills/engineering/graceful-draining/SKILL.md).
