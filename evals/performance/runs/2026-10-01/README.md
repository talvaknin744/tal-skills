# Adapted performance forward trials — 2026-10-01

Six independent agents each received one positive request, a frozen candidate
skill and an isolated raw project fixture. Their contexts excluded the scoring
rubric and the parent discussion. A separate evaluator graded the actual saved
answers against the selected rubric arrays. All 25 criteria passed (50/50);
this result covers only these six selected answers.

| Skill | Selected case | Answer | Score |
| --- | --- | --- | ---: |
| performance-diagnosis | held-pool | [answer](performance-diagnosis/answer.md) | 8/8 |
| load-testing | closed-arrivals | [answer](load-testing/answer.md) | 8/8 |
| capacity-planning | backlog-drain | [answer](capacity-planning/answer.md) | 8/8 |
| overload-control | tenant-fanout | [answer](overload-control/answer.md) | 10/10 |
| database-performance | pool-and-lock | [answer](database-performance/answer.md) | 8/8 |
| data-layout-performance | ring-history | [answer](data-layout-performance/answer.md) | 8/8 |

Each skill folder preserves candidate and project snapshots, the request,
pretrial input record, actual answer, tool self-report and selected rubric.
[index.json](index.json) contains the pretrial records. The root process checked
exact candidate/project SHA-256 inventories against those records, compared the
current sources and rubric, and recorded the result in
[integrity.json](integrity.json). Equality establishes final-state preservation;
it cannot establish the absence of transient writes.

[review.json](review.json) and [review.md](review.md) preserve the independent
criterion scores, evidence, arithmetic checks and limitations. Original answers,
self-reports and review artifacts retain their exact bytes, including references
to their original temporary locations. The adjacent archived snapshots preserve
those inputs when the temporary directories no longer exist.

These are adapted forward smoke tests rather than runner-compliant corpus
evaluations. Web and delegation remained available; restrictions were enforced
by instructions rather than tool allowlists. tools.md files are agent
self-reports, not host-exported traces. Model settings were inherited, with the
exact model/version, elapsed time and token usage unavailable. No baseline or
comparative skill-improvement result exists. The other 12 cases, including all
nontrigger cases, were not executed.

The layout agent ran synthetic local correctness checks; the evaluator reproduced
540 checks with 168 numerical mismatches on the supplied ring. No production
load, database, hardware-counter or performance benchmark was executed.

[manifest.json](manifest.json) binds every archived file except itself by SHA-256.
The repository's historical-evidence tests validate that binding and the input
snapshots; they do not rerun or independently grade the agents.
