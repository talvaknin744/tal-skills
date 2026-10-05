# Case-specific review

The scores below are preserved independent native scores. Later attribution reviewers selected exact recorded excerpts and separately reported score-support disputes. Earlier failed and partial grader attempts remain archived.

## a2a-engineering--task-observer-disconnect

- revised: executed; body reads a2a-engineering.
  - major durability-limits 1/2: Distinguishes stored task state from resumable execution and describes recovery limits, but does not test the requested cases.

- revised-r2: executed; body reads a2a-engineering.
  - major durability-limits 1/2: Distinguishes persistence from execution recovery and describes reconciliation, but does not test the requested cases.

## architecture--multilingual-worker

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - major evidence 1/2: Identifies the fixed path and upload/record sequence, but treats overlapping runs as a concern despite the stated single-instance assumption and suggests a partial export may be uploaded without accounting for `set -e`, which stops the wrapper after export failure.

## background-maintenance--sparse-tail-metadata-pressure

- revised: executed; body reads background-maintenance.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads background-maintenance.
  - major observable-validation 1/2: Provides several relevant proposed checks and outcomes, including mixed foreground load and delayed/missing signals elsewhere in the plan. It omits an explicit semantic content/deletion oracle and does not specify small-object and distribution-shift inputs in the validation steps; success/failure conditions for all required measures are incomplete.

## code-and-docs-cleanup--similar-policy-cleanup

- revised: executed; body reads code-and-docs-cleanup.
  - major evidenced-removal 1/2: The diff shows the wrapper removal and the repository search output shows no code caller, but the permitted citations do not establish the supplied private, unused caller evidence.
  - critical reader-contract 1/2: The instructions retain the local prerequisite and rationale and state how to run the demo, but do not say what successful output looks like. The verifier checks execution, not the resulting documentation.

- revised-r2: executed; body reads code-and-docs-cleanup.
  - major evidenced-removal 1/2: The diff shows the wrapper removal and the repository search output shows no code caller, but the permitted citations do not establish the supplied private, unused caller evidence.

## concurrency-correctness--cache-fill-invalidation

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads concurrency-correctness.
  - All unchanged rubric criteria scored 2/2.
  - Attribution dispute overlap-contract: The supplied requirement E64 permits an overlapping read to return its earlier snapshot, but B's answer does not state that behavior or distinguish it from subsequently invoked reads. E177 describes the implementation, while E178 only says it covers overlapping operations; neither explains the overlap contract. The existing reason therefore attributes a statement to the answer that is absent. No latest-at-response claim appears, but that alone does not satisfy the criterion.

## distributed-system-patterns--search-topology

- revised: executed; body reads distributed-system-patterns.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads distributed-system-patterns.
  - major replicated-shards 1/2: Correctly states distinct shards are not redundant, includes copy readiness/routing and coordinator measurement, and avoids a latency guarantee. It does not recommend justified per-shard redundancy or another supported recovery design for the required upgrade/failure scenario.
  - Attribution dispute memory-and-topology: The evidence supports rejecting full-index replication and distinguishing disjoint shards from copies. But the unchanged criterion also requires identifying 16 shards as the arithmetic minimum before headroom or skew; the answer recommends 64 shards and does not state that minimum. The existing score of 2 is therefore not supported by the full criterion. Provenance: the quoted answer text is from this run (E39); the fixture supplies the index size and per-machine budget (E3), and describes the 32-process replication proposal and 64-shard alternative (E5, E6). No contradiction in those inputs.

## failure-oriented-testing--race-clean-lost-update

- revised: executed; body reads none.
  - major retain-and-limit 1/2: The retained schedule distinguishes broken and fixed behavior and reports the actual verifier outcome. No race detection was executed or presented as supplementary executed-path evidence.

- revised-r2: executed; body reads failure-oriented-testing.
  - major retain-and-limit 1/2: The same deterministic regression discriminates broken from fixed behavior and reports the verifier result. No race detection was executed or reported as additional path evidence.

## graceful-draining--rolling-worker-drain

