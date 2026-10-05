# microservice-operations

## What it does

Makes service behavior observable, recoverable, and independently operable across service boundaries. It traces user outcomes because separate deployments alone do not establish failure isolation.

## When to reach for it

Reach for it for cascading failures, cross-service observability, independent deployment/recovery, service-specific capacity, or trust boundaries. It excludes generic CI setup and single-process troubleshooting. Use `recovery-validation` when the claim specifically concerns restored data/history.

## It's working if

- Scope, user outcome, objectives, dependencies, and evidence for current behavior are explicit.
- Each in-scope slow, unavailable, or ambiguous dependency has a bounded outcome, containment, recovery condition, and reconciliation path where needed.
- A representative success and failure can be traced from user impact to service evidence, or missing instrumentation is named.
- The rollout has compatibility evidence, impact signal, and feasible rollback, roll-forward, or reconciliation action.
- Operating claims are observed or marked unverified with next checks; timeout/cancellation reviews include wait, join, cleanup, and safe reuse limits.

## Where it fits

This is the cross-service operations specialist. It neighbors `recovery-validation` for restore evidence, `graceful-draining` for worker handoff, and `infrastructure-change-safety` for rollout risk. See [the operations skill](../../skills/engineering/microservice-operations/SKILL.md) and [recovery and operations reading path](../reading-paths.md).
