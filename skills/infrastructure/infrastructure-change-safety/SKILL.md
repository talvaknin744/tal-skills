---
name: infrastructure-change-safety
description: Plan, implement, or review infrastructure changes when resource replacement, Terraform state ownership, mixed-version rollout, or partial apply can interrupt service or lose data.
---

# Infrastructure change safety

Make the requested change with explicit resource ownership and a recoverable transition. An application-only edit without an infrastructure or deployment transition can use its normal implementation path.

1. **Identify the actual target.** Read the project's runtime/provider versions, backend/workspace, account/region and current deployment configuration. Name the affected resources, durable data, downstream dependencies and authorized action: review, configuration change, local exercise or deployed change. Finish when the target and ownership are unambiguous.
2. **Choose the transition.** For Terraform plans, address changes, imports or partial failures, read [state and plan practices](references/terraform-state.md). For capacity changes, schema rollout or overlapping application generations, read [rollout practices](references/rollout.md). When a rollout changes workers' configuration snapshots, update streams or configuration format, read [configuration distribution](references/configuration-distribution.md). Keep unrelated resources outside the change; preserve historical migration paths still supported by the project.
3. **Bind evidence to the candidate.** Inspect the final plan/diff, including replacement, destruction, forgotten ownership, unknown values and required compatibility stages. State what survives interruption and how the next owner resumes. Protect plan/state artifacts as potentially secret-bearing. Finish when each destructive or irreversible effect has an intentional scope and a supported recovery or forward-repair path.
4. **Verify the boundary that can fail.** Exercise the relevant interruption in a disposable target or supply the exact unexecuted scenario. For an authorized apply, capture the applied artifact and observed result; after failure, inspect surviving effects and state before replanning. Finish when identity, data and service acceptance checks match the intended transition, or report the specific unresolved boundary.

Return the changed behavior, affected identities, executed evidence, and remaining limits. A successful plan, process exit or restored state file alone does not establish service recovery. Keep actual applies within the user's authorized target and scope; an uncertain target or ownership conflict stops mutation until resolved.

For source editions, exact reading scope and verified version limits, read [sources](references/sources.md). The optional `graceful-draining` and `recovery-validation` skills can deepen job handoff and restore work when installed; this package does not require them.
