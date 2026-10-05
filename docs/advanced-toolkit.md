# Choose a skill, agent, or workflow

Use a skill for one engineering decision or task. Use a specialist when the main
session can assign a separate implementation or review. Use a workflow when the
task crosses those boundaries and needs a concrete handoff and acceptance path.
The main session coordinates; installing a roster does not require using it all.

## Task paths

| Your task | Workflow | Typical first specialist |
| --- | --- | --- |
| Add or repair a backend feature | `tal-backend-delivery` | Python, TypeScript, or Go |
| Explain a stale read, lost update, or competing write | `tal-consistency-diagnosis` | Consistency |
| Make publication, consumption, replay, or event evolution reliable | `tal-messaging-evolution` | Messaging |
| Roll workers running jobs that outlive a pod | `tal-worker-rollout` | Durability and infrastructure, with separate ownership |
| Establish what a restored system can safely resume | `tal-recovery-validation` | Reliability |
| Build or review an MCP endpoint or client | `tal-mcp-integration` | MCP |
| Build or review an A2A peer or task lifecycle | `tal-a2a-integration` | A2A |
| Remove evidenced maintenance burden while preserving behavior | `tal-cleanup-review` | Cleanup |

For retirement of a supported library, API, configuration option, or internal
tool, use [technical-deprecation](../skills/engineering/technical-deprecation/SKILL.md)
as a standalone skill to establish consumer transitions and removal gates.

For event-time windows, late arrivals, duplicates or streaming joins, use [stream-processing-design](../skills/engineering/stream-processing-design/SKILL.md), with the messaging specialist when delivery also matters. For backfills, compaction or rebalancing competing with live traffic, use [background-maintenance](../skills/engineering/background-maintenance/SKILL.md), with the reliability specialist when shared capacity needs review.

A spelling fix or local pure function does not need the complete delivery path.
For performance work, select a standalone skill by the decision:

| Decision | Skill |
| --- | --- |
| Bound overload, shed work, preserve tenant outcomes and recover | [overload-control](../skills/performance/overload-control/SKILL.md) |
| Explain a latency regression or throughput constraint | [performance-diagnosis](../skills/performance/performance-diagnosis/SKILL.md) |
| Construct or assess representative benchmark evidence | [load-testing](../skills/performance/load-testing/SKILL.md) |
| Size growth, failure headroom, recovery or scaling | [capacity-planning](../skills/performance/capacity-planning/SKILL.md) |
| Diagnose database plans, waits, pools and maintenance | [database-performance](../skills/performance/database-performance/SKILL.md) |
| Optimize a measured CPU/cache-sensitive Go or Python hot path | [data-layout-performance](../skills/performance/data-layout-performance/SKILL.md) |

These packages support normal automatic discovery and explicit invocation. Install
them through the ordinary skills CLI or copy each complete package as described
below. Existing workflow dependency sets remain focused on their declared tasks.

Workflows specify a short path, entry conditions and stopping conditions. The
[shared handoff](../workflows/_shared/handoff.md) carries objective, scope, files,
invariants, current evidence and acceptance criteria. One owner edits each
overlapping file set. Independent reviewers return findings to that owner.

## Install in a project

### Choose with npx

From the destination project, start the interactive toolkit picker:

```sh
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills
```

Select Codex, Claude, or both; then choose skills, agents, or workflows by number
or range. The launcher shows the target, dependency counts, and planned file
actions before asking whether to apply. Canceling the menu leaves the target
unchanged. `--yes` belongs to npx's package-download prompt, not the install plan.

With **npm 12**, use its command-scoped Git opt-in:

```sh
npx --yes --allow-git=all --package=github:talvaknin744/tal-skills -- tal-skills
```

