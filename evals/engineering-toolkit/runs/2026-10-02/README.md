# October 2 integration and regression evidence

These forward trials evaluate the revised existing packages. They do not
establish that the collection is regression-free. Original prompts, raw
fixtures, rubrics and historical results remain unchanged; new-capability and
existing-behavior results are reported separately. See the
[integration record](../../../../docs/research/worker-rollout-integration/2026-10-02/README.md)
and [per-trial results](results.json).

This publication checkpoint preserves passing existing-behavior checks and the
remaining limitations in new-capability checks. The two latest substantive
overload cases are partial: all their critical safety criteria pass, but the
delivery case omits explicit capacity/redelivery verification and the resident
case omits the discussion of lost or repeated useful work under interruption.
Neither is represented as a complete new-capability pass. Earlier failed,
partial and blocked attempts remain unchanged.
The original new schema case lacked an independent status-code contract. The
independent
[input audit](../../../../docs/research/worker-rollout-integration/2026-10-02/schema-oracle-input-audit.md)
documents that omission. The passing [versioned case](37-schema-contract-v2/review.md)
supplies the contract;
the original case, rubric, fixtures and partial results stay unchanged.

## Current package observations

These are the latest independently scored observations for the five package
trees published in this checkpoint. Existing cases and their rubrics remain
unchanged. Each new capability has its own executed case; a passing new case
does not substitute for an existing-behavior check.

| Package tree | Existing relevant case | Existing nontrigger | New relevant cases | New nontrigger |
| --- | --- | --- | --- | --- |
| Cache correctness (`3c664049…`) | [Pass](67-regression-cache-report-final/review.md) | [Pass](68-regression-cache-nontrigger-report-final/review.md) | [Cache pass](69-cache-report-final/review.md), [merge pass](63-merge-reservation-final/review.md) | [Pass](70-cache-nontrigger-report-final/review.md) |
| Schema change safety (`a3e43540…`) | [Pass](94-regression-schema-report-final/review.md) | [Pass](95-regression-schema-nontrigger-report-final/review.md) | [Schema pass](92-schema-contract-v2-report-final/review.md), [backfill pass](93-backfill-report-final/review.md) | [Pass](96-schema-nontrigger-report-final/review.md) |
| Service operations (`23f7986b…`) | [Pass](65-regression-operations-final/review.md) | [Pass](66-regression-operations-nontrigger-final/review.md) | [Python pass](71-deadline-report-final/review.md), [Go pass](64-go-deadline-final/review.md) | [Pass](72-deadline-nontrigger-report-final/review.md) |
| Overload control (`1fbcff1c…`) | [Pass](98-regression-overload-report-final/review.md) | [Pass](99-regression-overload-nontrigger-report-final/review.md) | [Delivery partial](97-delivery-dependency-final/review.md), [resident partial](100-resident-fairness-report-final/review.md) | [Pass](101-overload-nontrigger-report-final/review.md) |
| Graceful draining (`050fc9d0…`) | [Pass](13-regression-drain/review.md) | No existing corpus case | Native workflow observations below | Explicit native local-task boundary below |

Every criterion in the linked existing-behavior and nontrigger observations
scores 2. Every critical criterion in the latest linked new cases scores 2;
the two overload major partials remain follow-up work. This closes the selected
existing-behavior gates, not every possible regression. No live broker or
production scheduler verification follows from a proposed schedule.

## Latest native workflow observations

| Original scenario | Latest observation | Scope |
| --- | --- | --- |
| Unchanged original worker workflow | [16/16](89-regression-native-final/review.md) | Native specialist selection, owner correction and final independent review |
| Repeated worker retirements | [22/22](90-native-repeated-retirements-final/review.md) | Correct planning/review chain; the plan remains HOLD pending real implementation and platform rehearsal |
| Finite local-script boundary | [6/6](91-native-local-boundary-final/review.md) | Exact label/count output and one-file change; no specialist dispatch or rollout ritual |

These scores cover the frozen dependency closure actually installed in each
trial. Some closures precede the final conditional schema guidance edits; they
are not rebound to the latest installation digest. The current package checks
above are separate observations. The original workflow and role definitions
remain unchanged. The finite task explicitly invoked the workflow, so it does
not establish implicit nonactivation.

The Linux collector used a pinned Codex binary and image, physically restricted
write mounts, pre-turn command probes and scoped cleanup. The independent
[source qualification](../../../../docs/research/worker-rollout-integration/2026-10-02/native-linux-isolation-source-qualification.md)
supports the enabled coding surfaces; a complete resolved tool-registry capture
was unavailable. Raw `case_compliant=false` and capability deviations remain
visible separately from the original rubric outcomes. These observations do not
establish universal isolation or production rollout safety.

