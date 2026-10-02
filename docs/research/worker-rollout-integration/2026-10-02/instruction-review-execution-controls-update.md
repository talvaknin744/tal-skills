# Execution-controls review and archive-hardening record

The independent execution-controls review has **no unresolved findings**. One P2 binding gap was reproduced and closed before the next native run. This supplement preserves all six earlier review artifacts. It separately identifies the archive-checker changes authored by this reviewer.

Reviewed 2026-10-02T09:30:42.027932+00:00. [Machine-readable record](instruction-review-execution-controls-update.json) includes prior hashes, current files, freeze identity and check results.

## Independent execution-controls review

The adapter in `scripts/evals/lib.mjs:51–60` is restricted to the legacy cache-fill-invalidation regression. Its frozen controls authorize editing only `service.mjs` and require `node verify.mjs`, while keeping the original case, prompt, rubric and fixtures unchanged. Older freezes receive no retrospective controls.

**EXEC-01, P2, closed:** before the fix, modifying only `evidence/run.json` could add `project/verify.mjs` to editable files and set the verifier to null. Loading and dry dispatch accepted those changes despite unchanged frozen controls. The corrected binding at `scripts/evals/lib.mjs:428–434` compares editable files, verifier argv and derivation to the frozen controls. The test at `tests/worker-rollout-integration/runner.test.mjs:73–80` changes each field independently and rejects it through loading and dry dispatch. A separate reviewer also reproduced rejection through verification, checked valid metadata, and confirmed older-freeze compatibility.

Regression freeze03 `8cc8647832b190ceb36ef38da5b0404400c2955b1ae468707397c8267fd8e438` validates. Its candidate and corpus identities match regression02 exactly. The unchanged legacy case hash is `1107c6993d88934af1f3f7a55fc84ab98be5858c0c57a79d4300252122f4d2da`. Neither reviewer ran models or inspected/scored native responses.

## Archive checker implementation

This reviewer authored `scripts/check-evaluation-evidence.mjs` and its tests. A separate agent reviewed the code and identified a project-dotfile compatibility issue, corrected by recognizing only `.agents/`, `.codex/` and `.tal-skills/` as installed native dependencies and retaining full-baseline lookup for undeclared legacy originals.

The base manifest's optional `complete_source_trees` array now requires exact source sets in both the validated manifest/supplement union and the published directories. Source files bind their original hashes to the recorded candidate, fixture, baseline or final inventory. Single-skill tree digests and workspace mappings are cross-checked. Invalid paths, duplicate records, missing or extra source files, substituted bytes and inconsistent aggregate identities are rejected. Older undeclared partial archives remain supported, and an honestly recorded unsuccessful mutation can still be archived without being graded as successful.

## Executed checks

```sh
node --test tests/worker-rollout-integration/runner.test.mjs tests/engineering-toolkit/runner.test.mjs tests/evaluation-evidence.test.mjs
node scripts/check-evaluation-evidence.mjs
```

The combined local tests passed **51/51**, with zero failures or skips. The archive check accepted **78 manifests, 1,637 published artifacts and 2,519 source bindings**. It did not rerun or grade experiments. Scoped whitespace checks passed; legacy raw case/fixture diffs from HEAD are empty.

| File | SHA-256 |
| --- | --- |
| `scripts/evals/lib.mjs` | `dab7d89dc3b782e7b5313c58e0c7a09afb173b1b0bb13ab6b33691238848c63e` |
| `tests/worker-rollout-integration/runner.test.mjs` | `6dc1238f98e136126eae1567566991f629fe625492f3c5264d8ce2166b39411f` |
| `scripts/check-evaluation-evidence.mjs` | `2d419d4ddffb1ee652b4a117fd0daa9337e1d5e8260b84022fe51ee67d45add7` |
| `tests/evaluation-evidence.test.mjs` | `626573388de4db40c3aa1e57136668180772ee3b1cf8715ca1eb5a9f1e79000a` |

These checks establish runner and archive consistency. They do not establish native skill adherence, a correct cache implementation or production behavior. The archive exporter must declare completeness; older undeclared archives intentionally permit partial publication.
