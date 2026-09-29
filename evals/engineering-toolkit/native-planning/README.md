# Native workflow smoke preparation

This directory contains a plan and read-only host preflights. It contains no
completed workflow trials. The eight candidate fixtures are owned separately in
`evals/engineering-toolkit/native-fixtures/`; their final index supplies editable
paths and verification commands. The [matrix](smoke-matrix.json) defines a full
backend implementation and seven representative workflow runs for each host.

## Codex session trust: corrected and observed

The installed desktop binary is
`/Applications/ChatGPT.app/Contents/Resources/codex` version `0.153.4`.
A read-only app-server probe confirmed that this single-invocation override enables
the disposable project's config layer:

```text
-c projects={"<canonical-trial-root>"={trust_level="trusted"}}
```

Pass those as two argv elements, without shell interpolation. Build the TOML
string from the `realpath` result with a proper TOML string encoder. This is an
inline-table **value**, not a quoted segment in the CLI's dotted-key syntax.
The pinned implementation splits dotted override keys literally; quotes around
a path become part of that key. Consequently the earlier unsuccessful
`projects."/path".trust_level` probes did not disprove session-only trust.
[Override parser](https://github.com/openai/codex/blob/3d2ee51ca2d5db578f328aa75e20aa22c0197c9a/codex-rs/config/src/overrides.rs#L17)

The native loader merges CLI values before determining project trust. Enabled
config folders supply their `agents/` directory to the role loader.
[Config loader](https://github.com/openai/codex/blob/3d2ee51ca2d5db578f328aa75e20aa22c0197c9a/codex-rs/config/src/loader/mod.rs#L366),
[role loader](https://github.com/openai/codex/blob/3d2ee51ca2d5db578f328aa75e20aa22c0197c9a/codex-rs/agent-roles/src/loader.rs#L75)

The [sanitized observation](session-trust-preflight.json) records an enabled
project layer, discovered repository skill, unchanged global config hash, and
inherited `gpt-6-astra` / `ultra`. No model call occurred. Automatic **named-agent
execution still requires observation**. Official guidance separately documents
trusted project configuration, standalone role files, and invocation overrides.
[Advanced configuration](https://learn.chatgpt.com/docs/config-file/config-advanced),
[custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## Prepare each run

Use a fresh disposable project. Copy only its `rawfiles/` contents and `prompt.md`;
keep the evaluator case index, rubrics and expected answers outside that root.
Install only the chosen workflow with the existing installer:

```text
node scripts/install-toolkit.mjs --target <trial-root> --host codex --workflow <workflow-id> --json
```

Record installer output and manifest digest. The native files, complete declared
skill packages, workflow document, handoff and common contract must remain
byte-identical to that installation. Do not insert sentinels, rewrite prompts,
preload role bodies, or pass grading criteria to the candidate. Record baseline
fixture hashes, and hash the final changed files before review and final checks.
Withheld rubrics are not OS-enforced read isolation: the native process can read
outside its working directory, and inherited user instructions remain. Session flags disable plugin discovery and the external capability categories listed below; this is not a complete filesystem read jail.

Run one native host process at a time unless the coordinator explicitly allocates
more capacity. Codex can cap simultaneously open children at two using the
supported `agents.max_concurrent_threads_per_session` session setting. Close
completed children before new dispatches. Models and reasoning inherit unchanged.

## Exact Codex invocation and evidence

The implemented collector starts `codex app-server --stdio` in the canonical
trial root. `sessionOverrides` in `scripts/native-smoke.mjs` supplies session-only
trust, `approval_policy="never"`, at most two child agents, `web_search="disabled"`,
network disabled, and temporary-directory write exceptions disabled. It sets these
feature flags to false: apps, connectors, plugins, remote_plugin, browser_use,
browser_use_external, in_app_browser, computer_use, image_generation, imagegenext,
hooks, codex_hooks, and plugin_hooks. No model or reasoning override is supplied.

The [restricted preflight](restricted-preflight.json) observed those configuration
values, native skill discovery, all eight fixture preparations, and unchanged
global configuration. It made no model calls. The preflight exposed configured
MCP server names and enabled state only; endpoints, arguments and environment
values were not retained. Before starting a model turn, the collector disables
each configured MCP server through `thread/start.config.mcp_servers`.

The RPC sequence is initialize, initialized, config/read, skills/list,
thread/start, then turn/start. `thread/start` sets the canonical cwd, never-approve
policy, an ephemeral thread and the fixture's sandbox mode. `turn/start` explicitly
sets network access false; workspace-write additionally excludes system and
environment temporary roots. Its text is `$<workflow-id>\n<prompt.md bytes>`.
The exact argv and protocol fields are recorded by the runner. The installed
protocol schema supports these fields. Model execution through this collector
still awaits the scheduled trials.

Wait for each response before dependent messages. Preserve `thread/started`,
item and terminal turn notifications for the primary and children. The installed
schema exposes `thread.agentRole`, `parentThreadId`, `model` and `reasoningEffort`;
record these when returned, and use `thread/read` with `includeTurns:true` for a
child only when necessary. The runtime metadata fields are not per-token model
telemetry. This collector path is schema-supported; no workflow turn has yet
been executed through it. Sanitize config output to the relevant model, agent,
sandbox and layer-status fields instead of storing a full configuration dump.

A claimed load needs evidence: repository scope from `skills/list`, then actual
wrapper/workflow/common-contract reads or an explicit host skill-loading event.
Record dependency reads separately. Preloading a Claude role's declared skills
is valid host behavior when evidenced; it is not a natural-trigger trial. A
native child role requires observed host role metadata or an equivalent native
tool event. Save evidence locators, not only boolean conclusions.

If automatic discovery still fails, an explicit fallback may add, for each
required role, `-c agents.<role-id>.config_file="<installed-native-file>"`.
Use the same installed files and label the run `explicit-cli-registration`;
it does not prove automatic directory loading. Do not silently substitute a
generic child or rewrite native instructions.

## Claude and completion policy

The installed Claude Code `2.1.150` previously exposed agents and workflow skills
in its initialization stream but failed model execution with expired OAuth.
Keep all Claude runs blocked until a user refresh is confirmed by a new attempt.
Do not log in, change authentication, reset usage, select a fallback model, or
bypass permissions as part of these tests.

After that blocker is resolved, start a fresh process in the trial root with:

```json
["claude","--print","--verbose","--output-format","stream-json","--no-session-persistence","/<workflow-id>\n<prompt.md bytes>"]
```

Inherit the user's model and permissions. A permission block is an observed
capability limit; it is not a reason to add bypass flags. Record initialized
native role/skill/slash-command inventory, actual Skill/Agent tool events,
results, changes and checks. The same scope and evidence rules apply.

The backend full run needs one implementation owner, an independent named-role
review, an identified candidate, executed local acceptance checks, and corrections
plus focused re-review when material findings arise. The other seven runs may end
as bounded reviews when their fixture calls for review. Installation validation,
read-only loader preflight, observed native behavior, and independent acceptance
remain separate statuses in the [run record schema](run-record.schema.json).

## Implemented runner interface

`node scripts/native-smoke.mjs --case tal-backend-delivery --output <new-directory-outside-repository>`
prepares the disposable project and saves `evidence/prepared.json`, without
starting a native host or executing model calls. Add `--run` only after the
coordinator schedules a frozen candidate. Optional flags are `--fixtures`,
`--binary` and `--timeout` (workflow-turn seconds, maximum 1800). Preparation
requires an existing output parent and refuses an existing output directory.

The implemented runner currently targets Codex; the Claude command above remains
a planned path blocked by the last observed OAuth error. The runner has protocol
tests using a fake JSON-RPC host. Those tests validate collection and refusal
behavior, not actual Codex model behavior.

Observable notifications, selected RPC responses, stderr, child snapshots, baseline and
final hashes, native model metadata, and scope findings remain under the private
output directory. Config/read responses are reduced to the relevant fields even when they arrive after an RPC timeout. Reasoning item payloads, reasoning deltas and encrypted content are omitted, including nested thread snapshots; public tool and answer events remain.
No raw output is automatically copied into the public repository. A completed
turn is `completed-unscored`; independent acceptance remains pending.

Fixtures declaring runtime output need workspace-write even in review mode;
source and native-file integrity is checked afterward against baseline hashes
and Unix modes. Runtime-output prefixes may not overlap supplied fixture files.
This is post-run detection, not per-file write confinement. On a clean completed
candidate, the runner invokes the supplied verifier independently with a
60-second limit through the installed binary's `sandbox -P :workspace
--include-managed-config --sandbox-state-disable-network -C <trial> -- <argv>`.
This version uses `sandbox` directly, without a `macos` subcommand. The verifier
gets only basic path, locale and existing user-directory environment variables;
credential environment variables are withheld. A harmless local socket probe
observed `EPERM`, confirming network denial for that probe. The runner saves
verifier output and repeats the scope audit. An observational
probe's exit status does not become protocol-conformance proof. Fixture grading
and review independence still require a separate evaluator.

RPC requests have a 20-second limit. The turn timeout begins after turn/start;
preflight, metadata collection and cleanup have separate bounded waits. Cleanup
requests interruption of observed active turns and terminates the owned POSIX
process group, escalating from TERM to KILL after a bounded wait. It records
remaining live group members. A regression starts a real child and descendant
that ignore TERM and verifies group cleanup. The verifier uses the same process
group mechanism. Windows native execution is not implemented by this runner;
the installer remains independently portable. No model substitution,
configuration repair, login, permission grant or automatic retry is performed.


Capability limits are explicit in every run: broad filesystem reads remain
possible, per-file writes are audited afterward, and configured capability
suppression is not an independently enumerated tool inventory. The verifier's
`:workspace` profile also permits system temporary-directory writes. Therefore
`case_compliant` is false for these scoped observations; successful local checks
can still supply useful behavior evidence without claiming full confinement.
Neither model self-report nor a successful process constitutes independent
workflow acceptance. Claude remains blocked by its last observed OAuth failure.
