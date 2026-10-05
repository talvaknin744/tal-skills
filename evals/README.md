# Behavioral evaluations

These cases are authored evaluation inputs, **not evidence that the skill has passed a behavioral test**. The fixture code is deliberately small and sometimes flawed. It is material to inspect, not software to deploy.

Each `<skill-name>/cases.json` keeps prompts, available capabilities, and observable scoring criteria separate from the project fixtures. Give the agent only the selected prompt, its fixture directory, the candidate skill, and the stated capabilities. Do not include the rubric, other cases, or this evaluator guide in its context. Each fixture directory is a separate project.

For an instruction change, select existing relevant and nontrigger cases to
protect old behavior, and add a focused case for each new capability or changed
boundary. Run both groups against the revised candidate and report them
separately. Preserve the existing case inputs and rubrics; if a contract changes,
keep the original and explain a versioned replacement. See the
[change evaluation contract](../CONTRIBUTING.md#changing-skills-agents-or-workflows).

## Run a case

1. Copy the selected fixture directory into a fresh temporary workspace. Record the candidate skill's commit, model, settings, available tools, and case ID.
2. Make the candidate skill discoverable through the runner's normal skill mechanism. For the nontrigger case, expose its name and description normally; do not explicitly activate it.
3. Supply the prompt verbatim. Enforce capability constraints in the runner where possible. If a capability cannot be disabled, record the deviation and do not describe the result as compliant with that case.
4. Save the final answer, observable tool calls, workspace diff, elapsed time, and usage metrics if available. Do not request or score hidden reasoning.
5. Score the saved answer and tool trace against the rubric. A source reference must resolve to actual supplied evidence or a source the agent really retrieved. Check that the final answer handles all user questions and that unsupported conclusions are marked unresolved.

## Blind comparison

Compare the original and revised skill on the same cases, model, tool access, and sampling settings. Use fresh sessions and workspaces for every run. Randomize execution order; anonymize outputs as A/B separately for each pair before giving them to a reviewer who did not write either candidate. A reviewer must not infer which skill ran from file names or an appended skill identifier. Run multiple repetitions when budget permits and report the number of runs.

For each criterion, assign **pass (2)**, **partial (1)**, or **fail (0)** and quote the observable evidence for that score. A partial means the response recognizes the issue but omits a material condition or actionable explanation. Treat criteria marked `critical` as gates: any failure makes that run unsuccessful regardless of the aggregate score. Score `major` criteria at weight 2 and `minor` criteria at weight 1; report critical results separately. Report each case independently before an aggregate so that a short, easy case cannot conceal a safety or truthfulness failure elsewhere.

Also compare answer length, elapsed time, tool calls, and reported token usage. These are efficiency measurements, not correctness substitutes. Explain any capability mismatch or evaluator disagreement. Do not award points for naming prescribed experts, using a fixed number of books, emitting a particular heading, or following a ceremonial workflow.

An evaluation record should contain:

```json
{
  "case_id": "outbox-checkout",
  "candidate_commit": "<full commit>",
  "model": "<model and version>",
  "capability_deviations": [],
  "artifact_paths": {"answer": "...", "trace": "...", "workspace_diff": "..."},
  "criteria": [{"id": "...", "score": 0, "evidence": "..."}],
  "activation_rate": {"body_reads": 0, "normal_discovery_attempts": 3, "skills_read_instead": [], "explicit_invocation_evidence": null},
  "elapsed_seconds": 0,
  "tool_calls": 0,
  "token_usage": null,
  "reviewer": "<anonymized reviewer identifier>"
}
```

The zeros and placeholders above describe the record format; they are not measured results. Keep run artifacts outside the fixtures. Publish results only after actually executing the cases and checking their evidence.

Report activation alongside critical scores: automatic positives need at least two observed body reads in three fresh normal-discovery attempts. Keep all attempts, timeouts and skills read instead. After a description change, repeat that skill's positives three times and its complete existing nontrigger set once. For explicit-only skills, report observable invocation evidence separately; response markers establish only the tested output contract, and do not prove hidden body injection.

For each published release, list evaluation artifacts by asset name, candidate commit, runtime/package hash, case set, and host. State whether each artifact is bound to the exact release source or to a pre-release candidate, and list unexecuted coverage. Keep prior release assets intact when attaching an artifact to a later release.

## Release evidence associations

The `v1.1.0` release carries the archives below. These are evaluations or attempts against identified pre-release candidates, not a claim that every case ran against the final release commit. The earlier follow-up asset remains unchanged on `v1.0.0` and is attached again with identical bytes.

| Asset | Candidate and host | Retained results |
| --- | --- | --- |
| `tal-skills-cleanup-followup-2026-10-05.tar.zst` | PR #14 candidate forms; canonical digest `71faa28065eb8c6f3d639bba3969f73910e67e39183f22d3215a2693db7a055b`, generated Codex digest `1f87df85b6866186ac4893876d977f7c8a660a343ac85fdcf4337f8d3764befd`. | [119 scores and 120 attempts](cleanup-followup/runs/2026-10-05/review.md), with prior failures and host gaps. |
| `tal-skills-handoff-fallback-2026-10-05.tar.zst` | R1 source equivalent to `83627a5`; frozen canonical digest `cf9449f0ec966013b1cdacfcac16ee06dfb3a0161ad6bb168c746520a2acaad5`, generated Codex digest `b8811ff601af2272fbb3d793dff45e160e2df71e44ae4aad0f92d3af6bb77f23`. | [39 independently scored cases](cleanup-followup/runs/2026-10-05-r1/review.md), including remaining critical partials and quote-audit gaps. |
| `tal-skills-activation-rate-2026-10-05.tar.zst` | R3 mixed frozen candidates; final skill source equivalent to `e6942fd`, canonical digest `02811e198b88054357d518e3ed8389bf002d70189b482ac2112ad7732af403db`. | [Activation and independent scoring](cleanup-followup/runs/2026-10-05-activation/review.md); the report identifies each attempt's candidate and invocation surface. |
| `tal-skills-claude-code-2026-10-05.tar.zst` | Claude Code 2.1.150; isolated installation of 1.0.0 matched marketplace commit `74d141db54dddaec5b594fcf1f0d6d047a6a51b4`. | [Installation and blocked attempts](claude-code/runs/2026-10-05/review.md): zero completed behavioral cases and zero scores; authentication remains unresolved. The [publication receipt](claude-code/runs/2026-10-05/publication-receipt.json) maps the retained internal bundle to the redacted public copy. |

## Automated checks

Run `npm test` for all deterministic checks, or `node --test tests/<skill-name>/evals.test.mjs` to validate one corpus. These checks cover case identifiers, rubric structure, capability declarations, and fixture existence and isolation. A **corpus integrity check** is not a behavioral evaluation of the agent. Architecture's book-contract recovery is tested separately by its contract tests; idempotency fixtures are examples to inspect, not a production idempotency library.
