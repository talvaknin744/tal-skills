# Independent score: resident-reserve

Reviewer: Luna, independent grader; I did not author the candidate skill or the saved response. Candidate identity: `overload-control`, tree SHA-256 `aee0b738d31945d1d61a77a3279515aa2b6a1bfc215f2adfca5a55a14c977407`. Frozen case: `resident-reserve`, fixture tree SHA-256 `3f76fa405122ce71db3b3b11ccc1473745a3cdd64d150da66de51e1be9331213`; rubric SHA-256 `b35a901d00c74282619a4d0e4214bc14e2021585fd4624fd076481accfcca700`. Response: `../tal-worker-rollout-oct02-resident-response-scaffold-19/evidence/answer.md`, SHA-256 `4a1291cb48b3195be64eda6471625f1b278f28da7e6935b9f0209f3c57872e57`.

Run metadata identifies gpt-6-sol at xhigh effort, native repository skill discovery, and codex-cli 0.159.2 on the recorded host. The command completed with exit code 0 and no timeout. However, read isolation and sandbox verification were false, and inherited guidance/tools were available. These host limits mean this score assesses the saved observable answer; it does not establish isolated activation or production behavior.

| Criterion (severity) | Score | Evidence and assessment |
| --- | ---: | --- |
| resident-accounting (critical) | 2 | Answer lines 3, 9, 23, 35: received jobs occupy slots despite idle CPU; capacity is charged through actual release; prefetch/local deferral, blocked/retry-waiting work, and cleanup ownership are addressed. |
| current-completion (critical) | 2 | Lines 3, 13-15: supplied B/C schedule starts at 8 and finishes at 9 after deadline 3; A3/A4 run 8-16; next-delivery preference is not treated as protection. |
| reserve-policy (critical) | 2 | Lines 15-19, 23, 62: alongside a clearly labeled one-slot minimum variant, the answer provides the exact two-A-resident alternative with two unborrowed slots for B/C, defers A3/A4 outside receipt until their 8-16 execution, and preserves their accepted-job disposition at the broker. |
| borrow-reclaim (critical) | 2 | Lines 17, 19, 35, 65: signal at 1 does not reclaim the borrowed slots before 8; actual release/cleanup/effect settlement is required, or capacity stays unborrowed. |
| progress-and-cost (major) | 2 | Lines 39, 43-53: useful completion, interruption/repeat cost and utilization are distinguished on the common [0,16) horizon, including prefetched residency versus execution. |
| verification-oracle (major) | 2 | Lines 43, 55-69: deterministic ownership/capacity and settled-deadline oracles cover immediate protected arrival, prefetch, blocked/retry waits, signal versus stop, recovery and eventual A progress. Tests are labeled proposed/unexecuted. |
| scope-and-evidence (critical) | 2 | Run metadata records unchanged baseline and no forbidden changes; answer lines 57, 71 distinguish supplied arithmetic from proposed validation and state no worker/broker experiment ran. |

Critical criteria: 5/5 pass (10/10 points). Major criteria: 2/2 pass (4/4 points). Total: 7/7 criteria pass (14/14 points). These are independent rubric scores for the saved answer, not an executed worker evaluation. No numerical target was supplied.

Validation: `node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` returned `rubric_result: pass`; verifier reported all five critical criteria at 2 and `independent_verification.required: false`.