- revised: executed; body reads graceful-draining.
  - critical admission-and-ownership 1/2: Addresses closing admission, settling in-flight acquisition, and keeping dependencies alive. It does not explicitly establish that ownership remains valid through active work and checkpointing or require fenced release.
  - critical durable-handoff 1/2: Recognizes uncertain effects, checkpoint reconciliation, identity, and ownership metadata. It does not clearly specify stable effect identity and replay safety across replacement processes, or warn that an uncertain checkpoint commit cannot guarantee recovery.
  - major bounded-rollout 1/2: Uses the actual 90-second limit and calls for a bounded drain, but gives no cost budget or safety margin. It does not explain that 12–24-hour jobs and twice-daily replacement require resumability or retained workers rather than full completion during shutdown.
  - major failure-checks 1/2: Specifies the repeated host sequence and checks the planned-versus-malformed-input counters. It does not specify checks for admission races, crash/kill, or failed or ambiguous checkpoint commits.
  - Attribution dispute admission-and-ownership: The existing reason says the answer does not explicitly establish ownership validity through active work and checkpointing or require fenced release. However, the answer requires work to remain tracked until finished or durably continued, keeps lease and checkpoint dependencies alive, leaves unsafe work visible for recovery, and specifically calls for checkpoint writes to reject stale-owner writes or cleanup. The cited answer evidence supports those ownership safeguards; the score of 1 and its reason are not supported. Fixture polling and health behavior are separately shown in E38 and E40.

- revised-r2: executed; body reads graceful-draining.
  - major bounded-rollout 1/2: Correctly evaluates the shown 80-second wait and recognizes the remaining 10 seconds, but the proposed protocol does not allocate measured checkpoint and cleanup costs with margin. It does not explicitly connect 12–24-hour work and twice-daily replacements to resumability or retained workers.
  - major failure-checks 1/2: Checks counters, continuation, admission, and malformed input. It does not specify a repeated A-to-B-to-C schedule with an eventual-completion assertion, nor explicit crash/kill and failed or ambiguous checkpoint tests.

## idempotency--scoped-transfer-identity

- revised: executed; body reads idempotency.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads idempotency.
  - critical intent-binding 1/2: Requires comparison of effect-relevant fields and rejection of changed intent, but does not specify a validated normalized command or explain semantic normalization.

## infrastructure-change-safety--three-pod-rollout

- revised: executed; body reads infrastructure-change-safety, graceful-draining.
  - major bounded-rollout 1/2: Provides useful rollout gates and acceptance checks for repeated retirements and checkpoint failure, but does not show a measured budget with margin or cover forced kill and completion after the A-to-B-to-C sequence.

- revised-r2: executed; body reads infrastructure-change-safety.
  - critical admission-ownership 1/2: Recognizes that readiness is insufficient and calls for stopped claims and safe handoff, but does not address authoritative acquisition, a poll or claim already in flight, or ownership fencing during checkpointing.
  - major bounded-rollout 1/2: Specifies sequential rollout and checks poison-input behavior, replay, and the 90-second boundary, but does not cover forced kill and failed checkpoint as distinct cases or establish a checkpoint and cleanup budget with margin.

## legacy-code-changes--member-shipping-threshold

- revised: executed; body reads legacy-code-changes.
  - major boundary-checks 1/2: Covers the requested shipping fees at the boundary values, but does not state expected totals for all four required cases.

- revised-r2: executed; body reads legacy-code-changes.
  - All unchanged rubric criteria scored 2/2.

## mcp-engineering--private-resource-handle

- revised: executed; body reads mcp-engineering.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads mcp-engineering.
  - major test-evidence 1/2: Proposes relevant caller, handle, and envelope checks and distinguishes test authentication from OAuth validation. It does not address schema annotations, and the proposed checks were not executed.

## messaging-reliability--reordered-account-events

- revised: executed; body reads messaging-reliability.
  - critical dedup-effect 1/2: Specifies durable identity in the same transaction and commit-before-ack, but does not describe or verify safe concurrent arbitration, such as a uniqueness constraint.
  - major poison-and-checks 1/2: Offers a terminal disposition for malformed messages, but does not define a bounded retry policy or test duplicate, reordered, concurrent, and commit-before-ack cases with concrete state/effect counts.

