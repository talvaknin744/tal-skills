# Independent review: background maintenance

Reviewed 2026-10-01 by the infrastructure research lane, which did not author
this package or its cases. The backend author announced the package and revised
backfill case frozen before the final case review. This is a document, source,
and case-contract review; no agent evaluation, load test, fault injection, or
storage implementation was run by this reviewer. Only this report and the
explicitly assigned infrastructure README link correction were written.

## Verdict and scope

No actionable correctness or case-contract findings in the reviewed snapshot.
The package is ready for the root agent's native trials; this verdict does not
establish that agents follow it or that an implementation meets its contracts.

Read all seven files under `skills/engineering/background-maintenance/` and all
seven under `evals/background-maintenance/`, including the three prompts,
rubrics, fixture inputs, and evaluator guide. Applied the repository's
writing-for-agents requirements to conditional routing and checkable completion
criteria. Compared the maintenance boundary with overload-control,
graceful-draining, idempotency, microservice-operations, and microservice-data.
The distinct decision here is choosing work by useful maintenance yield while
bounding its cost and proving publication/retirement semantics. Companion
skills are optional; bundled references preserve the local boundary.

## Package findings

The entrypoint names a finite set of tasks and explicitly excludes finite local
cleanup. Its five steps finish on observable claims: eligible work and useful
outcome, downstream budgets, bounded overload/recovery, enforceable semantic
boundaries, and evidence actually obtained. The policy and reclamation
references have conditional pointers covering their branches. The entrypoint
keeps review, design, and implementation modes distinct without prescribing
production settings.

`policy-and-control.md` separates bytes from object/metadata count, gross source
retirement from net reusable capacity, and planner limits from worker and
downstream limits. It requires shared accounting, feedback-direction checks,
telemetry delay handling, bounded recovery, and treatment of deferred debt.
These address concrete failure modes rather than requiring named proprietary
strategies or a fixed strategy count.

`reclamation-safety.md` separates durability, publication, reader transition,
and retirement. Protected-operation version checks address stale owners; final
completion checks are explicitly insufficient. Mutable scans need a source
coverage contract and conditional result application. Retirement proof stays
valid only when new reference, reader, and hold admission is closed at the same
authority. The reference correctly permits cleanup under an immutable,
generation-bound proof after an ownership change rather than requiring a lease
for every cleanup. Its verification oracle checks live content, deletions,
versions, readers, placement, and recoverable temporary output.

## Primary-source check

