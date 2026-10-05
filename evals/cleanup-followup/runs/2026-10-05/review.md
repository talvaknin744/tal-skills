# Cleanup follow-up behavioral evidence

120 native responder attempts, 119 executed, 119 independently scored. One original capacity failure and successful matching retry are retained. Native Codex CLI 0.160.0, Luna responders, fresh blind single-case Luna graders.

All 35 unchanged positives ran through normal discovery in R1 and R2. Automatic target body reads: R1 28/34, R2 32/34; architecture is explicit-only. R2 misses messaging-reliability and technical-deprecation, which read their targets in R1. Coverage across two runs does not imply reliable activation. R3 is a narrow rerun for Python and Temporal reliability only.

Critical-zero runs retained: 5. Critical-partial runs retained: 19. Exact quote-audit pass rows: 119/119. Full independent scores are in scores/. Original quote mismatches and grading attempts are preserved in the release archive. Technical score-support disputes remain visible in report.json; exact attribution does not settle those disputes.

R3 Python cancellation positive remains partial on uncertain committed effects, with supplied and independent verifier passes. The newly authored missing-provider-contract case passes all critical criteria; it does not erase the original partial. R3 Temporal source-index lookup actually reads installed sources.md and passes all critical criteria. R3 Temporal payment content passes, while observed target body read is absent.