- revised-r2: executed; body reads none.
  - critical dedup-effect 1/2: Provides event identity and transaction atomicity in its recommendation, but does not address or verify safe concurrent arbitration.
  - major poison-and-checks 0/2: Mentions malformed-event disposition, but supplies no bounded policy and no tests for duplicate, reordered, concurrent, or commit-before-ack delivery with concrete state/effect counts.

## microservice-boundaries--modular-monolith-fit

- revised: executed; body reads microservice-boundaries.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads microservice-boundaries.
  - All unchanged rubric criteria scored 2/2.

## microservice-data--saga-interleaving

- revised: executed; body reads microservice-data.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads microservice-data.
  - All unchanged rubric criteria scored 2/2.

## microservice-extraction--rollback-after-new-writes

- revised: executed; body reads microservice-extraction.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads microservice-extraction.
  - All unchanged rubric criteria scored 2/2.

## microservice-integration--mixed-version-response

- revised: executed; body reads microservice-integration.
  - critical compatible-sequence 1/2: Uses an additive transition, but the asserted Checkout v2 compatibility with Pricing v1 contradicts the supplied contract; the sequence therefore does not establish working supported combinations.
  - major matrix 1/2: Requests mixed-version and rollback checks and accounts for long-lived mobile clients, but does not specify concrete expected quote values or outcomes per combination.
  - Attribution dispute compatible-sequence: The score of 1 is supported, but the prior reason’s contradiction claim is not: the answer asserts Checkout v2 can operate against Pricing v1, which conflicts with the fixture stating Checkout v2 cannot read amount_cents while Pricing v1 returns only amount_cents. The additive transition is proposed, but the sequence does not establish that all supported combinations work.

- revised-r2: executed; body reads microservice-integration.
  - critical compatible-sequence 1/2: Proposes an additive transition, but does not make Checkout v2 tolerant of Pricing v1. The claim that dual-field Pricing enables rollback is unsupported for rollback to the supplied v1 response.
  - major matrix 1/2: Calls for mixed-version and rollback checks and includes mobile clients, but gives no concrete expected quote values or outcomes for each combination.
  - Attribution dispute compatible-sequence: The score of 1 is supported, but its reason is not fully supported: the answer says Checkout v2 consumes amount_minor and claims the dual-field response enables rollback, without making Checkout v2 tolerant of Pricing v1. The fixture says Pricing v1 returns only amount_cents and Checkout v2 cannot read amount_cents.

## microservice-operations--retry-amplification

- revised: executed; body reads microservice-operations.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads microservice-operations.
  - All unchanged rubric criteria scored 2/2.

## microservice-testing--unknown-api-consumers

- revised: executed; body reads microservice-testing.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads microservice-testing.
  - All unchanged rubric criteria scored 2/2.

## recovery-validation--restored-order-ledger

- revised: executed; body reads recovery-validation.
  - critical recovery-identity 1/2: Calls for identity-based resolution and the evidence shows source artifacts were left unchanged. It does not specify an atomic arbitration method or explicitly verify r1/r2 remain unduplicated after repair.

- revised-r2: executed; body reads recovery-validation.
  - critical recovery-identity 1/2: Recognizes duplicate-effect risk and preserves the artifacts, but does not prescribe stable-identity replay with atomic arbitration or verify r1/r2 remain single-effect after repair.

## stream-processing-design--window-finality

- revised: executed; body reads stream-processing-design.
  - major retention-verification 1/2: Recognizes the two-hour replay horizon and stalled progress, and proposes relevant replay checks. It does not give concrete expected outputs and retained-state assertions for checks around the 60-second expiry or two-hour horizon.

- revised-r2: executed; body reads stream-processing-design.
  - critical independent-aggregate 1/2: Trace matches the required 5/1, 15/2, 15/2, 18/2, 25/3, 25/3, 25/3 progression through d7. But it incorrectly accepts d8 in the trace and claims final 29/4, contradicting its own later statement that d8 is after finality and must be dropped. Correct final output is 25/3.

## technical-deprecation--periodic-export-client

- revised: executed; body reads technical-deprecation.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - critical removal-and-recovery-gates 1/2: Sets monthly-run, migration, exception, approval, and retention gates, but leaves rollback and data recovery as future planning and does not define concrete stop or roll-forward conditions.

## go-backend--cancelled-fanout

