# Native evaluation host feasibility

Checked 29 September 2026 using desktop-bundled Codex CLI **0.153.4**. Two fresh-session probes demonstrate a usable mechanism for later relevant-case and nontrigger evaluations. They do not evaluate the ten planned skills. Exact prompts, candidate content, hashes, configuration observations and sanitized JSONL events are in [the evidence record](evaluation-host-feasibility.json).

## Observed results

| Case | Input exposure | Native evidence | Result |
| --- | --- | --- | --- |
| Natural relevant request | A hypothetical job fails during a rolling deployment; the request generally allows relevant installed skills but does not name the candidate or supply its body | JSONL records `cat .agents/skills/tal-probe/SKILL.md`, successful exit and the actual body text | The answer includes the marker defined only in the body, plus checkpoint, ownership and bounded recovery guidance |
| Natural nontrigger | “What is 17 + 26? Answer with only the number.”; the same candidate remains installed | No command or other tool call appears in the recorded turn | Answer is `43`; no skill-body marker |

Both returned exit 0. Each used a separate directory and fresh `exec` session, with neither resume nor prior conversation. The candidate was available through normal repository skill discovery. A separate `skills/list` call confirmed its name, description, enabled state and repository scope in both directories. Skill descriptions are the discovery surface; the body loads when selected. [Official skill behavior](https://learn.chatgpt.com/docs/build-skills)

The native positive trace makes the body read observable rather than relying on “I used the skill.” The sentinel is only an instrument for this mechanism probe. Do not alter final skill instructions to add success markers; evaluate their actual decisions, changes and verification using independent criteria.

## Exact invocation and configuration

Use the verified desktop binary, not the incompatible older binary currently on PATH:

```text
/Applications/ChatGPT.app/Contents/Resources/codex exec
  --ephemeral --json
  -s read-only
  -c agents.enabled=false
  -c approval_policy="never"
  --skip-git-repo-check
  -C <trial-directory>
  <natural-prompt>
```

Pass arguments as an argv array, not a shell-interpolated command string. The actual probes inherited `gpt-6-astra` and `ultra`; no model or reasoning override was passed. Sanitized `config/read` confirmed those values, `agents.enabled: false`, read-only sandbox mode and `approval_policy: never`. Disabling child agents is an invocation-only setting, supported by the documented `agents.enabled` control. It did not change the user's saved configuration or concurrency preference. [Agent settings](https://learn.chatgpt.com/docs/agent-configuration/subagents)

The positive was bounded at 120 seconds and the nontrigger at 90 seconds; both completed before timeout. At most two native processes ran concurrently. Capture stdout JSONL and stderr separately, preserve terminal events and exit status, and record actual timeout termination when it happens. A timeout, quota error or configuration failure is not a failed skill answer or a passed case.

## Isolation and interpretation limits

The scratch root contains the candidate and supplied fixture only; it does not contain grading criteria or expected answers. This withholds the rubric from normal task context, but **does not enforce read isolation**. Read-only sandbox mode controls writes; it does not turn the working directory into a filesystem jail. The candidate can potentially read accessible paths outside that directory. Do not claim the runner prevents rubric access merely because it stores rubrics elsewhere.

The host reported **57 discovered skills**, including the candidate. User, system and plugin content was inherited, not disabled. Consequently these are native-host observations with the user's surrounding configuration, not an isolated measurement attributable only to the candidate. Preserve that fact in later result metadata. If a stricter experiment is required, introduce an independently verified isolation method as separate work rather than changing global configuration or pretending it already exists.

No subagent calls or external-service tool calls were observed. The positive only read the candidate; the nontrigger used no tools. Read-only review cases can use this harness. Implementation cases require a separately selected workspace-write sandbox, fixture changes captured as diffs, and verification of that permission mode; these two probes do not establish write-mode behavior.

## Contract for the later twenty trials

- Stage one exact final candidate package and a fresh case fixture. Record byte hashes and the host version. Supply no rubric, scoring hint or expected answer to the candidate.
- For relevant-case evaluation, issue the authored natural task; do not preload the body with an explicit `$skill` mention when testing selection. For the nontrigger, expose only the normal candidate description and files on disk.
- Retain full relevant JSONL, final answer, observed skill reads, executed checks, permission errors, timeout status and any implementation diff. Do not classify a skill as loaded from self-report alone.
- Give the independent scorer the frozen rubric and recorded candidate result. Separate trigger behavior, task correctness and unsupported claims. A good answer without a skill read is not evidence that the skill helped.
- Run at most two native processes concurrently, preserve inherited models, and keep child delegation disabled for these single-skill trials. Workflow orchestration needs its own smoke test with delegation enabled.
- Report catalog contamination and filesystem-read limitations. These twenty observations can support qualitative confidence; without a matched control they do not establish measured improvement over the base model.

Global configuration, authentication and project trust remained unchanged. The earlier [native compatibility report](native-compatibility.md) covers the old CLI limitation and Claude authentication block; no Claude run was attempted here.
