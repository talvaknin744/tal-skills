# Schema review input audit — 2026-10-02

**The original case is underdetermined for the numeric status-value portion of its critical independent oracle.** The supplied independent evidence does not define pending → 0 or paid → 1. This is an evaluation-input defect, separate from skill correctness.

## Scope

Reviewed only the five declared raw files for shard-publication-rollback-floor, the case metadata/private rubric, schema/calibration.json and schema/README.md. No model responses or scores were read, no models or subagents ran, and no source fixture, rubric, case, calibration, candidate or result was changed by this audit. The accompanying JSON binds all eight originally inspected source files.

## Finding and evidence

rollout.md:19 explicitly assigns only refund_pending (code 2). versions.csv:2–4 lists supported status names and writer/revision contracts; delimiter order is not a numeric encoding contract. rollout.md:25–28 distinguishes the definitive business-commit ledger from the transformed-table observation at cut 207. The original rubric at cases.json:40 requires an independent supported-status mapping and a complete bidirectional expected/actual comparison.

Applying committed events through cut 207 yields these independent source expectations:

| Key | Incarnation | Source revision | Status text |
| --- | --- | --- | --- |
| 11 | order-a | 1 | pending |
| 22 | order-b | 2 | paid |
| 43 | order-c | 1 | paid |

Commit 206 is rejected; commit 207 deletes 99/order-d. Therefore missing 43/order-c and extra 99/order-d are independently provable despite equal counts. A read-only local ledger reconstruction confirmed these sets.

Both {pending: 0, paid: 1, refund_pending: 2} and {pending: 1, paid: 0, refund_pending: 2} satisfy the independent encoding statements. They disagree about whether present rows 11 and 22 have correct numeric values. Inferring the first map from derived.csv:2–4 uses the output under test to construct its expected values, making that part circular. Identity and revision evidence remains usable; complete numeric-value correctness must remain unresolved without an authoritative contract.

## Calibration

calibration.json:7–44 covers only backfill-recreated-identity and migration-comment-only. It contains no review-case result, oracle, or intended enum mapping. The inspected calibration therefore does not establish that the intended map exists only in hidden evaluator material; it does not establish that map at all for this case. README.md:13–15 states that rubric and calibration records are excluded from the raw workspace.

## Minimum versioned correction

1. Preserve the original case, rubric, five raw fixtures, calibration, freezes, attempts, results and scores. Add a versioned replacement such as shard-publication-rollback-floor-v2.
2. In the versioned raw rollout document, add one normative statement separate from its flawed proposed sequence: “The authoritative status encoding is pending ↔ 0, paid ↔ 1, refund_pending ↔ 2, stable across writer/reader generations that support that status.” Keep criterion wording and severity unchanged.
3. Calibrate the new review oracle from the ledger plus the visible contract. Use a scratch negative control that changes the code of a matching live identity (for example order 22 to code 0), exercising value checks independently of missing/extra identities. This audit did not execute that proposed calibration.
4. Freeze and evaluate the new version separately. Record this input limitation alongside original historical evidence. Do not teach the skill to assume enum encodings, weaken the criterion, or infer candidate regression from the missing input.

## Concurrent versioning and preservation

During this audit another author appended a v2 case. The write guard detected the change before creating any audit artifact. The originally reviewed complete cases.json is preserved byte-for-byte at evals/worker-rollout-integration/schema/history/cases-v1-before-status-contract-v2.json, SHA-256 c99f23d9abe072ce5f06d3ece979845134ff1b71cc20e9cddeed9add04a2641b. The current original case object equals the snapshot object under JSON.stringify; its object digest is d55a890e61ac918ab70724dd665fb3d437b0bd63a6eb313dbae54b83e605abdd. The current full cases.json digest at final binding is 5f2776b2ff8d24c91deade82ce0e2ca73fc1634cbc6a2d63b3c91181774a39c4. The original five raw files and original calibration retain their captured hashes. No v2 content or outcomes were reviewed here.

## Limits

This audit does not regrade any response or invalidate independently supported shard, writer, rollback or coverage findings. A response can correctly report source identities/status text/revisions and explicitly leave numeric representation correctness unresolved. No database, runtime, model, production migration or execution-isolation claim was tested.

## Originally inspected source hashes

| Source | SHA-256 |
| --- | --- |
| evals/worker-rollout-integration/schema/cases.json | c99f23d9abe072ce5f06d3ece979845134ff1b71cc20e9cddeed9add04a2641b |
| evals/worker-rollout-integration/schema/calibration.json | e8cd1d28a32d82dbc6c1a511921df504500fe2e886d584cebbe0a99d7b446709 |
| evals/worker-rollout-integration/schema/README.md | 658f8ddf72f373e8df482341d5660e1bb606da0307aede801a6a058fea396ea6 |
| evals/worker-rollout-integration/schema/fixtures/shard-publication-rollback-floor/rollout.md | e78d79f5014e38c5ec3344918354ea425ca841ad66d19fb8d521e91162da36e1 |
| evals/worker-rollout-integration/schema/fixtures/shard-publication-rollback-floor/fleet.csv | 1bef598948d3f744c368d1737079355d8fe87b3b886d5cd2a0552a033e8d65f8 |
| evals/worker-rollout-integration/schema/fixtures/shard-publication-rollback-floor/versions.csv | e9bc1dd9a2349d9abcb122c045c7394b04aa692d3191c09dc0344bbbfeed0aa0 |
| evals/worker-rollout-integration/schema/fixtures/shard-publication-rollback-floor/commits.csv | 8f1299c040431bb105af053aebbcd407815c93822aa476428d0a9df12de8e713 |
| evals/worker-rollout-integration/schema/fixtures/shard-publication-rollback-floor/derived.csv | 54edbc74ac4a0e7dc472c684da1d9a099f030fcd25690972b4e47578ac8a2645 |