- baseline: executed; body reads go-backend.
  - major deterministic-check 1/2: The receiver checks cancellation after receiving, but worker sends are not gated after Get. The fixture blocks inside Get rather than forcing the specified post-Get, pre-send condition.

- revised: executed; body reads go-backend.
  - major deterministic-check 1/2: Cancellation is checked after receiving a result, but there is no gate holding workers after Get and before send. The fixture's gated client holds inside Get, so the required interleaving is not validated.

- revised-r2: executed; body reads go-backend.
  - major deterministic-check 0/2: The changed code has no gate that holds workers after dependency return and before send. The supplied test blocks inside Get until cancellation, so it does not test the specified post-Get, pre-send race.

## python-backend--cancelled-export

- baseline: executed; body reads python-backend.
  - critical effect-uncertainty 0/2: It cancels the request and propagates, but contains no committed batch identity preservation or reconciliation before a retry. Post-commit fixture coverage only observes that the effect already happened.
  - major forced-checks 1/2: The verifier gates cancellation during send and after commit, and checks child inactivity, one release, and the expected effect state. It does not test cancellation before acquisition completes or a duplicate retry; those observations are missing.

- revised: executed; body reads python-backend.
  - critical effect-uncertainty 0/2: There is no retry reconciliation or explicit preservation of the uncertain/committed business outcome. The verifier observes one effect after post-commit cancellation but does not implement safe retry handling.
  - major forced-checks 1/2: The fixture tests cancellation during send and after remote commit, and asserts one release and the expected effect list. It has no pre-acquisition cancellation case or retry duplicate-effect check.

- revised-r2: executed; body reads python-backend.
  - critical effect-uncertainty 0/2: Cancellation propagation does not reconcile an uncertain remote commit or preserve a retry-safe outcome. No retry or deduplication behavior exists in the changed code.
  - major forced-checks 1/2: The verifier checks cancellation during send and after commit, child termination, one release, and the effect state. It omits cancellation before acquisition and duplicate effects on retry.

- revised-r3: executed; body reads python-backend.
  - critical effect-uncertainty 1/2: The fixture checks that cancellation after commit leaves one recorded effect, and the implementation does not retry. But it has no reconciliation path for an uncertain committed batch; a later retry could duplicate the effect.
  - major forced-checks 1/2: The fixture gates cancellation during send and after commit and checks one release and the effect state. It does not exercise cancellation before acquisition completes, nor explicitly check child termination as a separate observation.

## typescript-backend--untrusted-command-body

- revised: executed; body reads typescript-backend.
  - critical scope-and-evidence 1/2: Only handler.ts changed, and the answer reports the observed check result without claiming production validation. It does not state the fixture-only limits.

- revised-r2: executed; body reads typescript-backend.
  - critical scope-and-evidence 1/2: Only handler.ts changed, the supplied check ran successfully, and the answer reports its output without claiming production validation. It does not state the fixture-only limits.

## capacity-planning--zone-loss

- revised: executed; body reads capacity-planning.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads capacity-planning.
  - All unchanged rubric criteria scored 2/2.

## data-layout-performance--ring-history

- revised: executed; body reads data-layout-performance.
  - major measurement 1/2: Rejects the universal claim and includes conversion/gather and representative sizes, but does not ask for repeated matched runs, working-set comparisons, or exact retained-history checks as part of measurement.
  - critical read-only 1/2: The tracked fixture files are unchanged, but the actual scope diff records a newly created bytecode file. The claim is therefore incomplete. It separates the read-only correctness check from performance measurement, and makes no performance run claim.
  - Attribution dispute retained-horizon: The diagnosis and observed failures support the existing reason, but the answer does not explicitly define the usable horizon in terms of capacity, observations seen, and requested count, as the criterion requires. The command output confirms the oversized result and empty/zero-volume failures.

- revised-r2: executed; body reads data-layout-performance.
  - All unchanged rubric criteria scored 2/2.

## database-performance--pool-and-lock

- revised: executed; body reads database-performance.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads database-performance.
  - All unchanged rubric criteria scored 2/2.

## load-testing--closed-arrivals

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads load-testing.
  - All unchanged rubric criteria scored 2/2.

