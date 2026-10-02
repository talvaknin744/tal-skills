# Independent corrected V2 shard-publication score — 2026-10-02

Result: **pass** against the unchanged five criteria for versioned case `shard-publication-rollback-floor-v2`. All five criteria score 2/2, including all four critical gates. This grades the sealed V2 evidence; it does not regrade or erase any V1 partial result.

Reviewer: `/root/archive_agents`. I authored neither the full infrastructure-change-safety candidate, this response nor the raw case. Earlier infrastructure work was read-only review; unrelated ownership/A2A package edits are outside this candidate. I inspected this package's immutable rubric, answer, trace, original/final data and separate authoritative encoding contract, without comparing old scores or presuming improvement. No candidate model rerun, migration, external operation, candidate/case edit or commit was performed. Only `score.json` and this `review.md` were written.

| Criterion | Score | Observable evidence |
| --- | --- | --- |
| all-shard-publication — critical | 2 | `answer.md:3/20/47` rejects -40/accepted-command publication while 40-80 lacks column/index. Requires observed completion for the same UUID on every shard, usable index, shared-cache compatibility, restart/handwritten SQL checks, and stops on mismatch. |
| maintained-writer-floor — critical | 2 | Lines 16/22/24/26/47 use supplied revision-maintenance contracts while retaining inventory of other writers. Keep bridge/fallback and membership-safe paid listing while V0 can write; require commit-boundary eligibility or proven drain of transactions/jobs/replay before code-only readers. Deployment percentage/heartbeat is explicitly insufficient. |
| rollback-bridge-and-representability — critical | 2 | Lines 22/28/37/41–43/47 retain V1 dual writes/fallback and compatible values, remove V2 code-only reads before V0 admission and require current V0-compatible text. Code2 is separately gated; V0/V1 cannot represent it. Lagged reverse capture and old-table retention are insufficient; recovery requires verified revert/forward repair or scoped restore/replay, with post-write ordering/catch-up rehearsal. |
| independent-bidirectional-oracle — critical | 2 | Trace item_6 reads the independent encoding contract; completed item_14 derives expected full tuples from the committed ledger and that contract, compares both directions and shared values, and reports missing 43/extra 99 with no shared-tuple mismatch. Answer lines 5–14 records the expected rows and paid listing mismatch; schema/index, copy/catch-up and exposure remain separate gates. |
| bounded-review — major | 2 | Local reads and one CSV calculation only; all 13 before/after records match and diff is empty. Lines 20–37/45–47 provide partial-shard/cache, late-writer/replay, update/delete-recreate, rejected mutation, uncertain switch and rollback-write checks. Proposed numerical bounds are explicitly subject to control/engine verification; no live database/index/production execution is claimed. |

I independently computed the oracle using a different method from the captured candidate script: select the last definitive committed event for each key at or before cut 207, discard deletes, and encode statuses through `status-code-contract.json`. Each tuple below is `(key, incarnation, source_rev, status_code, mapped_rev)`:

| Key | Expected full tuple | Actual full tuple |
| --- | --- | --- |
| 11 | `(11, order-a, 1, 0, 1)` | Matches |
| 22 | `(22, order-b, 2, 1, 2)` | Matches |
| 43 | `(43, order-c, 1, 1, 1)` | Missing |
| 99 | Absent | `(99, order-d, 1, 1, 1)` extra |

Rejected commit 206 does not change key 11. Committed delete 207 removes key 99. Both complete sets have three rows; their differences are exactly missing 43 and extra 99. Shared full tuples have no value/revision mismatch. Expected paid keys are `{22,43}`, while the transformed code 1 filter gives `{22,99}`. This reproduces the captured item_14 output and final answer from independent ledger-plus-authority input. It does not execute a live paid-index query, which the answer correctly leaves unobserved.

The encoding authority is separate from the transformed observation, with pending 0, paid 1 and refund_pending 2 declared explicitly. Its SHA-256 is `07ef400740ea1b79da10c095f22093a2a2787c6e641bfff149c92a5a0e1cd28e`. All five original fixture files are byte-identical to the original frozen V1 inputs; the V2 input contract and case identity are separate. Original V1 results remain intact.

No executable verifier is supplied (`verification_argv: null`). My independent calculation is static fixture validation, not a database rehearsal. I compared all six original/final fixture bytes and frozen hashes, all seven candidate plus six fixture before/after hash/mode records, and all ten copied sealed evidence-file hashes. The saved diff is empty and no forbidden change is recorded.

Score bindings remain candidate tree `c67c326ddb1c2829a2d09225eb20333b88d577d600acd04470c4e35d3fc4178f`, unchanged criterion rubric `f91f59c3980cefea8567a4e3f6fac53204a3331e79aaf598681b198c6ba6c309`, final workspace `b0b4a6f0ee104c9de0dca457fb9a724b12151293576be678ed39582deda996f8`, and run evidence `4058fcd6982e1867ef8a55ddfe33dadf9f24ecca11ebdb043059276017d68f0d`.

`node scripts/evals/cli.mjs check-score --trial /TRIAL --rubric /SCORING/rubric.json --score /SCORING/score.json` exited 0, returning `rubric_result: pass`, all critical scores 2 and `independent_verification.required: false`.

Native metadata/body read and relevant schema/rollout/configuration source reads are observed. Inherited catalog/tools and unenforced read/tool isolation remain confounders; `case_compliant: false` and capability deviations are preserved. No causal uplift or production/durability guarantee follows from this single review response. Live base/index observations, all-shard completion, commit eligibility, lock/timeout feasibility and recovery remain explicit unexecuted release gates.
