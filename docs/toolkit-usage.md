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

A spelling fix or local pure function does not need the complete delivery path.
Workflows specify a short path, entry conditions and stopping conditions. The
[shared handoff](../workflows/_shared/handoff.md) carries objective, scope, files,
invariants, current evidence and acceptance criteria. One owner edits each
overlapping file set. Independent reviewers return findings to that owner.

## Install in a project

Clone this repository, install its maintainer dependencies, then select a host
and an existing project. The commands run from the repository checkout:

```sh
npm ci --ignore-scripts
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-backend-delivery --dry-run
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-backend-delivery
```

Use `--host claude` or `--host both` for the other host. Repeat `--workflow` or
`--agent` to select more entrypoints. With no explicit selection, a first install
selects all; a later install retains its selection. Explicit selections describe
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

Ordinary skills remain independently installable through the skills CLI or by
copying a complete `skills/<concern>/<name>/` package. Generated workflow
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

## Completion and limitations

Ask for completed changes, executed checks, review findings and unresolved
limits. Bind checks to the candidate actually delivered. A canceled operation or
missing reply requires inspecting its outcome before repeating its effects.
For implementation, acceptance includes the requested behavior and meaningful
failure paths; for review, it includes supported findings rather than invented
patches. Repository structure checks, runtime tests and agent trials provide
different evidence.

Host compatibility and observed limitations are recorded in the
[native research](research/engineering-toolkit/native-compatibility.md). In this
environment the desktop-bundled Codex was newer than the CLI on `PATH`, and Claude
model execution required refreshed authentication. Use the recorded version and
evidence for a claim; configuration parsing alone is not a successful workflow.
