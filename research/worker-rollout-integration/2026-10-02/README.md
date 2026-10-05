# Worker rollout and distributed-systems integration

This change adopts the [October research](../../distributed-systems-followup/2026-10-01/README.md)
into existing packages. Public names remain stable; the collection still has
49 skills, 15 specialists and eight workflows.

| Decision | Adopted guidance | Discriminating check |
| --- | --- | --- |
| Preserve long work through worker replacement | [graceful-draining](../../../skills/engineering/graceful-draining/SKILL.md) and [worker workflow](../../../workflows/tal-worker-rollout/WORKFLOW.md) | Authoritative inventory, real stop signals, compatible continuation, receipt recovery and rejected stale writes |
| Publish a delayed cache fill or backfill safely | [concurrency-correctness](../../../skills/engineering/concurrency-correctness/SKILL.md) | One payload/token snapshot; non-reused incarnation plus revision across delete/recreate |
| Accept independent concurrent decisions | [merge invariants](../../../skills/engineering/concurrency-correctness/references/merge-invariants.md) | Converged replicas can still contain two final reservations against stock of one |
| Expose or roll back an evolving schema | [schema evolution](../../../skills/engineering/infrastructure-change-safety/references/schema-evolution.md) | All writers maintain revision; all required shards and data coverage are ready; rollback preserves a bridge/fallback |
| Protect quiet tenants from long jobs | [queues and fairness](../../../skills/performance/overload-control/references/queues-and-fairness.md) | Prefetched/blocked work consumes residency; borrowing requires actual bounded reclaim |
| Carry a deadline and release resources safely | [deadline domains](../../../skills/engineering/microservice-operations/references/deadline-domains.md) | Serialization/clock boundaries and cancellation request versus actual work termination |

The [adoption ledger](adoption.json) records each trigger, failure mechanism,
scope limit, counterexample and verification requirement. Source scopes stay in
the installable package references and original research records; no book is
represented as fully read when only selected chapters were available.

## Evidence surfaces

The [worker runtime example](../../../examples/worker-rollout/README.md) uses
short POSIX processes and a disposable PostgreSQL instance. Its database owns
job progress, receipts and fenced effects. The older
[draining example](../../../examples/draining/README.md) and its observations
remain historical. No Kubernetes deployment, 24-hour endurance run, external
effect provider or database crash/failover guarantee follows from this local
example.

The [integration evaluation suite](../../../evals/worker-rollout-integration/README.md)
keeps raw project fixtures separate from scoring criteria. Single-skill trials
use metadata discovery with child agents disabled. Native workflow scenarios
install the workflow and its specialist dependency closure, then observe role
dispatch, ownership assignments and independent review. These are distinct
tests of instructions; a planning artifact is not runtime implementation proof.

Independent [instruction review](instruction-review.md) and
[runtime review](runtime-review.md) bind their conclusions to the file bytes
they examined. Review findings, corrections, executed checks and remaining
limits are retained separately from authored cases.

The schema guidance received a [post-evaluation review](instruction-review-update.md).
The evaluation policy and unchanged-case routing have a separate
[regression-policy review](instruction-review-regression-update.md), followed by
[execution-control and archive checks](instruction-review-execution-controls-update.md).
Public review records normalize local paths through an explicit
[original/published hash map](publication-normalization.json).

## Evaluation change contract

