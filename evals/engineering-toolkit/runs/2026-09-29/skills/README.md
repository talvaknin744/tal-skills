# Single-skill observations — 29 September 2026

**20 unique cases were executed and independently scored in 26 attempts.** Selecting the latest attempt for each `(skill, case_id)` gives **17 pass, 3 partial, 0 fail**. All 55 critical criteria in that latest selection scored 2. The three partial results retain meaningful verification gaps; they are not counted as passes.

The corpus has 30 authored cases: two positives and one nontrigger for each skill. This archive executes one positive and one nontrigger per skill. The ten second positives remain unexecuted. [summary.json](summary.json) records every attempt, selection rule, candidate identity, scorer, remaining gap and unexecuted case.

| Population | Pass | Partial | Fail | Interpretation |
| --- | ---: | ---: | ---: | --- |
| Initial 20, original scores | 15 | 4 | 1 | First observation of each unique case |
| All 26 attempts, original scores | 20 | 5 | 1 | Includes six reruns; not 26 independent cases |
| Latest attempt per unique case | 17 | 3 | 0 | Ten positives and ten nontriggers across revised candidates |

## Latest results

Each result links to its complete archived run. A pass is an observable rubric result, not a claim of capability isolation, production readiness or general reliability.

| Skill | Positive | Nontrigger |
| --- | --- | --- |
| Python backend | [Partial · 21](21-python-backend-cancelled-export-r2/) | [Pass · 22](22-python-backend-notebook-list-expression-r2/) |
| TypeScript backend | [Pass · 03](03-typescript-backend-untrusted-command-body/) | [Pass · 04](04-typescript-backend-stylesheet-spacing/) |
| Go backend | [Partial · 05](05-go-backend-cancelled-fanout/) | [Pass · 06](06-go-backend-go-comment-typo/) |
| Messaging reliability | [Partial · 07](07-messaging-reliability-reordered-account-events/) | [Pass · 08](08-messaging-reliability-local-observer-callback/) |
| Infrastructure change safety | [Pass · 09](09-infrastructure-change-safety-three-pod-rollout/) | [Pass · 10](10-infrastructure-change-safety-terraform-comment/) |
| Recovery validation | [Pass · 25](25-recovery-validation-restored-order-ledger-r2/) | [Pass · 26](26-recovery-validation-backup-label-r2/) |
| Failure-oriented testing | [Pass · 13](13-failure-oriented-testing-race-clean-lost-update/) | [Pass · 14](14-failure-oriented-testing-pure-format-assertion/) |
| Code and documentation cleanup | [Pass · 23](23-code-and-docs-cleanup-similar-policy-cleanup-r2/) | [Pass · 24](24-code-and-docs-cleanup-new-export-format-r2/) |
| MCP engineering | [Pass · 17](17-mcp-engineering-private-resource-handle/) | [Pass · 18](18-mcp-engineering-plain-json-rpc-helper/) |
| A2A engineering | [Pass · 19](19-a2a-engineering-task-observer-disconnect/) | [Pass · 20](20-a2a-engineering-ordinary-job-endpoint/) |

The remaining major criteria scored 1:

- **Python:** the repair passed supplied cancellation checks, but cancellation before connection acquisition was neither specified nor executed. This is a coverage gap, not an observed implementation defect.
- **Go:** the executed test gates client cleanup and verifies owned workers finish. It does not force the distinct interval after `Get` returns and before the worker sends its result.
- **Messaging:** the response covers duplicates, reordering, commit-before-acknowledgement and poison disposition. It names concurrent validation without supplying a concrete concurrent schedule and assertion.

## Revisions and preserved findings

[R1](freeze-r1.json) binds attempts 01–20. [R2](freeze-r2.json) changes the Python candidate and binds attempts 21–22; [R3](freeze-r3.json) changes cleanup and binds 23–24; [R4](freeze-r4.json) changes recovery and binds 25–26. Complete package hashes, fixture/verifier hashes, private rubric hashes, runner files and dependency locks are retained. Core commit `1b7b68c` and evaluation checkpoint `bc0d751` provide context; content hashes identify the exact candidate, including revisions frozen before commit.

Python's [original score](01-python-backend-cancelled-export/score.json) marked effect uncertainty partial. A [separate independent adjudication](01-python-backend-cancelled-export/adjudication.json) accepted that criterion: the bounded repair preserved identity, introduced no retry and explicitly avoided uncertain retries. Both score files remain intact. The missing pre-acquisition check kept the adjudicated result partial. The later Python rerun also remained partial; **no coverage uplift was demonstrated**.

The original cleanup nontrigger [failed through an observed unnecessary skill read](16-code-and-docs-cleanup-new-export-format/score.json). After narrowing activation guidance, both fresh cleanup attempts passed; no candidate body read was observed on its nontrigger. Recovery's initial response omitted a concrete atomic repair mechanism and scored partial. Its fresh positive supplied effect/completion arbitration and passed, as did its nontrigger. These are revision observations on the same cases, without matched controls or a causal improvement estimate.

## What was observed

All attempts used fresh Codex desktop CLI `0.153.4` sessions with inherited `gpt-6-astra` / `ultra` settings. Native metadata discovery exposed the candidate in all 26 attempts. Successful recorded commands returned the candidate body in all 13 positive attempts and in the original cleanup nontrigger. In the latest selection, all ten positives have observed body reads and all ten nontriggers have no observed candidate body read. `not_observed` is not proof of absence.

Five unique positives required actual fixture edits and executable verification: Python, TypeScript, Go, failure testing and cleanup. All seven implementation-positive attempts have successful, independently rerun supplied verifiers bound to the final project. Four nontrigger cases required actual bounded CSS/comment/label edits; reviewers assessed those diffs. Diagnostic positives include the 18-hour job moving across three rolling pods, reordered messages and restore reconciliation; their recommendations are not live operational tests.

No protected-input or allowed-file violations were recorded. No external-service or delegation events were observed. Nevertheless, **every attempt retains `case_compliant: false`**: reads were not confined to the fixture, inherited guidance/tools remained available, network restrictions were not fully enforced, and effective write enforcement was not independently verified. The private rubric was withheld from the working directory, not protected by an OS read boundary.

These trials disable subagents. They do not establish native workflow or named-agent behavior. See the [separate workflow evidence](../../../native-planning/README.md); Claude's recorded expired-OAuth block must not be converted into a workflow pass. Local fixtures also do not prove broker/cluster behavior, provider integration, full OAuth, or MCP/A2A conformance.

## Archive integrity

Each run contains its answer, trace, exact prompt, discovery metadata, diff, original/final project, frozen rubric, independent score and archive manifest. Aggregation rechecked **502 published file hashes**, four freeze digests, all 26 score bindings/results, the separate adjudication and seven verifier records. Original raw seals were validated by the coordinator before archival; public transformed traces are not claimed to reproduce those original seals.

The exact transmitted prompt is the last `command_argv` string in `evidence/run.json`. Prompt text files add one serialization newline; their archive file hashes therefore differ from the transmitted-string hashes. Removing that one added newline reproduces the transmitted and authored prompt hashes for all 26 attempts.

One transformation exists: [attempt 08's manifest](08-messaging-reliability-local-observer-callback/archive-manifest.json) records omission of an inherited third-party `codebase-design` body from trace line 7. Command, status and locator remain, with original/published file hashes and the omitted output hash. Original sealed artifacts remain outside the public archive. No score or candidate response was rewritten to improve a result.
