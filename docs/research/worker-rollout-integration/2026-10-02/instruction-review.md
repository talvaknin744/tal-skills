# Independent instruction review — worker rollout integration

No unresolved material instruction finding remains in the frozen candidate. Two schema-guidance issues found during candidate review were corrected and rechecked. This is a technical review of instructions, distinct from observed native behavior or runtime validation.

Reviewed 2026-10-02T08:17:41.350337+00:00. Git context: `e75ec059f69b503957bf08e8e24c99cc5b45d68a`. Candidate file hashes below are authoritative for uncommitted edits. Authors froze the relevant surfaces before final binding. The reviewer authored none of these candidate instructions and scored no native responses.

## Resolved findings

1. **IR-01 / P2 — Require all writers to advance the source revision.** The schema reference formerly allowed revision-based backfill and reader fallback without establishing that old-only writers update the revision with the business mutation. Such a write could leave stale mapped data apparently current. Final `schema-evolution.md:24–39` requires that prerequisite or another enforceable protocol, and requires non-null source/mapped comparisons.

2. **IR-02 / P2 — Scope the index-build gate to its engine protocol.** The maintenance-before-backfill ordering came from the F1-style engine design. Final `schema-evolution.md:16–20` first requires the selected engine’s build/validation/publication protocol and limits that ordering to the historical F1-style transition. The [PostgreSQL 18 concurrent-index contract](https://www.postgresql.org/docs/18/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY) was selectively crosschecked; no database behavior was tested.

## Integration assessment

- **Routing and standalone references:** Conditional branches point to package-local references; definitions, applicability and verification stay available without another skill package. General discovery descriptions remain bounded. Evidence: `skills/engineering/concurrency-correctness/SKILL.md:31-37`; `skills/infrastructure/infrastructure-change-safety/SKILL.md:11`; `skills/performance/overload-control/SKILL.md:34-39`; `skills/engineering/microservice-operations/references/failure-handling.md:7-8`.

- **Entity incarnation, snapshots and merge claims:** Non-reused incarnation or equivalent durable identity covers delete/recreate ABA; payload and revision share an observation. Arbitrary identity tokens are not ordered epochs. Complete projection oracles differ from sparse-cache permissions. Global snapshots and per-chunk windows remain distinct; merge convergence does not imply invariant preservation. Evidence: `skills/engineering/concurrency-correctness/references/cache-coherence.md:32-45`; `skills/engineering/concurrency-correctness/references/cache-coherence.md:63-70`; `skills/engineering/concurrency-correctness/references/merge-invariants.md:18-42`; `skills/engineering/concurrency-correctness/references/projection-rebuild.md:6-27`.

- **Schema writer floor and rollback oracle:** Every relevant writer must advance the authoritative revision with the mutation or use another enforceable protocol. New-only readers wait for writer eligibility enforcement and reconciliation; rollback retains bridge writers or restores fallback. Expected/actual identity-value sets are compared independently in both directions after reconciling unknown outcomes. Evidence: `skills/infrastructure/infrastructure-change-safety/references/schema-evolution.md:16-20`; `skills/infrastructure/infrastructure-change-safety/references/schema-evolution.md:24-42`; `skills/infrastructure/infrastructure-change-safety/references/schema-evolution.md:46-71`.

- **Fair delivery, residency and reclaim:** Tenant cost includes prefetched/resident work through release. Broker delivery priority is distinct from execution capacity, quotas, completion and data authorization. Borrowed nonpreemptible capacity has no immediate reclaim promise; borrower progress and actual cleanup require evidence. Residency denotes owned resources, not a geographic data-residency guarantee. Evidence: `skills/performance/overload-control/references/queues-and-fairness.md:20-55`; `skills/performance/overload-control/references/queues-and-fairness.md:63-72`.

- **Clock domains, cancellation and drain inventory:** Clock origin, serialization, suspend/restart and wire conversion are explicit without renewing an operation budget. Go cancellation and Python timeout APIs are not cleanup joins. Admission closes before final inventory; mixed-version checks include semantics; repeat signals cannot restart the drain allowance. Runtime and proposed evidence remain separate. Evidence: `skills/engineering/microservice-operations/references/deadline-domains.md:9-31`; `skills/engineering/microservice-operations/references/deadline-domains.md:35-56`; `skills/engineering/graceful-draining/references/durable-handoff.md:21-25`; `skills/engineering/graceful-draining/references/durable-handoff.md:53-59`; `skills/engineering/graceful-draining/references/durable-handoff.md:120-134`; `workflows/tal-worker-rollout/WORKFLOW.md:61-64`; `workflows/tal-worker-rollout/WORKFLOW.md:82-87`.

## Checks and evidence limits

Final SHA-256 verification matched all 23 reviewed instruction/context files. All 42 package-local Markdown links and anchors resolved. Scoped `git diff --check` passed. These structural checks are not runtime or model results.

- Static instruction and scoped source review only; no native evaluation response was inspected, scored or authored.
- No runtime, broker, database migration, rollout, wire deadline, real signal, OS clock, suspend, or failure-injection experiment was executed by this reviewer.
- The source ledgers and supplied adoption research support most provider-specific claims; this pass did not independently reread every primary source or reproduce historical proofs/results. PostgreSQL 18 concurrent-index documentation was selectively crosschecked.
- Correct instructions and resolving local links do not establish model activation, adherence, general correctness, native-host isolation, or production readiness.
- The reviewed hashes bind exact candidate bytes rather than implying all uncommitted content belongs to the Git baseline; edits after this record require a new scoped check.
- Runner review was limited to the optional-suite changes and relevant surrounding paths. Existing/new test results reported by the author were not rerun or counted as this reviewer execution evidence.

## Optional runner supplement

The explicit suite registry, concern-specific fixture prefix, suite-bound freeze digest, and run/control loading preserve the intended selection boundary. The default suite omits the new identity field, preserving its previous serialized shape. No material regression was found in the inspected diff.

One nonblocking hardening opportunity remains: `runTrial` does not call `loadControlledCase` before native dispatch; later scoring/verification catches a mismatched control suite. Earlier validation would avoid spending a run. No false scored pass was demonstrated, and no runner tests or native models were executed by this reviewer. This observation is separate from instruction acceptance.

## Reviewed file hashes

The machine-readable [review record](instruction-review.json) also binds the adoption research and limited runner-review inputs. Paths below are repository-relative.

| File | Role | SHA-256 |
| --- | --- | --- |
| `skills/engineering/concurrency-correctness/SKILL.md` | candidate | `abd11a72587f4df7988df89ebd2e50423c54e9fc1caf30d9bfc0609ceded60d7` |
| `skills/engineering/concurrency-correctness/references/cache-coherence.md` | candidate | `c8d6bd6d8b6d34d205c32899d95e4bac8fd4cc68dbbec500b56f19b25b4c4c8a` |
| `skills/engineering/concurrency-correctness/references/delayed-work.md` | context | `6cc6b6e5d34b8b639b3587b3f341bbdbe9ab4d0dc42d2c17b60e122fc51f239b` |
| `skills/engineering/concurrency-correctness/references/merge-invariants.md` | candidate | `fd1d2cb934144c63905a6daa7bf2f8eb4a1377bc4299d52ee4ed8b07b1df5429` |
| `skills/engineering/concurrency-correctness/references/projection-rebuild.md` | context | `9635ce4dc2682bd07922b271f62484052a7086b0cbf0af2f6cdd1a799fc0f998` |
| `skills/engineering/concurrency-correctness/references/sources.md` | candidate | `55ad3acb735ff2816c58e8989f8b08500bc3e2b3a61e01a41d7140b8a9160463` |
| `skills/engineering/concurrency-correctness/references/transactions.md` | candidate | `9052a10098f41e63cf3546d5819a644eda4e15f38fcfb50a48156bc3bd88635d` |
| `skills/engineering/graceful-draining/SKILL.md` | candidate | `8c800a02eda0b78d85572e6c852b4fc53a3d90865130c72868105a15386632f6` |
| `skills/engineering/graceful-draining/references/durable-handoff.md` | candidate | `7ae83d644904e6eff97d2e00cfb548a8c05043d19616630ce540dc84fe596532` |
| `skills/engineering/graceful-draining/references/sources.md` | candidate | `eed1daad43666ef2481dc3f468848a58a7d57658c386602e58e843c1d4f24fb6` |
| `skills/engineering/microservice-operations/SKILL.md` | context | `a8f2988fa64b4d5c39ddec1d4197edd6b40466be289eff2fa4ef6d650d39d144` |
| `skills/engineering/microservice-operations/references/deadline-domains.md` | candidate | `a439f3b1d9f3a4eae337619e99b91599260fa14b63f03a5d2b5954da1bffc280` |
| `skills/engineering/microservice-operations/references/failure-handling.md` | candidate | `63a59545e9fc825fa80ca768b1fb0a3631fcdaaa1b97fb2c5479b2d3cd1c8350` |
| `skills/engineering/microservice-operations/references/retry-coordination.md` | context | `a1c969db3d171b4af3dfcc05a2ee432991be57712e64687daebf2465e8e83e60` |
| `skills/engineering/microservice-operations/references/sources.md` | candidate | `24d306bf692dfd7ee48485ba79751dcaee4aeacbf0982ffa5709c95b18aec2c7` |
| `skills/infrastructure/infrastructure-change-safety/SKILL.md` | candidate | `bba67983c369c19c79fcd659a0f293b2e2e0f2fd4c5c9af06fc2c81643816d4b` |
| `skills/infrastructure/infrastructure-change-safety/references/schema-evolution.md` | candidate | `d591f38322588026a4901e77cda1f3c0ef86ec51cbf9dd45f3e5eb8f3598e1a1` |
| `skills/infrastructure/infrastructure-change-safety/references/sources.md` | candidate | `f7a739cb107bd3c9a2a4c6b3ca56d2ec36530c278ea20c41ad70edf829ddb954` |
| `skills/performance/overload-control/SKILL.md` | context | `0a2b75327c0abdea6877c4a73ba71c842d6438567ccd6bba2fd13e3701a2f088` |
| `skills/performance/overload-control/references/admission.md` | context | `64a4f98cd66468466a28647318a9b836ad723e3406d6499d600cf400883227ac` |
| `skills/performance/overload-control/references/queues-and-fairness.md` | candidate | `f828d9515c55b68a8c2186775fa86e29404bb6d8e0be245c16dc9d5ef2071578` |
| `skills/performance/overload-control/references/sources.md` | candidate | `0086db3fcac055a4aea04b5d747b6756b5d1e492a1eafd55eccba9e66f02d838` |
| `workflows/tal-worker-rollout/WORKFLOW.md` | candidate | `120916965de7e6e16b4c6df80bb3151cf1ac441ca507df6b838cb6ae1130a267` |