The repository now requires relevant existing-behavior and nontrigger checks,
plus focused evaluations for new capabilities. This is written in
[AGENTS.md](../../../AGENTS.md), the
[contributor contract](../../../CONTRIBUTING.md#changing-skills-agents-or-workflows)
and the shared specialist contract. Original case inputs, rubrics and historical
results stay unchanged. An unmet old gate remains visible even when new-feature
checks pass.

The [initial deterministic validation record](validation.json) preserves the
earlier 460/460 test result with zero failures/skips and 46 generated adapters.
It is historical evidence and is not rebound to later repairs. The first checkpoint
[publication validation](validation-publication-15.json) passed 521 tests with
zero failures, skips or cancellations; all 46 generated adapters are current.
Its source inventory and output hashes are separate from behavioral scores.

The [first repair review](instruction-regression-repair-review.md) is structural
evidence, separate from the subsequent behavioral partials. An independent
[schema input audit](schema-oracle-input-audit.md) found a missing numeric
mapping contract in one new case. Its original evidence is retained, alongside
the versioned correction in the schema corpus.

The [published trial index](../../../evals/engineering-toolkit/runs/2026-10-02/README.md)
separates integration cases, unchanged legacy regressions, native workflow
observations and real runtime checks. Single forward runs with inherited
guidance do not establish causal improvement or guaranteed regression freedom.
Partial critical scores remain unapproved behavior, not a successful release
gate. Complete-source declarations protect the published candidate and fixture
inventories against silent truncation; integrity checks do not grade responses.

The current package observations pass all selected existing-behavior and
nontrigger criteria. Schema/backfill, cache/merge and Python/Go deadline cases
also pass their selected new criteria. The overload follow-up now passes both
selected substantive cases at 14/14, plus the unchanged tenant-fan-out case at
10/10, wording nontrigger at 6/6 and new local-task nontrigger at 8/8. The final
source routes broker and tenant reviews to one response scaffold covering fleet
receipt limits, recovery, actual release, interruption costs and verification.
Its coverage audit checks every applicable field before completion.
Original cases and scoring criteria remain unchanged.

The [first checkpoint](release-checkpoint-15.json) was committed and pushed as
`ae30ed6` with successful CI while its two new overload cases remained partial.
The later source16, source17 and source18 partials also remain in the trial
index, including the corrected source18 critical partial. Their scores are not
rebound to source19. The [source19 static review](static-review-19.md)
and [fresh publication validation](validation-publication-19.json) are separate
structural evidence. Fresh repository validation passed 521 tests with zero
failures, skips or cancellations; all 46 generated adapters are current.
Selected forward passes do not establish causal improvement,
complete regression freedom or deployed broker/scheduler behavior.

The latest independent native scores are 16/16 for the original workflow,
22/22 for repeated retirements and 6/6 for the finite local task. They bind their
actual staged dependency closures, including versions collected before the last
conditional package edits. The unchanged workflow and roles, current package
checks and latest structural installation are separate evidence surfaces.
Native plans remain HOLD pending actual platform rehearsal. Raw host deviations
and the lack of a complete resolved tool-registry capture remain explicit in the
[source qualification](native-linux-isolation-source-qualification.md).

The [source14–15 review](output-contract-static-review-14-15.md) verifies the
narrow instruction changes and frozen case/runner identities. It does not grade
behavior or erase earlier partials. Luna independently scored the latest native
and overload observations; the subject trials retain their inherited model.

## Installation

Both project-local host layouts installed with the worker workflow and selected
correctness, infrastructure, overload and operation skills. The
[initial record](installation-record.json) and earlier
[pre-repair record](installation-final-record.json) retain their historical
dependency closures. The [checkpoint-08 installation](installation-final-08.md)
and [checkpoint-11 installation](installation-final-11.md) remain historical.
The [first published installation](installation-final-15.md) and subsequent
[source16](installation-final-16.md) and [source17](installation-final-17.md)
records remain historical. The [latest installation](installation-final-19.md)
matches all five frozen package trees and verifies all 232 managed data files against source and adapter
bytes and modes. Its repeated installation changed zero files. These are
structural installer checks; they do not establish Claude or Codex execution.
The hold recorded inside that immutable checkpoint describes its collection
time; the final publication status appears in the trial index.

Native trials inherit model settings. Single-skill CLI trials do not confine
filesystem reads, and inherited guidance is available, so observed success cannot be
attributed solely to the candidate instructions. An explicit workflow invocation
on a finite local task tests its narrow-path boundary; it does not test implicit
nonactivation. Structural checks never start a model or container.
