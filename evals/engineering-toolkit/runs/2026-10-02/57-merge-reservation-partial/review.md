# Independent review: merge-reservation-boundary

The saved response is **partial, 9/10**. All four critical criteria pass at 2/2; the major discriminating-oracle criterion is 1/2. This is an observable response assessment, not release acceptance or real database/CRDT validation.

Reviewer: `/root/archive_agents`. I authored none of the full concurrency-correctness candidate or its references, this case, or this response. A bounded read-only crosscheck by `/root/archive_agents/deepchecks` independently corroborated arithmetic and the missing successful control; I assigned the scores. No prior grades were consulted.

| Criterion | Severity | Score | Evidence |
| --- | --- | --- | --- |
| common-ancestor-counterexample | critical | 2/2 | `evidence/answer.md` lines 1–3 |
| acceptance-enforcement | critical | 2/2 | `evidence/answer.md` line 5 |
| freshness-separation | critical | 2/2 | `evidence/answer.md` lines 3, 9 |
| discriminating-oracle | major | 1/2 | `evidence/answer.md` line 9 |
| scope-and-evidence | critical | 2/2 | `evidence/answer.md` lines 3, 7, 9; trace.jsonl line 28 item_13; workspace-changes.json |

The answer correctly derives two locally valid accepted states from the common one-unit ancestor. Union retains both distinct final receipts and yields accepted quantity two, remaining −1; duplicate delivery cannot eliminate this violation. Line 5 places durable conditional enforcement before acceptance, gives an appropriate nonfinal authority-failure result, or allocates the one enforceable right to only one region. It does not invent cancellation or discard a legitimate receipt. Lines 3 and 9 keep advisory display freshness independent from final acceptance.

The actionable remaining rubric gate is a **single-reservation successful control** from the stock-one ancestor: one legitimate request must obtain one final durable receipt, accepted quantity one, remaining zero; replay of the same operation must consume no further quantity. The “at most one” assertion in line 9 also accepts a reject-all implementation. Existing proposed distinct-request overlap, partition/authority-loss/crash-retry and recovery reconciliation cover much of the required oracle, but do not supply this success control. The unchanged original rubric explicitly requires it; no credit is inferred from the proposal alone.

I independently recomputed from the authored JSON without executing candidate code: ancestor remaining one, each accepted local branch remaining zero, union of distinct A/B accepted quantity two and remaining −1, single A including repeat delivery remaining zero. The authored 12-second display satisfies the 60-second age allowance. These are finite arithmetic observations, not measured freshness or a general merge-law/database proof.

`verification_argv` is null, so no executable verifier is defined and none was invented. The model's recorded `python3 -B observe.py` at `trace.jsonl` line 28 (`item_13`) completed with identical A/B sets and remaining −1. Its zero exit establishes observation completion only. Scoring used the final response, declared inputs, visible command events and mutation evidence, not hidden reasoning.

The source run completed and records `baseline_unchanged=true`, `allowed_changes_only=true`, no changes or forbidden changes, and an empty patch. It remains **`case_compliant=false`**: the read-only sandbox was unverified, filesystem reads were not confined, inherited guidance remained available, and network restrictions were instructed rather than comprehensively enforced. Native candidate body reading is observed; exclusive candidate attribution and jailed-host compliance are not established. No external mutation/model request is visible in the captured command trace; that is an observable limit, not proof of universal exclusion.

Bindings: Con tree `477470e2c65567e814850c84f7d0dd913b4627e91380d7f3cc3882331c5b1644`; exact rubric-content SHA-256 `e862695e611fbdcdb5a22bed10744851ffd1f767e67ae556a6de10d931452f1d`; run evidence `350e3ca74e8a1ba9880b0e492002050c0e1bfb8001ce31063ad3ffaf295b20b5`; final workspace `f5f13d2ce1c0d3fc88b3af6f8f7420f11b27af40c12f5e7634e82d3a584f97b0`. The source evidence seal passed. Staged original/final projects and evidence match the source inventories byte/hash/mode; before/final project inventories are equal, and original fixture hashes match the manifest. Only assigned score/review outputs and the explicitly authorized preserved grader-instruction copy were written.

`check-score` is run against `/TRIAL` with the exact staged rubric. It completed successfully with rubric_result=partial and all four critical scores two; no independent executable verifier is required. The source run was not changed.

| Reviewed artifact | SHA-256 |
| --- | --- |
| `rubric.json` | `7467277bb69bfcfbdeed77366f1c20adf24548da78000788304f0e5b15da669b` |
| `score-template.json` | `1da0fcc3acfe231e68b3f783dbd15e09be3f3450416405f56369ac548da7ad9e` |
| `evidence/run.json` | `8d4137eaf7eec5ba3edac9a2081beace03902dd03198a47a5b491a7d8601872d` |
| `evidence/manifest.json` | `d8a4d62a8f7aacf1cb91617a768176a9906b9ec027c6d5bf6dd24f6ca5acc532` |
| `evidence/answer.md` | `d9dd7ca8c90b26ceb5c7aac5bc6ced166d57de3df2f19d70398576ea61647780` |
| `evidence/trace.jsonl` | `69b1290dcafc4e082fc8c9d03854d35c2cfecae642c160ef9f74de849590bc25` |
| `evidence/workspace-changes.json` | `882c18a9ee81266eb140aed217c25fc866e0a3d5fd06b8ca2de3f601e83d8f4b` |
| `evidence/workspace.patch` | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |

The generic staged `REVIEW.md` instruction file shares the assigned `review.md` path on this case-insensitive host. Its original bytes are preserved in grader-instructions.original.txt (SHA-256 de7b25c04a2639056d47929850da9cde5bb29ac4043a71317ce1cd58c3665bed) under the parent-authorized exception and quoted below; all other staged inputs remain unchanged.

> Independently score the saved observable result, not hidden reasoning. Read rubric.json, the raw project, answer, diff, command evidence and input hashes. Assign each criterion 0 fail, 1 partial, or 2 pass with an artifact path/line or event and observation. Report critical results separately. Do not convert a blocked/invalid/timed-out host attempt into a skill pass. Re-run the supplied verifier locally when applicable without modifying candidate artifacts. Distinguish native discovery from unobserved selection, process completion from correctness, and simulated adapters from real infrastructure. Record your reviewer identifier and any relationship to the skill/response author.
