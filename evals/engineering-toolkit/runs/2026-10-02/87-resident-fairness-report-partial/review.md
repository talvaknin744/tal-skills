# Independent review: resident-reserve

Candidate identity: `442a9c09ac10ee16a248b123ce705e316d863ce75a847afa680c85bac5d99340` (the selected seven-file overload-control package in `evidence/manifest.json`). Rubric identity: `b35a901d00c74282619a4d0e4214bc14e2021585fd4624fd076481accfcca700`. Run: `tal-worker-rollout-oct02-overload-report-integration-13`.

I am Luna, an independent evaluator. I authored none of the candidate package, case corpus, or response and did not inspect prior scores or archived reviews. `grader-instructions.original.txt` preserves the original `REVIEW.md` bytes (SHA-256 `de7b25c04a2639056d47929850da9cde5bb29ac4043a71317ce1cd58c3665bed`; both mode `0644`).

Scores: `resident-accounting` 2; `current-completion` 2; `reserve-policy` 2; `borrow-reclaim` 2; `progress-and-cost` 1; `verification-oracle` 1; `scope-and-evidence` 2. All critical criteria score 2. The result is **partial** because the major criteria remain partial: the answer does not explicitly account for lost/repeated useful work under hypothetical interruption, and its verification plan omits explicit prefetch/blocked/retry-wait transitions and accepted-job recovery after worker failure.

The answer accurately shows that all four slots are occupied at time zero, computes the deadline misses under current and draft policies, gives a feasible one-slot-reserve schedule for the specified durations, rejects fictitious cancellation release, and compares utilization over a common horizon. It labels verification as proposed and leaves the fixture unchanged. No verifier was supplied for this read-only review case; no verifier was invented or run.

Host case compliance is **false**: inherited user/system/plugin guidance and network-capable tools remain available, and filesystem reads are not confined to the trial directory. Requested read-only sandbox mode was not independently verified. Candidate body read was observed. These host limitations do not establish isolated-host behavior or real worker/broker performance.