## overload-control--tenant-fanout

- revised: executed; body reads overload-control.
  - major feedback-recovery 1/2: Separates rejection from useful-work latency, proposes finite coordinated retries, and supplies overload and recovery checks. It does not specify offered or rejected demand signals for autoscaling.

- revised-r2: executed; body reads overload-control.
  - major feedback-recovery 1/2: Separates rejection feedback from useful-work latency, proposes bounded retries, and identifies a recovery check. It does not specify offered or rejected demand signals for autoscaling.

## performance-diagnosis--held-pool

- revised: executed; body reads none.
  - critical constraint 1/2: Identifies pool occupancy and connection queueing as the best-supported constraint, and describes lock-wait absence as sampled. It does not explicitly bound the other incident observations to the sampled interval.

- revised-r2: executed; body reads performance-diagnosis.
  - All unchanged rubric criteria scored 2/2.

## temporal-ai-workflows--ai-graph-retry-and-budget

- revised: executed; body reads none.
  - major uncertainty-and-checks 1/2: Acknowledges the unknown lost-call outcome and its billing uncertainty. No proposed failure schedule or checks for one supplier acceptance and spending at or below the cap are given.

- revised-r2: executed; body reads temporal-ai-workflows.
  - major uncertainty-and-checks 1/2: Clearly describes the uncertainty caused by absent model deduplication and usage lookup. It does not propose a failure schedule or checks for one supplier acceptance and spending at or below the cap.

## temporal-production-readiness--backlog-versus-vendor-quota

- revised: executed; body reads temporal-production-readiness.
  - major error-policy 1/2: Handles throttling and transient retries, preserves resumable accepted work, and proposes intake backpressure. It does not explicitly explain terminal failure handling or state that backlog cannot be bounded while sustained arrivals remain above successful capacity.

- revised-r2: executed; body reads temporal-production-readiness.
  - major error-policy 1/2: Provides throttling and transient retry handling, preserves unresolved work, and recognizes the sustained capacity gap. It does not clearly state how terminal failures are distinguished or handled; “Keep retrying unresolved documents” leaves that unclear.

## temporal-reliability--payment-response-loss

- revised: executed; body reads temporal-reliability.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads temporal-reliability.
  - All unchanged rubric criteria scored 2/2.

- revised-r3: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## temporal-safe-deployments--replay-and-worker-retirement

- revised: executed; body reads none.
  - major rollback-evidence 1/2: Requests representative real-history replay and records missing history/version evidence; recognizes that v2-assigned executions need continued compatible service. It does not call for new- and old-execution tests, and does not explicitly explain why replacing all code with v1 can be unsafe after v2 commands.

- revised-r2: executed; body reads temporal-safe-deployments.
  - All unchanged rubric criteria scored 2/2.
  - Attribution dispute rollback-evidence: The reason is supported insofar as the answer calls for representative-history replay, separates replay from external-effect checks, notes missing histories and test results, and says routing rollback does not move pinned runs or undo effects. Provenance: these points appear in the answer (E34,E43,E45,E49); the skill body was natively read, but no package source indices were retrieved (E209,E210,E245). Contradiction / criterion gap: the answer does not explicitly call for tests of both existing-run and fresh execution behavior; it proposes replay and a gradual new-start ramp (E43,E44). It also does not explain that reverting all Workers to v1 may be unsafe for executions that already emitted v2 commands: it recommends compatible Workers for both groups and reconciliation, without stating that command-history hazard (E45). Thus the supplied reason describes supported parts of the plan, but does not substantiate full criterion satisfaction at score 2.

## background-maintenance--finite-local-cleanup-nontrigger

- baseline: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## messaging-reliability--local-observer-callback

- baseline: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## performance-diagnosis--format-only

- baseline: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## stream-processing-design--local-date-group-nontrigger

- baseline: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## phase5-cleanup--positive-routing-conditional-specialists

