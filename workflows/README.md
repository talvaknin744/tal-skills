# Engineering workflows

Use a workflow when a task spans implementation, specialist review, and acceptance.
For one engineering decision, choose a standalone skill instead. Every workflow
has entry conditions, context requirements, specialist selection, ownership,
checks, and a stopping condition.

| Path | Use when |
| --- | --- |
| [Backend delivery](tal-backend-delivery/WORKFLOW.md) | Delivering a Python, TypeScript, or Go backend feature or repair |
| [Consistency diagnosis](tal-consistency-diagnosis/WORKFLOW.md) | Reconstructing competing operations and fixing a forbidden history |
| [Messaging evolution](tal-messaging-evolution/WORKFLOW.md) | Changing publication, delivery, replay, or event contracts |
| [Worker rollout](tal-worker-rollout/WORKFLOW.md) | Replacing workers whose accepted jobs outlive the deployment |
| [Recovery validation](tal-recovery-validation/WORKFLOW.md) | Establishing safe application behavior after restore |
| [MCP integration](tal-mcp-integration/WORKFLOW.md) | Implementing or reviewing an MCP endpoint or client |
| [A2A integration](tal-a2a-integration/WORKFLOW.md) | Implementing or reviewing an A2A peer or task lifecycle |
| [Cleanup review](tal-cleanup-review/WORKFLOW.md) | Removing evidenced maintenance burden while preserving behavior |

## Install and invoke

The [toolkit installer](../docs/toolkit-usage.md#install-in-a-project) supplies the
workflow entrypoint, relevant native roles, complete skill dependencies, and shared
documents. Source `WORKFLOW.md` files are canonical definitions; the installer
creates the native `SKILL.md` entrypoints.

Codex:

```text
Use $tal-backend-delivery to add duplicate-safe reservation handling.
Preserve the existing API and authenticated tenant boundary.
Verify concurrent duplicates, uncertain completion, and resource cleanup.
```

Claude:

```text
/tal-worker-rollout Review our rolling deployment for 18-hour jobs.
Check admission, retained input, checkpoint ownership, and retry accounting.
```

The main session follows the [shared handoff](_shared/handoff.md), assigns one
implementation owner per overlapping file set, and dispatches only relevant
specialists. Independent findings return to that owner for correction and
verification. Simple changes use the workflow's short path.

## Acceptance

Accept the stable candidate when the requested outcome, relevant failure paths,
independent findings, and required checks are covered. Keep missing capabilities
and unresolved business decisions visible. A review request produces supported
findings; it does not imply an implementation or production deployment.

See the [usage guide](../docs/toolkit-usage.md) for installation updates and host
limits, and [verification evidence](../docs/research/engineering-toolkit/verification.md)
for the distinction between structural checks and observed agent behavior.
