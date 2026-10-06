# Claude Code 2026-10-06 behavioral run review

**Status: executed.** 169 Claude Code runs completed and were independently graded: the 12 canonical cases, the v3 and v4 sibling-handoff cases in plugin and generated forms, the v1 architecture host-syntax pair, a new v2 host-syntax pair, the complete existing case sets of the four skills changed by `fix/critical-partial-gates`, and a Sonnet comparison. No run was auth-blocked. This record does not replace the [2026-10-05 blocked record](../2026-10-05/review.md); that record stays as the macOS installation evidence and its blocked attempts remain visible. Nothing here is a production guarantee.

## Host and candidate

Claude Code 2.1.289 ran in an isolated cloud Linux workspace with normal account authentication and a fresh `CLAUDE_CONFIG_DIR` per attempt. The plugin form passed a frozen `git archive` of the candidate tree as `--plugin-dir` with `--setting-sources local`; the generated form copied `scripts/install-toolkit.mjs --host claude` packages into the project's `.claude/skills` with `--setting-sources project,local`. Web, subagent and workflow tools were disallowed through the CLI tool policy; the filesystem was not jailed. The case prompt was sent verbatim as one stream-json user message and replayed into the saved trace, so the exact text the host received is in every trace. Canonical corpus cases carry the same framing sentence the Codex runner composes ("The supplied project is in the current directory. Use relevant installed skills when useful."); Claude-specific and follow-up cases carry no prefix.

Three score sets ran against commit `594ff61` (tree `35e0e6e1`, the seven-partial fix on top of `1a32344`); the refinement rerun ran against `2d9312f`, which changes only `failure-oriented-testing` and `idempotency`. Package digests are in [report.json](report.json) and `candidate/` inside the archive. This is not the README marketplace installation path and not a clean physical machine.

## Activation

