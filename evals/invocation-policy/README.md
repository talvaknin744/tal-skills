# Invocation policy focused evaluation

These are new focused inputs for the Phase 2 invocation-policy change. Prompts
and raw project inputs live under `cases/`; scoring criteria live separately in
`rubric.json`. Give a candidate only one prompt, its copied `raw/` project,
normally discoverable candidate skills/workflows, and its stated capabilities.
Do not provide the rubric or sibling cases to the candidate.

## Candidate behaviors

The revised policy should leave architecture and the eight `tal-*` generated
workflow entrypoints available by explicit request only, while ordinary promoted
skills remain eligible for normal model invocation and the eight relocated
vendored skills retain upstream invocation flags. This corpus directly tests the
architecture trigger boundary and one representative workflow entrypoint; it
does not independently establish every package's metadata integrity.

## New cases

- `explicit-workflow`: explicit `$tal-cleanup-review` request for a bounded,
  realistic README cleanup. Score useful completion and observable explicit
  workflow loading separately; do not award points for reciting the workflow
  name or headings.
- `routine-pagination-review`: architecture must not be chosen implicitly for
  an ordinary pagination PR review.
- `unrelated-formatting`: a trivial Markdown formatting request must not load
  architecture or a `tal-*` workflow.

For nontrigger runs, expose skill names and descriptions through the normal
discovery mechanism and do not activate them in the prompt. Preserve workspace
diffs and tool traces. The raw project is copied fresh for each run.

## Existing regressions to rerun

Keep original files and rubrics unchanged. Select
`evals/architecture/cases.json#ordinary-pr-nontrigger` and
`#offline-standard-review`, plus the existing representative workflow case
`evals/engineering-toolkit/native-fixtures/tal-cleanup-review` (prompt, rawfiles,
and `case-index.json` entry). The requested
`evals/engineering-toolkit/workflow-fixtures` directory is absent in this
checkout; native-fixtures is the actual workflow-case location.

## Host evidence is separate from response quality

Observe whether the native host discovers and loads the installed entrypoint
before assessing the response. A good-looking answer cannot prove host discovery
or native invocation. Record response behavior, native selection/delegation,
available capability metadata, and workspace changes as separate evidence.
If the native host is unavailable, mark that criterion blocked; do not count it
as passed. A subsequent adapted fresh Luna response run can assess task quality,
but cannot resolve the native-host gap.
