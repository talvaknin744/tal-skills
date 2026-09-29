# Native agent and workflow compatibility

Checked 29 September 2026. This is feasibility evidence from small loader and execution probes, not evaluation of the finished toolkit. [Machine-readable observations and sanitized events](native-compatibility.json) distinguish those levels.

## Observed host behavior

| Host | What was verified | Limit |
| --- | --- | --- |
| Homebrew Codex CLI 0.142.5 | Version and startup diagnostics; `--ignore-user-config` reaches the API | Existing newer user config fails parsing. The configured `gpt-6-astra` is then rejected because this CLI is too old. No successful model run. |
| Desktop-bundled Codex CLI 0.153.4 | Repository skill discovery through `skills/list`; explicit `$tal-probe` invocation; delegated custom-role token returned using invocation-only `config_file` registration | Scratch project trust blocked automatic project agent discovery. The JSONL exposed a completed wait and token result, but omitted the V2 spawn payload. |
| Claude Code 2.1.150 | Native initialization listed the test agent, skill and slash command; `model: inherit` resolved to the configured model | API execution failed with expired OAuth. No Claude model behavior, preloaded-skill use or delegation result was observed. |

The usable Codex binary on this machine is `/Applications/ChatGPT.app/Contents/Resources/codex`; the `codex` command on PATH resolves to the older Homebrew installation. No binary was upgraded. No global configuration, trust record, authentication, model preference or permission setting was changed.

The older Codex binary interprets the newer `agents.enabled` value as an agent-role table and rejects the boolean. Ignoring that file was a diagnostic only: the probe explicitly preserved `gpt-6-astra` and its configured reasoning effort, then received the newer-version requirement. An installer must report this compatibility failure rather than rewriting user settings or quietly choosing another model.

## Adapter contract

Generate project agents as `.codex/agents/<name>.toml` with `name`, `description` and `developer_instructions`. Omit model fields to inherit. Put Codex workflow entrypoints under `.agents/skills/<name>/SKILL.md`; invoke them with `$<name>`. These are separate contracts: `agents/openai.yaml` within a skill supplies skill metadata, not a custom worker role. [Custom agents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [skills](https://learn.chatgpt.com/docs/build-skills)

For Claude, generate `.claude/agents/<name>.md` with YAML metadata and role instructions in the body. Use `model: inherit`; declare required skill names in `skills`. Install the complete dependencies beneath `.claude/skills`. Workflow entrypoints use `/<name>`. Keep coordinating workflows in the main context, without `context: fork`, so the main session retains the request and controls specialist handoffs. This is a portability choice, not a claim that every Claude version has the same nesting behavior. [Claude subagents](https://code.claude.com/docs/en/sub-agents), [Claude skills](https://code.claude.com/docs/en/skills)

Codex 0.153.4 source confirms recursive TOML discovery under each eligible configuration layer's `agents` directory, parsing of standalone role metadata, and application of the selected role during spawning. The native tool exposes `agent_type` only when a custom role was loaded. Treat syntax validation and live discovery as separate checks. [Loader](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/agent-roles/src/loader.rs), [parser](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/agent-roles/src/agent_role_config.rs), [tool exposure](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/core/src/tools/spec_plan.rs), [role application](https://github.com/openai/codex/blob/rust-v0.153.4/codex-rs/core/src/tools/handlers/multi_agents_v2/spawn.rs)

## Probe evidence and interpretation

The test role contained a sentinel in its private role instructions. The parent request named the role and requested its token without supplying that sentinel, reading the role file or allowing a generic replacement. With explicit role registration, the desktop host returned `ROLE_LOADING_C0D3X` after a completed native wait. This supports native role execution through the explicit registration path. It does not establish automatic discovery in the untrusted scratch directory or production workflow quality.

The test workflow contained a different sentinel only in its skill body. `$tal-probe` returned `WORKFLOW_LOADING_5K1LL`. Separately, `skills/list` reported the skill with repository scope and no discovery error. These are observed execution and discovery, rather than merely a model claiming it could use a skill.

For project agents, `config/read` showed the scratch configuration layer disabled as untrusted. Both `/tmp` and its macOS canonical `/private/tmp` path were checked. Invocation-only project trust overrides did not enable the layer. We left the trust boundary intact. The successful role probe registered exactly the reviewed role file through a session flag:

```sh
<desktop-codex> exec --ephemeral --json -s read-only \
  -c 'agents.tal-probe.config_file="<absolute-probe-role-file>"' \
  -C '<probe-project>' '<bounded delegation request>'
```

The remaining final-toolkit smoke test must run in an already trusted project or after the user trusts the target through the host's normal flow. It should verify actual agent selection, dependency loading and workflow completion; a successful generator check alone is insufficient.

Claude initialization listed `tal-native-probe` in `agents`, `skills` and `slash_commands` before the request failed with `401 OAuth access token has expired`. `claude auth status` still reported a signed-in subscription, so that status alone was insufficient. The verified subscription sign-in command is `claude auth login --claudeai`; it was not executed during research. After authentication is refreshed externally, repeat the bounded native execution test and retain the result before claiming Claude workflow execution.

## Installation and fallback decisions

- Keep installed dependencies inside the target project. Do not leave links to the source checkout or research scratch files.
- Detect file and skill-name collisions before writing. Preserve existing host config, authentication and concurrency preferences.
- Report the executable and version actually tested. Validate the modern host contract rather than assuming the PATH binary matches the desktop app.
- Keep model selection inherited. Authentication or model-version failures are failed native checks, not permission to choose a substitute model.
- If named native roles are unavailable, explicitly label any main-session reading of role instructions as a prompt-based fallback. Do not represent a generic child as a successfully loaded native specialist.
- Keep workflow coordination in the main session and assign one writer to each overlapping file set. A native configuration format does not enforce ownership or make concurrent writes safe.

Current online documentation includes behavior introduced after Claude 2.1.150. The adapter should use the narrow fields verified here, and later tests should record their exact host versions. This report does not establish a universal minimum supported version.