- baseline: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - major observable-behavior 1/2: The run appropriately reports missing implementation and avoids an unnecessary policy question or unsupported delegation. But available evidence does not show that the relevant skill was activated: the claim in the answer is not corroborated by a body read or literal tool call. The empty fixture also prevented the requested focused review.
  - Attribution dispute observable-behavior: The reason supporting score 1 is only partly supported. The answer reports the missing implementation and says no specialist question is supported; the recorded command output lists only .agents and .git, and the repository tree lists skill packages but no billing, API, or consumer implementation. No policy question appears in the answer. But skill activation is not evidenced: the answer's claim is contradicted by the empty native body-read list and false literal-call observation; retrieved source indices are also empty. The empty diff and untracked-file list, plus empty fixtures, support that no project changes or supplied implementation are evidenced, while the command outputs do not establish a universal inability to review. Score 1 itself cannot be validated without score definitions.
  - Attribution dispute observable-behavior: The answer reports that it cannot identify the charge operation, retry identity, or durability boundary, and says no specialist question is supported; the workspace listing shows only `.agents` and `.git` (E2, E3, E10). The repository tree includes the idempotency skill (E114), but the run records no native body reads, no literal skill tool call, and no retrieved package source indices (E290–E292). That evidence contradicts the answer’s claim that it used the guidance. The score remains 1 as requested, but its correctness cannot be independently validated because no score definitions are provided.

- revised: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - major observable-behavior 1/2: The run appropriately reports missing implementation, keeps the response focused, and does not ask an unnecessary policy question or delegate without a distinct evidence-backed question. However, it does not show skill activation, and the empty fixture prevented review of the requested failure boundary.
  - Attribution dispute observable-behavior: The reason supporting score 1 is only partly supported. The answer stays on the requested failure boundary, identifies the lack of payment implementation, gives no policy question, and declines specialist routing for lack of an evidenced distinct question. The recorded directory listing contains only .agents and .git, while the hidden-file search excluding those returned no paths. Skill activation is unsupported by the empty native body-read list, false literal-call observation, and empty retrieved-source-index list. Empty fixtures and diff/untracked-file fields support absence of supplied implementation evidence, but do not prove every possible review path was unavailable. Score 1 itself cannot be validated without score definitions.

## phase5-cleanup--positive-routing-chain

- baseline: executed; body reads microservice-data, microservice-extraction. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads architecture, microservice-extraction. Original authored fixture directory is empty; material capability is not established.
  - major observable-behavior 1/2: The answer recognizes the relevant extraction and data-ownership problem, acknowledges the evidence gap, and gives bounded conditional next steps rather than asserting unsupported findings. But it does not identify an actual ownership chain from evidence; the fixture is empty and command outputs show only local skills and Git metadata. Its references to local guidance are not independently verifiable from the supplied body-read output.

## phase5-cleanup--skill-tool-unavailable-fallback

- baseline: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - critical observable-behavior 1/2: The answer correctly discloses that the code and storage guarantees cannot be verified and offers a concrete next step, without claiming activation or refusing future help. It does not make a useful bounded review from available capability: unlike A, it has no observed native skill body read or other review guidance applied.

- revised: executed; body reads concurrency-correctness. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

## phase5-cleanup--leading-word-not-policy-trigger

- baseline: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

## phase5-cleanup--source-provenance-preservation

- baseline: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - critical observable-behavior 1/2: The answer correctly leaves unsupported migration claims unresolved and invents no migration citations. However, it makes factual claims about the project contents without citing exact filenames. Provenance: the supplied command output lists project files, and the actual fixture directory is reported empty; those observations support the absence claim but are not cited in the answer.

- revised: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

## phase5-cleanup--boundary-nontrigger-local-edit

- baseline: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads none. Original authored fixture directory is empty; material capability is not established.
  - major observable-behavior 1/2: Partial: the answer reports plainly and no workspace change is recorded. The two typo searches returned no output, so there is no evidence that a correction was possible or that architecture/reliability specialists or a policy workflow were activated. Absence of recorded activation does not prove they were not activated; the supplied evidence records only command execution types and says complete per-turn tool schemas are unavailable. The empty search results and workspace diff do not establish that the typo is absent from all relevant material.

## phase5-cleanup--boundary-changed-tradeoff

- baseline: executed; body reads microservice-data. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

- revised: executed; body reads microservice-extraction. Original authored fixture directory is empty; material capability is not established.
  - All unchanged rubric criteria scored 2/2.

## concurrency-correctness--sequential-file-transform