## Earlier completed single-skill cohort

Each linked result is independently scored against its unchanged criteria and
bound to the candidate files it examined. Every criterion in this selected
cohort scores 2. Later source edits require their own observations; these passes
are not rebound to new versions. Earlier partials remain in the index.

| Recorded package | Existing relevant case | Existing nontrigger | New relevant case | New nontrigger |
| --- | --- | --- | --- | --- |
| Cache correctness (`477470e2…`) | [Pass](50-regression-cache-repair-final/review.md) | [Pass](52-regression-cache-nontrigger-final/review.md) | [Pass](51-cache-repair-final/review.md) | [Pass](53-cache-nontrigger-final/review.md) |
| Schema change safety (`c67c326d…`) | [Pass](31-regression-schema-repair-02/review.md) | [Pass](34-regression-schema-nontrigger-repair/review.md) | [Pass, versioned input contract](37-schema-contract-v2/review.md) | [Pass](40-schema-nontrigger-repair/review.md) |
| Service operations (`fa2ade9d…`) | [Pass](32-regression-retry-repair-02/review.md) | [Pass](38-regression-operations-nontrigger-repair/review.md) | [Pass](35-deadline-repair-02/review.md) | [Pass](41-deadline-nontrigger-repair/review.md) |
| Overload control (`103bd66c…`) | [Pass](16-regression-fairness/review.md) | [Pass](20-regression-fairness-nontrigger/review.md) | [Pass](03-resident-fairness/review.md) | [Pass](04-fairness-nontrigger/review.md) |
| Graceful draining (`050fc9d0…`) | [Pass](13-regression-drain/review.md) | No existing corpus case | Not completed in this cohort | Not completed in this cohort |

The abbreviated identities are package-tree hashes; the linked run records
contain their complete values. This cohort closes its selected case gates, not
every possible behavior or a controlled attribution experiment. Cache protected
checks exercise five old and six new orderings; those fixture checks do not prove
a production cache/database adapter contract.

## Historical observation cohorts

The tables below describe the initial observation cohorts. Later attempts are
listed separately in the complete per-trial result index; they do not erase the
earlier outcomes.

## New capability observations

| Concern | Relevant case | Nontrigger | Remaining gate |
| --- | --- | --- | --- |
| Cache incarnation and snapshot | [Pass](01-cache-incarnation/review.md), six protected model checks | [Pass](05-cache-nontrigger/review.md) | Real cache/database adapter behavior is outside the fixture |
| Schema writers and exposure | [Initial partial](02-schema-rollout-partial/review.md), then [partial retake](07-schema-rollout-retake/review.md) | [Pass](08-schema-nontrigger/review.md) | Retake reports the complete expected data comparison, but does not explicitly establish revision maintenance for V1/V2 |
| Resident fairness and reclaim | [Pass](03-resident-fairness/review.md) | [Pass](04-fairness-nontrigger/review.md) | Closed fixture schedule; no live scheduler or latency evidence |
| Deadline and cleanup | [Initial partial](06-deadline-partial/review.md), then [partial retake](09-deadline-retake/review.md) | [Pass](10-deadline-nontrigger/review.md) | Retake improves cleanup/recovery checks but omits the explicit `wait_for` cancellation-wait overrun caveat |

Every critical partial remains unmet for its recorded attempt. Later passing
retakes do not relabel it. The schema and deadline
reference edits were independently reviewed and retested against the same
original rubrics and raw inputs. Earlier partials were retained. This is not a
controlled baseline comparison or proof that those edits caused improvement.

The second positive cases—merge reservation boundaries, recreated-identity
backfill, delivery/dependency budgets and Go clock handoff—are authored but not
executed in this cohort. The native deadline/cancellation fixture is also
authored, not executed.

## Established behavior checks

| Existing case | Result |
| --- | --- |
| Rolling worker drain | [Pass](13-regression-drain/review.md); all six criteria satisfied |
| Cache fill/invalidation | [First metadata-gap attempt](14-regression-cache-metadata-gap/review.md), then [partial canonical retake](22-regression-cache-retake/review.md); all three critical criteria and five protected checks pass, explanation boundaries remain partial |
| Schema cutover window | [Partial](15-regression-schema/review.md); compatibility passes, blocked-cutover state/recovery and held-lock verification remain underspecified |
| Tenant fan-out | [Pass](16-regression-fairness/review.md) |
| Retry amplification | [Pass](17-regression-retries/review.md) |
| Sequential CSV nontrigger | [Pass](18-regression-cache-nontrigger/review.md) |
| Terraform comment nontrigger | [Pass](19-regression-schema-nontrigger/review.md) |
| Status wording nontrigger | [Pass](20-regression-fairness-nontrigger/review.md) |
| CSS spacing nontrigger | [Pass](21-regression-operations-nontrigger/review.md) |

