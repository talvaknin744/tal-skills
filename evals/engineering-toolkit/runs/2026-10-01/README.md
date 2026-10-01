# Distributed-system skill observations — 1 October 2026

Six unique cases were completed and independently scored in nine retained attempts.
Latest results are **4 pass, 2 partial, 0 fail**. Two earlier attempts were blocked
before model execution by an obsolete desktop binary path; one maintenance attempt
timed out without a completed answer. These are review skill trials, not production
workloads, native workflow tests, or named-role delegation tests.

| Case | Independent result | Evidence |
| --- | --- | --- |
| Window finality, duplicates, revisions and replay | Pass | [03-stream-window](03-stream-window/) |
| Finite local date grouping (nontrigger) | Pass | [05-stream-local-nontrigger](05-stream-local-nontrigger/) |
| Maintenance distribution, useful yield and constrained budgets | Partial | [06-maintenance-policy](06-maintenance-policy/) |
| Finite local filename cleanup (nontrigger) | Pass | [07-maintenance-local-nontrigger](07-maintenance-local-nontrigger/) |
| Historical enrichment, correction and withdrawal | Partial | [08-stream-history](08-stream-history/) |
| Backfill restart, takeover and retirement admission | Pass | [09-maintenance-retirement](09-maintenance-retirement/) |

The maintenance policy answer passed every critical criterion. It omitted an
independent content/deletion oracle and explicit resource-peak reporting in its
proposed validation. The historical enrichment answer correctly distinguishes
as-of from latest values and produces 110 → 115 → unmatched. It does not explicitly
state the rubric's boundary between projection changes and repeating payments or
invoices. No repeated business action was proposed or executed. Both original
partial scores remain intact; a successful core result does not erase an omission.
The entrypoints and conditional references already require these verification
and effect boundaries. One response does not establish their reliable adherence.

Candidate metadata was observed for all six completed attempts. Positive cases
showed instruction-body/reference reads; neither nontrigger showed a candidate
body read. Absence of a recorded read does not exclude unrecorded loading. All
fixtures stayed unchanged. Local arithmetic or proposed-function checks were
observed where recorded; no actual engine, migration, or fleet behavior was tested.

[summary.json](summary.json) records every attempt, exact candidate identity,
activation observations, omissions, and latest selection. [freeze.json](freeze.json)
binds the candidate packages, case inputs, evaluator, and dependencies; the two
[candidate copies](candidates/) retain their actual reviewed instructions.
The independent scorers were `/root/archive_quality` for stream processing and
`/root/archive_infra` for maintenance; neither authored these packages or responses.
Original seals and independent score bindings were validated before archiving.

Every attempt retains **case_compliant: false**: inherited guidance/tools remained,
reads were not restricted to the trial, withheld rubrics had no OS read boundary,
and network restrictions were not fully enforced. Subagents were disabled. The
model and reasoning configuration were inherited, not changed for these trials.
No causal skill-uplift, enforced isolation, or general correctness claim follows
from these results.

Use the explicit current desktop binary for reproduction:

```sh
node scripts/evals/cli.mjs run --trial /path/to/prepared-trial --binary /Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex --execute --timeout-ms 720000
```

The current npx packaging changes followed trial completion. This archived freeze
retains its original runner/package/lock identities; it does not claim those later
changes were part of the evaluated snapshot. Reproducing a changed snapshot needs
a fresh freeze rather than reuse of this historical one.

Each attempt publishes its raw project inputs, final project, answer when present,
observable JSONL trace, prompts, discovery, diff, and execution record. Completed
attempts also retain rubric, independent score, and score validation. Private local
paths are replaced with explicit placeholders; no reasoning items were observed
or published. Per-attempt manifests record original and published hashes and
omissions. Mutable controls, duplicate installed candidates, and temporary scorer
workspaces are excluded. Publication transformations do not preserve original raw
seals; the declared hashes make that distinction checkable. The top manifest binds
this README, summary, freeze, and retained candidate copies.