| Case | Candidate | Execution | Eligible | Body reads | Critical | Major | Minor | Exact quote audit |
|---|---|---|---|---|---|---|---|---|
| a2a-engineering--task-observer-disconnect | revised | executed | True | a2a-engineering | observer-lifetime:2, task-authority:2, scope-and-evidence:2 | 2/4 | 0/0 | True |
| a2a-engineering--task-observer-disconnect | revised-r2 | executed | True | a2a-engineering | observer-lifetime:2, task-authority:2, scope-and-evidence:2 | 2/4 | 0/0 | True |
| architecture--multilingual-worker | revised | executed | True |  | read-only:2 | 12/12 | 0/0 | True |
| architecture--multilingual-worker | revised-r2 | executed | True |  | read-only:2 | 10/12 | 0/0 | True |
| background-maintenance--sparse-tail-metadata-pressure | revised | executed | True | background-maintenance | distribution-cause:2, net-yield:2, foreground-budget:2, controller-direction:2, scope-and-evidence:2 | 8/8 | 0/0 | True |
| background-maintenance--sparse-tail-metadata-pressure | revised-r2 | executed | True | background-maintenance | distribution-cause:2, net-yield:2, foreground-budget:2, controller-direction:2, scope-and-evidence:2 | 6/8 | 0/0 | True |
| code-and-docs-cleanup--similar-policy-cleanup | revised | executed | True | code-and-docs-cleanup | policy-independence:2, reader-contract:1, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| code-and-docs-cleanup--similar-policy-cleanup | revised-r2 | executed | True | code-and-docs-cleanup | policy-independence:2, reader-contract:2, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| concurrency-correctness--cache-fill-invalidation | revised | executed | True |  | observable-contract:2, atomic-shared-ordering:2, scope:2 | 8/8 | 0/0 | True |
| concurrency-correctness--cache-fill-invalidation | revised-r2 | executed | True | concurrency-correctness | observable-contract:2, atomic-shared-ordering:2, scope:2 | 8/8 | 0/0 | True |
| distributed-system-patterns--search-topology | revised | executed | True | distributed-system-patterns | memory-and-topology:2, complete-results:2, read-only:2 | 12/12 | 0/0 | True |
| distributed-system-patterns--search-topology | revised-r2 | executed | True | distributed-system-patterns | memory-and-topology:2, complete-results:2, read-only:2 | 10/12 | 0/0 | True |
| failure-oriented-testing--race-clean-lost-update | revised | executed | True |  | oracle:2, controlled-schedule:2, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| failure-oriented-testing--race-clean-lost-update | revised-r2 | executed | True | failure-oriented-testing | oracle:2, controlled-schedule:2, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| graceful-draining--rolling-worker-drain | revised | executed | True | graceful-draining | failure-classification:2, admission-and-ownership:1, durable-handoff:1, scope-and-evidence:2 | 4/8 | 0/0 | True |
| graceful-draining--rolling-worker-drain | revised-r2 | executed | True | graceful-draining | failure-classification:2, admission-and-ownership:2, durable-handoff:2, scope-and-evidence:2 | 4/8 | 0/0 | True |
| idempotency--scoped-transfer-identity | revised | executed | True | idempotency | scoped-auth:2, intent-binding:2, read-only:2 | 12/12 | 0/0 | True |
| idempotency--scoped-transfer-identity | revised-r2 | executed | True | idempotency | scoped-auth:2, intent-binding:1, read-only:2 | 12/12 | 0/0 | True |
| infrastructure-change-safety--three-pod-rollout | revised | executed | True | infrastructure-change-safety, graceful-draining | maintenance-accounting:2, admission-ownership:2, scope-and-evidence:2 | 2/4 | 0/0 | True |
| infrastructure-change-safety--three-pod-rollout | revised-r2 | executed | True | infrastructure-change-safety | maintenance-accounting:2, admission-ownership:1, scope-and-evidence:2 | 2/4 | 0/0 | True |
| legacy-code-changes--member-shipping-threshold | revised | executed | True | legacy-code-changes | intended-correction:2, minimal-boundary:2, read-only:2 | 10/12 | 0/0 | True |
| legacy-code-changes--member-shipping-threshold | revised-r2 | executed | True | legacy-code-changes | intended-correction:2, minimal-boundary:2, read-only:2 | 12/12 | 0/0 | True |
| mcp-engineering--private-resource-handle | revised | executed | True | mcp-engineering | request-authority:2, pinned-contract:2, scope-and-evidence:2 | 4/4 | 0/0 | True |
| mcp-engineering--private-resource-handle | revised-r2 | executed | True | mcp-engineering | request-authority:2, pinned-contract:2, scope-and-evidence:2 | 2/4 | 0/0 | True |
| messaging-reliability--reordered-account-events | revised | executed | True | messaging-reliability | reordering:2, dedup-effect:1, scope-and-evidence:2 | 2/4 | 0/0 | True |
| messaging-reliability--reordered-account-events | revised-r2 | executed | True |  | reordering:2, dedup-effect:1, scope-and-evidence:2 | 0/4 | 0/0 | True |
| microservice-boundaries--modular-monolith-fit | revised | executed | True | microservice-boundaries | preserve-simple-boundary:2, transaction-and-ownership:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-boundaries--modular-monolith-fit | revised-r2 | executed | True | microservice-boundaries | preserve-simple-boundary:2, transaction-and-ownership:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-data--saga-interleaving | revised | executed | True | microservice-data | interleaving:2, isolation-gap:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-data--saga-interleaving | revised-r2 | executed | True | microservice-data | interleaving:2, isolation-gap:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-extraction--rollback-after-new-writes | revised | executed | True | microservice-extraction | new-write-loss:2, one-write-authority:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-extraction--rollback-after-new-writes | revised-r2 | executed | True | microservice-extraction | new-write-loss:2, one-write-authority:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-integration--mixed-version-response | revised | executed | True | microservice-integration | mixed-window:2, compatible-sequence:1, read-only:2 | 6/8 | 0/0 | True |
| microservice-integration--mixed-version-response | revised-r2 | executed | True | microservice-integration | mixed-window:2, compatible-sequence:1, read-only:2 | 6/8 | 0/0 | True |
| microservice-operations--retry-amplification | revised | executed | True | microservice-operations | amplification:2, deadline-budget:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-operations--retry-amplification | revised-r2 | executed | True | microservice-operations | amplification:2, deadline-budget:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-testing--unknown-api-consumers | revised | executed | True | microservice-testing | bounded-contract-evidence:2, breaking-change:2, read-only:2 | 8/8 | 0/0 | True |
| microservice-testing--unknown-api-consumers | revised-r2 | executed | True | microservice-testing | bounded-contract-evidence:2, breaking-change:2, read-only:2 | 8/8 | 0/0 | True |
| recovery-validation--restored-order-ledger | revised | executed | True | recovery-validation | business-reconciliation:2, recovery-identity:1, scope-and-evidence:2 | 4/4 | 0/0 | True |
| recovery-validation--restored-order-ledger | revised-r2 | executed | True | recovery-validation | business-reconciliation:2, recovery-identity:1, scope-and-evidence:2 | 4/4 | 0/0 | True |
| stream-processing-design--window-finality | revised | executed | True | stream-processing-design | event-time-progress:2, late-policy:2, identity-revision-composition:2, independent-aggregate:2, scope-evidence:2 | 2/4 | 0/0 | True |
| stream-processing-design--window-finality | revised-r2 | executed | True | stream-processing-design | event-time-progress:2, late-policy:2, identity-revision-composition:2, independent-aggregate:1, scope-evidence:2 | 4/4 | 0/0 | True |
| technical-deprecation--periodic-export-client | revised | executed | True | technical-deprecation | consumer-evidence:2, replacement-contract:2, stage-and-ownership:2, prevent-new-adoption:2, removal-and-recovery-gates:2, scope-and-evidence:2 | 0/0 | 0/0 | True |
| technical-deprecation--periodic-export-client | revised-r2 | executed | True |  | consumer-evidence:2, replacement-contract:2, stage-and-ownership:2, prevent-new-adoption:2, removal-and-recovery-gates:1, scope-and-evidence:2 | 0/0 | 0/0 | True |
| go-backend--cancelled-fanout | baseline | executed | True | go-backend | send-lifetime:2, join-and-errors:2, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| go-backend--cancelled-fanout | revised | executed | True | go-backend | send-lifetime:2, join-and-errors:2, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| go-backend--cancelled-fanout | revised-r2 | executed | True | go-backend | send-lifetime:2, join-and-errors:2, scope-and-evidence:2, executed-verification:2 | 0/4 | 0/0 | True |
| python-backend--cancelled-export | baseline | executed | True | python-backend | cancel-ownership:2, effect-uncertainty:0, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| python-backend--cancelled-export | revised | executed | True | python-backend | cancel-ownership:2, effect-uncertainty:0, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| python-backend--cancelled-export | revised-r2 | executed | True | python-backend | cancel-ownership:2, effect-uncertainty:0, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| python-backend--cancelled-export | revised-r3 | executed | True | python-backend | cancel-ownership:2, effect-uncertainty:1, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | True |
| typescript-backend--untrusted-command-body | revised | executed | True | typescript-backend | runtime-boundary:2, trusted-principal:2, scope-and-evidence:1, executed-verification:2 | 4/4 | 0/0 | True |
| typescript-backend--untrusted-command-body | revised-r2 | executed | True | typescript-backend | runtime-boundary:2, trusted-principal:2, scope-and-evidence:1, executed-verification:2 | 4/4 | 0/0 | True |
| capacity-planning--zone-loss | revised | executed | True | capacity-planning | zone-arithmetic:2, downstream:2, read-only:2 | 4/4 | 0/0 | True |
| capacity-planning--zone-loss | revised-r2 | executed | True | capacity-planning | zone-arithmetic:2, downstream:2, read-only:2 | 4/4 | 0/0 | True |
| data-layout-performance--ring-history | revised | executed | True | data-layout-performance | retained-horizon:2, criticality:2, read-only:1 | 2/4 | 0/0 | True |
| data-layout-performance--ring-history | revised-r2 | executed | True | data-layout-performance | retained-horizon:2, criticality:2, read-only:2 | 4/4 | 0/0 | True |
| database-performance--pool-and-lock | revised | executed | True | database-performance | wait-boundary:2, transaction-contract:2, read-only:2 | 4/4 | 0/0 | True |
| database-performance--pool-and-lock | revised-r2 | executed | True | database-performance | wait-boundary:2, transaction-contract:2, read-only:2 | 4/4 | 0/0 | True |
| load-testing--closed-arrivals | revised | executed | True |  | arrival-model:2, accounting:2, read-only:2 | 4/4 | 0/0 | True |
| load-testing--closed-arrivals | revised-r2 | executed | True | load-testing | arrival-model:2, accounting:2, read-only:2 | 4/4 | 0/0 | True |
| overload-control--tenant-fanout | revised | executed | True | overload-control | budget-scope:2, fairness:2, ownership:2, read-only:2 | 2/4 | 0/0 | True |
| overload-control--tenant-fanout | revised-r2 | executed | True | overload-control | budget-scope:2, fairness:2, ownership:2, read-only:2 | 2/4 | 0/0 | True |
| performance-diagnosis--held-pool | revised | executed | True |  | constraint:1, ownership:2, read-only:2 | 4/4 | 0/0 | True |
| performance-diagnosis--held-pool | revised-r2 | executed | True | performance-diagnosis | constraint:2, ownership:2, read-only:2 | 4/4 | 0/0 | True |
| temporal-ai-workflows--ai-graph-retry-and-budget | revised | executed | True |  | graph-reexecution:2, durable-boundaries:2, stable-tool-effect:2, durable-budget:2, read-only:2 | 2/4 | 0/0 | True |
| temporal-ai-workflows--ai-graph-retry-and-budget | revised-r2 | executed | True | temporal-ai-workflows | graph-reexecution:2, durable-boundaries:2, stable-tool-effect:2, durable-budget:2, read-only:2 | 2/4 | 0/0 | True |
| temporal-production-readiness--backlog-versus-vendor-quota | revised | executed | True | temporal-production-readiness | capacity-bound:2, aggregate-control:2, read-only:2 | 6/8 | 0/0 | True |
| temporal-production-readiness--backlog-versus-vendor-quota | revised-r2 | executed | True | temporal-production-readiness | capacity-bound:2, aggregate-control:2, read-only:2 | 6/8 | 0/0 | True |
| temporal-reliability--payment-response-loss | revised | executed | True | temporal-reliability | uncertain-charge:2, business-identity:2, read-only:2 | 8/8 | 0/0 | True |
| temporal-reliability--payment-response-loss | revised-r2 | executed | True | temporal-reliability | uncertain-charge:2, business-identity:2, read-only:2 | 8/8 | 0/0 | True |
| temporal-reliability--payment-response-loss | revised-r3 | executed | True |  | uncertain-charge:2, business-identity:2, read-only:2 | 8/8 | 0/0 | True |
| temporal-safe-deployments--replay-and-worker-retirement | revised | executed | True |  | command-compatibility:2, compatible-routing:2, old-worker-retention:2, read-only:2 | 2/4 | 0/0 | True |
| temporal-safe-deployments--replay-and-worker-retirement | revised-r2 | executed | True | temporal-safe-deployments | command-compatibility:2, compatible-routing:2, old-worker-retention:2, read-only:2 | 4/4 | 0/0 | True |
| background-maintenance--finite-local-cleanup-nontrigger | baseline | executed | True |  | nontrigger:2, read-only:2 | 8/8 | 0/0 | True |
| background-maintenance--finite-local-cleanup-nontrigger | revised | executed | True |  | nontrigger:2, read-only:2 | 8/8 | 0/0 | True |
| background-maintenance--finite-local-cleanup-nontrigger | revised-r2 | executed | True |  | nontrigger:2, read-only:2 | 8/8 | 0/0 | True |
| messaging-reliability--local-observer-callback | baseline | executed | True |  | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | True |
| messaging-reliability--local-observer-callback | revised | executed | True |  | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | True |
| messaging-reliability--local-observer-callback | revised-r2 | executed | True |  | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | True |
| performance-diagnosis--format-only | baseline | executed | True |  | nontrigger:2, read-only:2 | 4/4 | 0/0 | True |
| performance-diagnosis--format-only | revised | executed | True |  | nontrigger:2, read-only:2 | 4/4 | 0/0 | True |
| performance-diagnosis--format-only | revised-r2 | executed | True |  | nontrigger:2, read-only:2 | 4/4 | 0/0 | True |
| stream-processing-design--local-date-group-nontrigger | baseline | executed | True |  | nontrigger:2, scope-evidence:2 | 4/4 | 0/0 | True |
| stream-processing-design--local-date-group-nontrigger | revised | executed | True |  | nontrigger:2, scope-evidence:2 | 4/4 | 0/0 | True |
| stream-processing-design--local-date-group-nontrigger | revised-r2 | executed | True |  | nontrigger:2, scope-evidence:2 | 4/4 | 0/0 | True |
| phase5-cleanup--positive-routing-conditional-specialists | baseline | executed | False |  |  | 2/4 | 0/0 | True |
| phase5-cleanup--positive-routing-conditional-specialists | revised | executed | False |  |  | 2/4 | 0/0 | True |
| phase5-cleanup--positive-routing-chain | baseline | executed | False | microservice-data, microservice-extraction |  | 4/4 | 0/0 | True |
| phase5-cleanup--positive-routing-chain | revised | executed | False | architecture, microservice-extraction |  | 2/4 | 0/0 | True |
| phase5-cleanup--skill-tool-unavailable-fallback | baseline | executed | False |  | observable-behavior:1 | 0/0 | 0/0 | True |
| phase5-cleanup--skill-tool-unavailable-fallback | revised | executed | False | concurrency-correctness | observable-behavior:2 | 0/0 | 0/0 | True |
| phase5-cleanup--leading-word-not-policy-trigger | baseline | executed | False |  |  | 4/4 | 0/0 | True |
| phase5-cleanup--leading-word-not-policy-trigger | revised | executed | False |  |  | 4/4 | 0/0 | True |
| phase5-cleanup--source-provenance-preservation | baseline | executed | False |  | observable-behavior:1 | 0/0 | 0/0 | True |
| phase5-cleanup--source-provenance-preservation | revised | executed | False |  | observable-behavior:2 | 0/0 | 0/0 | True |
| phase5-cleanup--boundary-nontrigger-local-edit | baseline | executed | False |  |  | 4/4 | 0/0 | True |
| phase5-cleanup--boundary-nontrigger-local-edit | revised | executed | False |  |  | 2/4 | 0/0 | True |
| phase5-cleanup--boundary-changed-tradeoff | baseline | executed | False | microservice-data |  | 4/4 | 0/0 | True |
| phase5-cleanup--boundary-changed-tradeoff | revised | executed | False | microservice-extraction |  | 4/4 | 0/0 | True |
| concurrency-correctness--sequential-file-transform | revised-r2 | blocked_or_failed | True |  | unscored | unscored | unscored | False |
| concurrency-correctness--sequential-file-transform | revised-r2-capacity-retry | executed | True |  | correct-result:2, scope:2 | 4/4 | 0/0 | True |
| failure-oriented-testing--pure-format-assertion | revised-r2 | executed | True |  | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | True |
| load-testing--unit-assertion | revised-r2 | executed | True |  | nontrigger:2, read-only:2 | 4/4 | 0/0 | True |
| followup-v2--native-neutral-extraction-v2 | revised | executed | False |  | rollback-after-writes:2, explicit-only-architecture:2, read-only-and-evidence:2 | 6/8 | 0/0 | True |
| followup-v2--native-neutral-extraction-v2 | revised-r2 | executed | False |  | rollback-after-writes:2, explicit-only-architecture:2, read-only-and-evidence:2 | 6/8 | 0/0 | True |
| followup-v2--canonical-neutral-extraction-v2 | canonical | executed | False |  | rollback-after-writes:2, explicit-only-architecture:2, read-only-and-evidence:2 | 6/8 | 0/0 | True |
| followup-v2--canonical-neutral-extraction-v2 | canonical-r2 | executed | False | microservice-extraction | rollback-after-writes:2, explicit-only-architecture:2, read-only-and-evidence:2 | 6/8 | 0/0 | True |
| followup-v2--native-reader-fallback-v2 | revised | executed | True | concurrency-correctness, go-backend | lost-update:2, actual-native-form:2, scope-and-truthfulness:2 | 2/4 | 0/0 | True |
| followup-v2--native-reader-fallback-v2 | revised-r2 | executed | True | concurrency-correctness | lost-update:2, actual-native-form:2, scope-and-truthfulness:2 | 2/4 | 0/0 | True |
| followup-v2--neutral-handoff-comment-nontrigger-v2 | revised | executed | True |  | normal-discovery-nontrigger:2, scope:2 | 4/4 | 0/0 | True |
| followup-v2--neutral-handoff-comment-nontrigger-v2 | revised-r2 | executed | True |  | normal-discovery-nontrigger:2, scope:2 | 4/4 | 0/0 | True |
| followup-v2--architecture-explicit-native-v2 | revised | executed | True | architecture | explicit-native-read:2, read-only:2 | 8/8 | 0/0 | True |
| followup-v2--architecture-explicit-native-v2 | revised-r2 | executed | True |  | explicit-native-read:0, read-only:2 | 8/8 | 0/0 | True |
| followup-v2--standalone-temporal-source-index-v2 | revised | executed | True | temporal-reliability | ambiguous-effect:2, installed-actionable-source:2, source-limits:2 | 4/4 | 0/0 | True |
| followup-v2--standalone-temporal-source-index-v2 | revised-r2 | executed | True | temporal-reliability | ambiguous-effect:2, installed-actionable-source:0, source-limits:2 | 4/4 | 0/0 | True |
| followup-v2--standalone-temporal-source-index-v2 | revised-r3 | executed | True | temporal-reliability | ambiguous-effect:2, installed-actionable-source:2, source-limits:2 | 4/4 | 0/0 | True |
| followup-v3--explicit-native-sibling-handoff-v3 | canonical-r2 | executed | True | microservice-extraction, technical-deprecation, graceful-draining | primary-body-exposure:2, actual-sibling-handoff:2, ownership-and-recovery:2 | 4/4 | 0/0 | True |
| followup-v3--explicit-native-sibling-handoff-v3 | revised-r2 | executed | True | microservice-extraction, technical-deprecation, graceful-draining | primary-body-exposure:2, actual-sibling-handoff:2, ownership-and-recovery:2 | 4/4 | 0/0 | True |
| followup-v3--python-missing-provider-contract-v3 | revised-r3 | executed | True | python-backend | owned-stop-before-release:2, unknown-effect-and-identity:2, missing-provider-contract:2, scope-and-verification:2 | 0/0 | 0/0 | True |