- revised-r2: blocked_or_failed, unscored.

- revised-r2-capacity-retry: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## failure-oriented-testing--pure-format-assertion

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## load-testing--unit-assertion

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## followup-v2--native-neutral-extraction-v2

- revised: executed; body reads none. Preserved new v2 prompt says invoice; exact copied fixture describes Address. This attempt does not establish the intended handoff exposure; corrected separately authored explicit v3 is independent.
  - major sequence-and-assumption 1/2: Gives concrete fencing, synchronization, and rollback-reconciliation steps and grounds its assumption in customer retention expectations. It does not specify a validation step.

- revised-r2: executed; body reads none. Preserved new v2 prompt says invoice; exact copied fixture describes Address. This attempt does not establish the intended handoff exposure; corrected separately authored explicit v3 is independent.
  - major sequence-and-assumption 1/2: Gives concrete pre-cutover ownership and recovery steps and states a material unresolved assumption grounded in the fixture. It does not lay out a separate validation sequence.

## followup-v2--canonical-neutral-extraction-v2

- canonical: executed; body reads none. Preserved new v2 prompt says invoice; exact copied fixture describes Address. This attempt does not establish the intended handoff exposure; corrected separately authored explicit v3 is independent.
  - major bounded-handoff 1/2: Reads the relevant proposal and assesses its ownership and rollback questions. No observable native read of an extraction or data-analysis instruction body is present, so the instruction-read portion is unsupported.
  - Attribution dispute bounded-handoff: The answer assesses the supplied proposal's ownership and rollback questions, but the record contains no observed native read of an extraction or data-analysis instruction body. The answer’s proposal claims are grounded in the supplied rollout output; the metadata records an empty body-read list.

- canonical-r2: executed; body reads microservice-extraction. Preserved new v2 prompt says invoice; exact copied fixture describes Address. This attempt does not establish the intended handoff exposure; corrected separately authored explicit v3 is independent.
  - major bounded-handoff 1/2: The answer addresses the distinct ownership and recovery questions, and the observed instruction read uses the native reader. But the omitted instruction body prevents judging whether that read was relevant to the handoff; no literal Skill tool call can be claimed.
  - Attribution dispute bounded-handoff: The answer addresses the ownership and recovery questions, and the observed body read used the native filesystem reader. But the omitted instruction body prevents verifying that this read was relevant to the handoff; no literal Skill tool call is recorded. Quotes are from the supplied rollout command output and the native-read metadata.

## followup-v2--native-reader-fallback-v2

- revised: executed; body reads concurrency-correctness, go-backend.
  - major whole-update 1/2: Recommends protecting the whole update or an atomic operation and accurately disclaims runtime verification. Does not propose a discriminating forced schedule.

- revised-r2: executed; body reads concurrency-correctness.
  - major whole-update 1/2: Gives a complete-lock recommendation and distinguishes race-detector cleanliness from the business invariant. No forced schedule is recommended.

## followup-v2--neutral-handoff-comment-nontrigger-v2

- revised: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - All unchanged rubric criteria scored 2/2.

## followup-v2--architecture-explicit-native-v2

- revised: executed; body reads architecture.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads none.
  - critical explicit-native-read 0/2: No successful native read of the architecture SKILL.md body is observed after invocation.

## followup-v2--standalone-temporal-source-index-v2

- revised: executed; body reads temporal-reliability.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads temporal-reliability.
  - critical installed-actionable-source 0/2: The shown commands read the skill body and list package paths, but do not read the source index or a supporting reference body. The answer's local-index lookup claim is therefore unsupported by observable command output, despite naming actionable URLs.

- revised-r3: executed; body reads temporal-reliability.
  - All unchanged rubric criteria scored 2/2.

## followup-v3--explicit-native-sibling-handoff-v3

- canonical-r2: executed; body reads microservice-extraction, technical-deprecation, graceful-draining.
  - All unchanged rubric criteria scored 2/2.

- revised-r2: executed; body reads microservice-extraction, technical-deprecation, graceful-draining.
  - All unchanged rubric criteria scored 2/2.

## followup-v3--python-missing-provider-contract-v3

- revised-r3: executed; body reads python-backend.
  - All unchanged rubric criteria scored 2/2.
