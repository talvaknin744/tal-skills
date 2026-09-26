# Architecture review

## Establish the evidence boundary

1. Resolve the system or proposed design, the architecture question, and the
   revision or artifact version under review. Treat changes or pull requests as
   evidence about that question, rather than expanding into ordinary PR review
   or debugging. Identify relevant constraints and material unknowns.
2. Trace the important runtime or data paths and the boundaries implicated by
   the question. Inspect their implementation, design documents, configuration,
   and relevant tests. Expand into another component or stack surface only when
   a dependency or observed risk makes it relevant.

Scoping is complete when the reviewed boundary, evidence version, key paths,
and limitations are explicit. If only a proposal is available, assess the
proposal and identify what remains unverified about an implementation.

## Assess and verify

3. Identify concrete strengths and risks. Explain each architectural choice in
   terms of its consequences under the stated constraints. Separate a failure
   or costly limitation from a style preference or an intentional tradeoff.
4. Ground each candidate finding in an exact artifact location and relevant
   revision, or in identifiable runtime evidence. For source files, cite the
   path and lines. For execution evidence, identify the command or observation,
   conditions, and relevant output. Trace enough surrounding behavior to check
   whether an existing control already addresses the concern.
5. Read relevant tests and local validation instructions. Run a bounded check
   when it materially resolves uncertainty, the environment supports it, and
   its effects are within the user's authorization. Record the actual command
   and result. When execution is unavailable or inappropriate, report the limit
   and the smallest useful validation step; reading a test is not a passing run.
   For comparisons, establish the relevant baseline before claiming regression.
6. Verify changeable external claims against primary sources applicable to the
   system's host and version. For conformance checks, identify the governing
   standard and version, distinguish mandatory rules from advisory guidance,
   and explain the consequence of any deviation.

A finding is verified when the evidence supports its trigger, consequence,
and proposed correction. Keep plausible but unverified concerns clearly
conditional; do not present them as established defects.

## Prioritize the result

7. Merge overlapping findings. For each retained risk, give its location,
   triggering condition, practical impact, severity rationale, and smallest
   useful correction or proof step. Rank by impact and likelihood under the
   stated constraints. Reserve urgent severity for supported urgent risk.
8. Preserve strengths that contribute to the user's goals. Describe meaningful
   tradeoffs and unresolved facts, and identify which would change the verdict.
   Recommend evolution in dependency order without expanding the review into
   implementation work.

Review is complete when every requested architecture question is answered,
reported risks and strengths have evidence, duplicates are merged, and the
remaining uncertainty is visible. Finish after this scoped verification pass;
reopen inspection only to resolve a material contradiction or new evidence.