Efficiency is recorded per attempt: words, bytes, elapsed seconds, command calls and reported token usage. These measures do not substitute for correctness.

One repetition per condition. Execution order randomized within stages; baseline precedes frozen revised stages, so no causal improvement claim.
Only native Codex CLI 0.160.0 executed; Claude Code host remains unavailable. Requested responder/grader gpt-6-luna; exact service model revision and backend default reasoning setting unavailable.
All seven original Phase 5 fixture directories were authored empty and retained exactly. Scores cannot establish their material fixture capability.
Two new neutral extraction v2 prompts mismatch invoice wording with exact copied Address fixture and do not establish handoff exposure. Separate explicit Address v3 proves actual primary and sibling body reads in generated/native and canonical packages.
No complete per-turn tool schema inventory in exec JSONL. Requested flags and actual commands are preserved. No literal Skill tool invocation proved; observed filesystem body/resource reads are separate.
No-turn debug catalog inspection lacks ignore-user-config; actual exec ignores user config. Unrelated global skill paths disabled by per-path native config. Normal catalog discovery retained, no target hints or forced runtime activation in unchanged positives.
OS read sandbox is broader than fixtures; runtime forbids outside reads and traces audited. Neither HOME nor CODEX_HOME repurposed. Authentication unchanged.
Architecture is explicit-only; normal target-body absence is expected policy. Explicit R2 focused body-read absence remains observed-host coverage gap. Original empty routing case bypassed catalog exclusion via filesystem inventory and read architecture body; retained as harness/host limitation, not successful implicit policy.
R1 automatic discovery 28/34; R2 32/34. The union covers 34 but does not establish reliable activation. R3 payment positive omitted target body read.
R3 reruns only two changed packages: Python backend and Temporal reliability. Other 33 packages and all 35 descriptions match R2 bytes. No broad fresh R3 activation claim.
Standalone source lookup tested temporal-reliability only; other three Temporal installed indices receive static checks, not this standalone behavior test.
Original Go forced post-Get/pre-send and Python pre-acquisition/retry schedules exceed supplied verifier coverage. Verifier success does not erase rubric failures/partials.
One R2 model-at-capacity attempt had no tool activity. Independent fresh workspace retry kept exact model/settings/packages/prompt and completed; original failure retained.
Independent grading retains unsupported reason disputes and exact-quote mismatches. A numerical score is not silently changed to cure a citation audit; exact attribution reviews and adjudications recorded separately.
