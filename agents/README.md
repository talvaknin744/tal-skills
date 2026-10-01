# Specialist agents

Choose a specialist for a separable implementation, investigation, or independent
review. The main session coordinates the task, assigns write ownership, and accepts
the result. Technical procedures live in the declared skills; roles define the
assignment boundary and evidence to return.

| Concern | Role | Assignment |
| --- | --- | --- |
| Coordination | [tal-coordinator](coordination/tal-coordinator.md) | Select a workflow, scope the work, assign ownership, and resolve review findings |
| Languages | [tal-python](languages/tal-python.md) | Python backend implementation or review |
| Languages | [tal-typescript](languages/tal-typescript.md) | TypeScript backend implementation or review |
| Languages | [tal-go](languages/tal-go.md) | Go backend implementation or review |
| Correctness | [tal-boundaries](correctness/tal-boundaries.md) | Service seams, responsibility, and authoritative ownership |
| Correctness | [tal-idempotency](correctness/tal-idempotency.md) | Duplicate attempts, operation identity, and uncertain effects |
| Correctness | [tal-consistency](correctness/tal-consistency.md) | Concurrent histories, freshness, and invariant enforcement |
| Correctness | [tal-durability](correctness/tal-durability.md) | Accepted work, retained input, checkpoints, and interruption |
| Platform | [tal-messaging](platform/tal-messaging.md) | Publication, replay, ordering, late events, and streaming state |
| Platform | [tal-infrastructure](platform/tal-infrastructure.md) | Safe infrastructure changes and rollout evidence |
| Platform | [tal-reliability](platform/tal-reliability.md) | Recovery, maintenance budgets, and operational outcomes |
| Verification | [tal-failure-testing](verification/tal-failure-testing.md) | Independent oracles and schedules exposing dangerous outcomes |
| Protocols | [tal-mcp](protocols/tal-mcp.md) | MCP authority, transport, and lifecycle contracts |
| Protocols | [tal-a2a](protocols/tal-a2a.md) | A2A tasks, observers, and duplicate business effects |
| Quality | [tal-cleanup](quality/tal-cleanup.md) | Behavior-preserving code and documentation cleanup |

## Use a role

Install a role or a [workflow](../workflows/README.md) through the
[toolkit installer](../docs/toolkit-usage.md#install-in-a-project). Dependencies
are installed with it. Ask the main session for a bounded assignment:

```text
Use tal-python to implement this change in src/exporter.py.
Preserve the existing API and cancellation behavior. Give tal-idempotency an
independent read-only review of duplicate submissions against the final candidate.
```

Role names are native subagents, while `$tal-backend-delivery` and other workflow
names are skill entrypoints. Host capabilities determine whether native dispatch
is available. A prompt-based fallback must be identified separately.

Each assignment follows [CONTRACT.md](CONTRACT.md): objective, scope, current
candidate, invariants, allowed paths, and acceptance criteria. One owner writes
each overlapping file set. Reviewers return supported findings to the owner.
Results distinguish completed changes, executed checks, findings, and limits.

## Maintain a role

Edit the canonical definition here, then run `npm run generate` and
`npm run validate` from the repository root. Generated files in `adapters/` are
checked for divergence. Models inherit the user's configuration. Role instructions
do not grant production access or host-enforced isolation.