The independent source helper reread Dropbox's substantive prose and pseudocode;
diagram pixels were excluded. I also retrieved the article and checked the
operational sections. Distribution-sensitive policy, bounded planning, metadata
cost, downstream rate limits, and cell locality are supported. Shared accounting,
controller stability, starvation, and crash-safe lifecycle requirements are
properly identified as original applications. The article's eligibility
threshold prose does not define a portable predicate; the package correctly
requires checking the actual direction. [Dropbox account](https://dropbox.tech/infrastructure/improving-storage-efficiency-in-magic-pocket-our-immutable-blob-store).

The official UCS page displayed version 5.0. Its documented fanout exception to
`max_sstables_to_compact`, exclusion of repair validation from
`concurrent_compactors`, foreground-latency tradeoff, and unsafe-expiration
warning match the package. Further implementation checks remain conditional:
SSTable size targets are approximate, UCS density is not blob occupancy, and
tombstone safety includes repair/grace-period obligations. The current
engine-separation and effective-setting language does not falsely claim these
as hard limits or interchangeable controls. [Apache Cassandra UCS documentation](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/ucs.html).

## Frozen case review

| Case | Independent contract assessment |
| --- | --- |
| `sparse-tail-metadata-pressure` | Five-source dense/middle/tail trials yield 0/300/400 GiB net capacity after whole-volume destination allocation. The supplied 250,000/10,000,000/10,000,000 metadata updates make byte throughput an insufficient ranking. Foreground p99 already violates the declared objective, so unused CPU/disk does not justify 64 workers. Halving the stated `live_fraction < threshold` admits fewer volumes; the rubric separately asks whether that exclusion improves useful yield. Delayed telemetry and per-strategy limits support the requested shared-budget and recovery checks. Producer causation remains an investigation, not a proved fix. |
| `reclaim-after-owner-takeover` | The APIs permit the required minimum protocol: durable output, conditional metadata publication checking versions/tombstones/epoch, durable progress, bounded rescans, and atomic retirement with closed admission and generation-bound deletion proof. They provide no snapshot or log, so continuing admissions can prevent convergence; the fixture and rubric require stating that limit. The first page has unprocessed z, and a saved cursor before accepted publication can skip work. A paused old owner's unconditional publication can restore x or overwrite y after takeover. Completion rejection cannot undo those effects. Buffered copy plus force deletion admits a distinct crash-loss schedule. Reader resolve/pin is atomic, so the expected retirement-race solution is supported. |
| `finite-local-cleanup-nontrigger` | The substring selects a.tmp, b.tmp.backup, and tmp-report.txt. A case-sensitive `.endswith('.tmp')` selects only a.tmp. The prompt asks a finite read-only filter review, making nonactivation an observable boundary rather than a disguised maintenance task. |

Rubrics score causal explanations, supported mechanisms, explicit success/failure
oracles, and unchanged fixtures. They do not award points for headings, source
names, proprietary algorithms, or claimed unexecuted tests. The two positive
cases cover distinct policy/control and backfill/reclamation decisions; the
third tests activation restraint. Actual behavior and efficiency remain for
the root's trial evidence and independent scoring.

## Reviewed identity

All paths below are repository-relative. SHA-256 was read after the freeze
announcement; these hashes identify the reviewed text, not a Git commit.

| File | SHA-256 |
| --- | --- |
| skills/engineering/background-maintenance/SKILL.md | f4fd905b03bbf95980363e43342fa023804d6225a817f20c39f22c020605632c |
| skills/engineering/background-maintenance/references/policy-and-control.md | e6b91d778cdfa396d147bc1f593212b84afcbe4890e8cb186e08b7a735207a24 |
| skills/engineering/background-maintenance/references/reclamation-safety.md | 67119436ad4d497ddc0ab792998026286ea41d1f71f0f9535c079dc345ef1272 |
| skills/engineering/background-maintenance/references/verification.md | 4b5d31f78373b686a4caaf9208ca988226dda91073570ffc0d4681dd1c0c505a |
| skills/engineering/background-maintenance/references/sources.md | ddc037913e22000e3ea6d72853da7facd438577bb4e1194f0415feb089e2bd3c |
| skills/engineering/background-maintenance/agents/openai.yaml | 2f24cf65c305d7f4b33ae8bd116c1e1f2214d8ed6462f2784d9c2d6c19ccd3ba |
| skills/engineering/background-maintenance/LICENSE | ac8d9fdd4a38fc1dcce90d64a1ba0c3b16c3390b1aab352500ddbd46ba0f5ba4 |
| evals/background-maintenance/cases.json | adab29d37a3d0701b419d8104fd615fdad255f64835cea858eacfedfe30727e9 |
| evals/background-maintenance/README.md | fa1744e924dddc5f509e0b908dbb5d61851d68763fa709a159da725e53aa9633 |
| evals/background-maintenance/fixtures/sparse-tail-metadata-pressure/observations.md | b9b54d3baa410795500c8f43431b992b375741bc85b1d76ae7719a54642de9f2 |
| evals/background-maintenance/fixtures/sparse-tail-metadata-pressure/proposal.md | af83ccdb8c5576b885c914de38ac55105fb4f6308c0b3da7f6051efe41a98fb2 |
| evals/background-maintenance/fixtures/reclaim-after-owner-takeover/design.md | f18da0e9af1a716865a9f8c742fbca3ff61e5ec1e7c1701d99042c387db4ef37 |
| evals/background-maintenance/fixtures/finite-local-cleanup-nontrigger/cleanup.py | 5c6a74760962c99547868ca9c704fd782cfafb7b1380618b1e2d9d60e09ed5d1 |
| evals/background-maintenance/fixtures/finite-local-cleanup-nontrigger/requirements.md | 0e39bbeefaeb21a9da2e21f2f974554c24833eb934989aeab318d4b95ee02eb0 |