The first legacy cache trial lacked structured edit/verifier metadata in its
older case definition. Independent protected execution passed all five checks,
but canonical score validation rejected its unchanged empty-list scope audit.
The runner now freezes the scope and command already stated by that original
prompt and rubric. A fresh trial used those controls; no earlier run was rebound
or retrospectively relabeled. Its remaining partials concern the post-write
acknowledgement read boundary and replica/floor-lifetime limits.

This selection covers representative affected boundaries, not every case in
the older corpora. No existing graceful-draining nontrigger was available in
that corpus; the explicit native local-task boundary below is separate evidence.

## Native workflow and runtime evidence

The [new repeated-retirement planning scenario](11-native-repeated-retirements/review.md)
observed native durability and infrastructure specialists and an independent
review/correction chain. The [finite local-task boundary](12-native-local-boundary/review.md)
observed no child dispatch and the exact label edit. Both retain the managed
verifier startup failure: `sandbox-exec: unbound variable: TIOCSTI`, exit 65,
before their observer/script ran. Separately recorded trusted local supplements
passed; they cannot establish managed native end-to-end verification. The local
task explicitly invoked the workflow, so it does not test implicit nonactivation.

Those original scores were independent of the workflow and response, but their
scorer authored part of the installed testing skill. The preserved
[repeated-case qualification](11-native-repeated-retirements/candidate-independence-note.json)
and [local-case qualification](12-native-local-boundary/candidate-independence-note.json)
record that full-closure independence was unmet. They are observations with
blocked verification, not independently approved full-candidate behavior.

The unchanged original workflow case has two later Linux observations. The
[first](54-regression-native-environment-blocked/review.md) is host-invalid:
empty environment selection prevented file and coding tools, despite a
completed transport. The [second](55-regression-native-interrupted/review.md)
reads the workflow and selects the configured durability role, but its
300-second limit interrupts the reviewer and owner before final acceptance.
Their frozen grades remain blocked and incomplete respectively. The revised
collector's [independent source review](../../../../docs/research/worker-rollout-integration/2026-10-02/native-linux-capabilities-code-review.md)
verifies environment selection, execution-phase accounting, scoped write gates
and bounded timeout selection; it does not turn either observation into a pass.
The [later original-case observation](56-regression-native-reviewed/review.md)
passed its original rubric. A subsequent
[provider-capacity block](78-native-original-provider-capacity-blocked/review.md)
is retained without a numeric grade; the latest complete observations appear
above. No failed transport or interrupted review is relabeled as a pass.

The separate [worker runtime](../../../../examples/worker-rollout/README.md)
passed eight scenarios in both author and independent local runs, with 30 real
processes per run and no owned resources remaining. Those results use short
POSIX processes and PostgreSQL-owned effects. No Kubernetes, 12/24-hour
endurance, external provider, broker or database crash/failover guarantee follows.

## Identities and publication

All model observations inherited `gpt-6-sol` / `xhigh` on Codex CLI 0.159.2.
Single-skill observations retain inherited guidance and broad filesystem reads,
so `case_compliant=false` is retained. Later Linux native trials add explicit
instruction/tool restrictions, command boundary probes and physical mounts;
their evidence records separately state remaining capability limitations.
Subject models were not overridden. The latest native and overload independent
scorers used Luna as requested; scoring is distinct from subject execution.
Claude execution was not retried; structural installation for both host layouts
is a different check.

Runner snapshots preserve integration, initial regression, metadata-adapter and
final binding versions. The intermediate runner bytes in
[snapshot 02b](runner-snapshot-02b/snapshot.json) were reconstructed by reversing
one insertion and match the original recorded SHA256 exactly. Freezes bind
candidate, original case, rubric, fixture, runner and dependency identities.
The parent Git commit is context; file hashes identify the uncommitted candidate.

Each archive manifest retains original and published hashes. Public copies
normalize local paths, rebase artifact links and omit hidden reasoning and
unrelated account/remote-control notifications. Complete-source declarations
require the full candidate/fixture/final inventories. Integrity checks verify
these bindings and detect truncation; they never execute or grade a model.

The [exporter](../../../../docs/research/worker-rollout-integration/2026-10-02/archive-evaluations.py)
refuses missing required source directories. Use a fresh destination for every
export. Original trial and score bytes remain distinct from their transformed
public copies.
