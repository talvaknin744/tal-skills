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
  "elapsed_seconds": 0,
  "tool_calls": 0,
  "token_usage": null,
  "reviewer": "<anonymized reviewer identifier>"
}
```

The zeros and placeholders above describe the record format; they are not measured results. Keep run artifacts outside the fixtures. Publish results only after actually executing the cases and checking their evidence.

## Automated checks

Run `npm test` for all deterministic checks, or `node --test tests/<skill-name>/evals.test.mjs` to validate one corpus. These checks cover case identifiers, rubric structure, capability declarations, and fixture existence and isolation. A **corpus integrity check** is not a behavioral evaluation of the agent. Architecture's book-contract recovery is tested separately by its contract tests; idempotency fixtures are examples to inspect, not a production idempotency library.
