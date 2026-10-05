# infrastructure-change-safety

## What it does

Plan and verify infrastructure transitions with explicit ownership, compatibility and recovery.

## When to reach for it

Use when replacement, Terraform state ownership, mixed-version rollout or partial apply could interrupt service or lose data. Application-only edits remain in their normal workflow.

## It's working if

- Identify provider/runtime versions, workspace and target identity, affected resources, durable data and authorized action.
- Choose a scoped transition for state ownership, rollout overlap, schema evolution or configuration distribution.
- Inspect the final plan and diff for replacement, destruction, unknown values and interruption recovery; protect state artifacts.
- Exercise the failure boundary in a disposable target or state the precise unexecuted scenario; after authorized apply, inspect actual effects.
- Return identity, data and service acceptance evidence, completion records and unresolved claims.

## Where it fits

Compose with graceful-draining for job handoff, recovery-validation for restore evidence, or architecture for a wider migration decision.

Canonical skill: [skills/engineering/infrastructure-change-safety/SKILL.md](../../skills/engineering/infrastructure-change-safety/SKILL.md).
