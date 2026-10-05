# Performance skill verification — 2026-10-01

Six new standalone skills were checked using the Skill Creator validator. All
six passed frontmatter, naming and scaffold validation. These checks establish
packaging, not decision quality. Repository checks also cover package-local
references, unique skill names, discovery metadata and documentation links.

The authored corpus has 18 cases: two substantive requests and one nontrigger
request for each skill. Its 42 deterministic tests check scope declarations,
capabilities, observable scoring criteria and complete fixture isolation.
Two additional tests bind the published historical trial artifacts and their
candidate, fixture and selected rubric snapshots.

The final `npm run validate` completed with exit code 0: all packaging,
documentation, toolkit and evidence checks passed, followed by **421/421 tests**
with no failures, cancellations or skips. The complete observed output is saved
in [validation.log](validation.log). `git diff --check` also passed. This result
includes concurrent additions in the shared repository; 44 of the tests cover
the new performance corpus and historical artifact integrity.

## Selected behavioral trials

One substantive case per skill was run in an isolated temporary directory by an
independent agent with only its candidate instructions and raw project inputs.
A separate evaluator scored the actual saved answers and verified their input
hashes. All 25 selected criteria passed, with no critical failures.

| Skill / case | Score | Observed decision |
| --- | ---: | --- |
| performance-diagnosis / held-pool | 8/8 | Identified connection ownership during optional enrichment; preserved authoritative checks and rejected an unbudgeted fleet pool increase |
| load-testing / closed-arrivals | 8/8 | Rejected an independent-arrival capacity claim from an 80-user closed workload; required delivered-demand accounting |
| capacity-planning / backlog-drain | 8/8 | Derived 12-minute recovery including startup; identified the dependency ceiling and preserved accepted jobs |
| overload-control / tenant-fanout | 10/10 | Budgeted fleet fan-out, tenant fairness and durable ownership; held permits until work settles and labeled proposed thresholds provisional |
| database-performance / pool-and-lock | 8/8 | Separated pool/lock waits from isolated query time; required transaction semantics before shortening external waits |
| data-layout-performance / ring-history | 8/8 | Found repeated retained observations; limited modeled endpoint payoff and treated the CPU-heavy batch workload separately |

The layout trial used a deque oracle for the clamped retained-history contract.
It found 168 numerical mismatches across 540 positive-size checks, plus duplicate
visits that sometimes preserved the scalar average. The evaluator independently
reproduced those counts on the unchanged source. Those synthetic correctness
checks supply no performance measurement.

The root process verified complete candidate/project file inventories against
the records written before each trial, including the absence of additional files
or symlinks. Every final snapshot matched, as did the current skill source, raw
fixture, prompt and selected rubric. Final-state equality cannot prove that no
transient writes occurred.

See the [archived trials](../../evals/performance/runs/2026-10-01/README.md)
for exact requests, frozen inputs, answers, self-reported tool use, rubric scores
and SHA-256 bindings.

## Limits

These are adapted forward smoke tests, not runner-compliant corpus evaluations.
Web and delegation remained available and were restricted through instructions.
Tool records are explicit agent self-reports rather than exported host traces;
they cannot prove complete tool use. Exact model/version, elapsed time and token
usage are unavailable. There was no baseline, A/B comparison or repeated model
sampling, so no comparative improvement claim is supported.

The other 12 cases, all nontrigger cases and implementation behavior remain
unexecuted. No live load test, database intervention, hardware-counter experiment
or production performance benchmark was run. Source reviews, authored fixtures,
arithmetic and these saved decisions do not certify deployable capacity or
portable speedups.