Activation is counted as a successful `Skill` tool invocation whose result returned the target skill (or, for message-initial slash commands, the host's `<command-name>` expansion in the replayed user message). Direct reads of `SKILL.md` did not occur in any run.

With Haiku 4.5 responders (`claude-haiku-4-5`), normal-discovery positives reached the 2-of-3 bar for `graceful-draining`, `performance-diagnosis`, `idempotency` (scoped transfer and most other cases), `failure-oriented-testing` (green transaction fake) and `microservice-extraction` (v3 sibling handoff), and missed it for `concurrency-correctness`, `recovery-validation`, `python-backend`, `microservice-testing`, `technical-deprecation`, `failure-oriented-testing` (race clean lost update) and two idempotency cases. Explicit skill-name requests (the v4 case) activated both skills in 6 of 6 attempts in both installation forms. All four Haiku nontriggers stayed silent in the Claude Code set; in the changed-skill set the `pure-format-assertion` nontrigger invoked `failure-oriented-testing` once in one attempt, and did not in the refinement rerun.

With Sonnet responders, every low-activation positive reached 3 of 3: `concurrency-correctness`, `recovery-validation`, `python-backend`, `failure-oriented-testing`, `idempotency`, `microservice-testing` and `technical-deprecation`. The activation gap is therefore the responder model, not the descriptions, which are unchanged from the activation retest.

Host syntax. Claude Code expands a slash command only when it begins the message. The v1 pair places `/architecture` or `/tal-skills:architecture` mid-sentence; both forms were left to the model, which invoked the skill in 1 of 6 Haiku attempts and 1 of 6 Sonnet attempts and otherwise read the files directly. The new v2 pair places the same command first: the host expanded both `/architecture` and `/tal-skills:architecture` to `<command-name>/tal-skills:architecture</command-name>` in 6 of 6 attempts and injected the body (a preliminary probe answered the body's first heading). The unqualified form resolves because the plugin command is unique in that profile; no Skill tool call occurs in this path, so the v1 criterion text "actual Claude Skill tool invocation" cannot be met by a message-initial command on this host. The v1 cases, criteria and scores are retained unchanged; v2 scores the host's actual mechanism.

## Independent grading

A separate Sonnet process graded every run from the case prompt, rubric, saved answer, observable trace summary (replayed user message, every tool call and result head) and workspace diff; it never saw a skill body. Every evidence quote was checked as an exact substring of the answer, trace or diff. 38 of 821 graded criteria (4.6 percent) carry an attribution gap, mostly a grader quoting the run metadata line instead of the diff or reformatting a code quote; scores were not changed by the audit and the failed quotes remain visible in the rows.

| Score set | Responder | Rows | Pass | Critical partial rows | Critical zero rows | Quote gaps |
| --- | --- | --- | --- | --- | --- | --- |
| claude-code-haiku | claude-haiku-4-5 | 49 | 4 | 33 | 16 | 13 |
| changed-skills-haiku | claude-haiku-4-5 | 40 | 2 | 31 | 6 | 10 |
| sonnet-comparison | claude-sonnet-5-5 (host alias `sonnet`) | 45 | 23 | 9 | 8 | 9 |
| refinement-rerun | haiku and sonnet, candidate `2d9312f` | 35 | 4 | 19 | 3 | 6 |

The Haiku critical zeros are concentrated in `recovery-identity`, `effect-uncertainty`, `atomic-boundary`, `no-invented-capability`, `explicit-native-read` (`$architecture` is Codex syntax and did nothing on this host, as designed), `actual-sibling-handoff` and the v1 architecture pair. The Sonnet critical zeros are the v1 architecture pair and the `$architecture` case only. Haiku responses with an activated skill still scored partial on most criteria; this is a responder quality floor, visible in every set, and it is why the quality conclusions below rest on the Sonnet rows.

## The seven critical partials

| Criterion | Haiku, skill activated | Sonnet, candidate `594ff61` | Sonnet, candidate `2d9312f` |
| --- | --- | --- | --- |
| failure-oriented-testing `oracle` | 1, 1, 1 (activated in 1 of 3) | 1, 2, 2 | 2, 2, 2 |
| idempotency `scoped-auth` | 1, 1, 1 then 1, 1, 2 | 2, 2, 2 | 2, 2, 2 |
| idempotency `intent-binding` | 1, 1, 1 then 1, 1, 1 | 2, 2, 2 | 2, 2, 2 |
| microservice-testing `breaking-change` | 1, 1, 1 (not activated) | 2, 2, 2 | unchanged body |
| technical-deprecation `removal-and-recovery-gates` | 1, 1, 1 (activated in 1 of 3) | 2, 2, 2 | unchanged body |

With Sonnet responders and the skill actually read, all five criteria behind the seven partials pass in 3 of 3 replicates on the final candidate. The Haiku rows keep the partials visible; the grader reasons name the missing elements (route scoping, validated normalized fingerprint, the protected-access framing) that the refinement commit added to the skill text and that Haiku still omitted.

## Changed-skill regression

The complete existing case sets of the four changed skills ran on the Claude host. Sonnet rows on candidate `594ff61`: `unknown-api-consumers` 3 of 3 pass; `mocked-checkout-gap` 2 pass and 1 partial (`confidence-limit`, major); `periodic-export-client` 3 of 3 pass; `config-channel-migration` 2 pass and 1 partial (`staged-rollout-and-adoption`); `natural-invitation-invariant` 3 of 3 pass; `bounded-webhook-edit` 1 pass and 2 partial (`meaningful-checks`, major); `green-transaction-fake` 1 pass and 2 partial (`adapter-check`, major); `scoped-transfer-identity` 2 pass and 1 partial (`read-only`: files unchanged, but the answer did not state that its proposed checks were not executed). No Sonnet row on a changed skill has a critical zero. The idempotency cases `expired-lease-owner`, `unknown-external-payout`, `outbox-send-mark-crash` and `retention-and-version-drift` ran with Haiku only (critical zeros on `atomic-boundary` and `no-invented-capability` in several attempts); Sonnet coverage of those four cases and a Codex-host regression remain open.

## Remaining gaps

The README marketplace installation path was not exercised here; the frozen tree was loaded with `--plugin-dir`. Haiku is below the activation and quality bar for this plugin on this host and should not be used as the evidence responder. Four idempotency cases lack Sonnet rows. The Codex-host regression for the four changed skills, the upload of the 2026-10-05 activation archive, and a versioned re-audit of its 33 quote gaps are assigned to the Codex side and are not claimed here. Nontrigger runs are single attempts. Grader scores are one independent reading per run; no second grader or blind A/B against the pre-fix candidate was run.

Raw artifacts (prompts, answers, traces, stderr, diffs, final project trees, grading packets, raw grader output, run records, harness scripts and candidate identities) are in the external archive bound by [archive-manifest.json](archive-manifest.json); the local evidence root is masked as `<evidence-root>`.