This is the same public GitHub package; no npm registry publication is required.
Use Node.js 22 or later for the toolkit. The separate `skills@latest` CLI currently
requires Node.js 22.20 or later. npm's [npx documentation](https://docs.npmjs.com/cli/v12/commands/npx/)
and [Git policy](https://docs.npmjs.com/cli/v12/using-npm/config/#allow-git) describe
the package-fetch options.

List available packages or make an explicit selection:

```sh
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills list
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills --host both --workflow tal-backend-delivery --skill capacity-planning --dry-run
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills --host both --workflow tal-backend-delivery --skill capacity-planning
```

Add `--allow-git=all` to these commands on npm 12. For a reproducible source
revision, replace the package spec with `github:talvaknin744/tal-skills#<commit-sha>`.
The package version alone does not pin a moving Git branch.

Repeat `--skill`, `--agent`, or `--workflow` to select additional packages in one
invocation. Explicit selections describe the entire desired set; they replace
the previous managed selection. Omitted dependency packages remain included when
selected agents or workflows require them. `--all` explicitly selects everything;
avoid it when a focused install is sufficient. Noninteractive installation
requires an explicit selection. `--json` reports plans/results, and `--target`
overrides the current directory.

Use one installer to own a combined setup. A same-named package previously
installed by the standalone skills CLI is unowned by the toolkit installer and
will stop installation. Retain or relocate the existing version before choosing
the desired ownership; the toolkit never silently takes it over.

### Use a repository checkout

Clone this repository, install its maintainer dependencies, then select a host
and an existing project. The commands run from the repository checkout:

```sh
npm ci --ignore-scripts
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-backend-delivery --dry-run
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-backend-delivery
```

Use `--host claude` or `--host both` for the other host. Repeat `--workflow` or
`--agent` to select more entrypoints. With no explicit selection, a first install
selects all 15 agents and eight workflows, then their dependencies (currently
21 skills). A later install retains its selection. Explicit selections describe
the desired set. `--json` gives machine-readable plans and results. Inspect the
plan before changing selections or removing a host.

The installer resolves workflow → agent → skill dependencies and copies complete
skill packages. Codex receives `.codex/agents/` and `.agents/skills/`; Claude
receives `.claude/agents/` and `.claude/skills/`. Shared canonical documents and
the ownership manifest live in `.tal-skills/`. Installed packages have no runtime
dependency on this checkout. Models remain inherited; existing host settings and
project instructions are preserved.

An unowned name or file collision stops installation even when its bytes match.
An edited owned file also stops replacement. Repeated installation preserves
unchanged files; removed selections remove only unchanged owned artifacts.
Review a conflict and retain or relocate the version you intend to use, rather
than forcing an overwrite. The installer supports recovery of its own interrupted
transaction with `--target <project> --recover`; it does not undo unrelated edits.
Installation requires a filesystem supporting same-filesystem hard links; the
installer probes this before publishing managed files. Windows path rules have
structural tests; a native Windows installation run is separate evidence.

Ordinary skills remain independently installable through the skills CLI:

```sh
npx skills@latest add talvaknin744/tal-skills --skill technical-deprecation
```

Alternatively, copy the complete `skills/engineering/technical-deprecation/`
package into the project's `.agents/skills/` for Codex or `.claude/skills/` for
Claude. Keep its references, license, and metadata together. Generated workflow
entrypoints are templates in this repository and become `SKILL.md` only through
the toolkit installer, which supplies their required documents and roles.

## Invoke the installed path

Codex:

```text
Use $tal-backend-delivery to add duplicate-safe invoice submission.
Preserve the public API. The tenant comes from our authenticated request context.
Assign one implementation owner and return evidence for concurrent duplicates,
changed intent, uncertain completion, and resource cleanup.
```

Claude:

```text
/tal-worker-rollout Review our three-pod rolling deployment for 18-hour jobs.
Inspect admission, retained input, checkpoint ownership, and the queue's retry
accounting. Force successive maintenance handoffs and a genuine failure control.
```

For a single role, ask the main session to use `tal-python`, `tal-consistency`,
or another installed name for a bounded assignment. Roles are named subagents;
workflow entrypoints are skills. The hosts decide whether native delegation is
available. A child merely reading a role prompt is a fallback, and must be
reported separately from native loading.

For the independently installed retirement skill, invoke `$technical-deprecation`
in Codex or `/technical-deprecation` in Claude. For example:

```text
Use $technical-deprecation to plan retiring this configuration option.
Account for infrequent and offline clients, replacement compatibility, and recovery.
```

## Completion and limitations

Ask for completed changes, executed checks, review findings and unresolved
limits. Bind checks to the candidate actually delivered. A canceled operation or
missing reply requires inspecting its outcome before repeating its effects.
For implementation, acceptance includes the requested behavior and meaningful
failure paths; for review, it includes supported findings rather than invented
patches. Repository structure checks, runtime tests and agent trials provide
different evidence.

Host compatibility and observed limitations are recorded in the
[native research](../research/engineering-toolkit/native-compatibility.md). In this
environment the desktop-bundled Codex was newer than the CLI on `PATH`, and Claude
model execution required refreshed authentication. Use the recorded version and
evidence for a claim; configuration parsing alone is not a successful workflow.

## Standalone skill setup

The skills CLI opens a project-local picker:

```sh
npx skills@latest add talvaknin744/tal-skills
npx skills@latest add talvaknin744/tal-skills --skill idempotency --skill graceful-draining
npx skills@latest add talvaknin744/tal-skills --list
```

Use `--full-depth` when listing or installing the nested Temporal integrations; ordinary discovery lists the 41 root skills, while full-depth discovery includes all 49 packages. Keep the complete package when copying manually.

A bounded Codex request can name the skill:

```text
Use $idempotency to review this webhook handler.
Check concurrent duplicates, changed payloads, and a crash after downstream success.
Cite the code and propose a regression that forces each important ordering.
```

For the coordinated deployment workflow:

```text
Use $tal-worker-rollout to review our three-pod rolling deployment for 18-hour jobs.
Inspect admission, retained input, checkpoint ownership, and retry accounting.
Force successive maintenance handoffs and a genuine failure control.
```
