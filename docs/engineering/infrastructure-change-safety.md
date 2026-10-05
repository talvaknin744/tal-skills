# infrastructure-change-safety

## What it does

Plan and verify infrastructure transitions with explicit ownership, compatibility and recovery.

## When to reach for it

Use when replacement, Terraform state ownership, mixed-version rollout or partial apply could interrupt service or lose data. Application-only edits remain in their normal workflow.

Invocation: automatic

## It's working if

- The plan identifies provider/runtime versions, workspace and target identity, affected resources, durable data and authorized action.
- The recommendation selects a scoped transition for state ownership, rollout overlap, schema evolution or configuration distribution.
- The final plan and diff are checked for replacement, destruction, unknown values and interruption recovery, with state artifacts protected.
- The failure boundary is exercised in a disposable target or recorded as an unexecuted scenario; after authorized apply, actual effects are inspected.
- The report returns identity, data and service acceptance evidence, completion records and unresolved claims.

## Where it fits

Compose with graceful-draining for job handoff, recovery-validation for restore evidence, or architecture for a wider migration decision.

Canonical skill: [skills/engineering/infrastructure-change-safety/SKILL.md](../../skills/engineering/infrastructure-change-safety/SKILL.md).
