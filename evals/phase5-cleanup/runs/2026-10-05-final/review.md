# Final consolidated Phase 5 behavioral evaluation

Candidate `6006d637248a268202bc4114e79ae7c1d8d502e4bea75dac8fa78ffbfb48b9a5`. Native Codex CLI 0.160.0; all 84 responders used requested Luna and completed. One candidate repetition, no paired baseline comparison.

77 existing + 7 focused cases attempted and executed. Responder timeouts, provider failures, fallback attempts and harness failures: 0. Independently scored 84; unscored 0. Fresh final single-case adjudications completed: 13. Grading attempts: 47; timeouts: 6, all preserved.

| Case | Existing/focused | Critical scores | Major weighted | Minor weighted | Grading |
|---|---|---|---|---|---|
| a2a-engineering--task-observer-disconnect | existing | observer-lifetime:2, task-authority:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| a2a-engineering--ordinary-job-endpoint | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| architecture--constrained-monolith-plan | existing | constraints:2, read-only:2 | 12/12 | 2/2 | scored |
| architecture--offline-standard-review | existing | complete-offline:2, read-only:2 | 12/12 | 0/0 | scored |
| architecture--ordinary-pr-nontrigger | existing | scope:2, read-only:2 | 4/4 | 0/0 | scored |
| background-maintenance--sparse-tail-metadata-pressure | existing | distribution-cause:2, net-yield:2, foreground-budget:2, controller-direction:1, scope-and-evidence:2 | 4/8 | 0/0 | scored |
| background-maintenance--finite-local-cleanup-nontrigger | existing | nontrigger:2, read-only:2 | 4/8 | 0/0 | scored |
| capacity-planning--zone-loss | existing | zone-arithmetic:2, downstream:2, read-only:2 | 4/4 | 0/0 | scored |
| capacity-planning--inventory-only | existing | nontrigger:2, read-only:2 | 4/4 | 0/0 | scored |
| code-and-docs-cleanup--similar-policy-cleanup | existing | policy-independence:2, reader-contract:2, scope-and-evidence:2, executed-verification:2 | 4/4 | 0/0 | scored |
| code-and-docs-cleanup--new-export-format | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| data-layout-performance--ring-history | existing | retained-horizon:2, criticality:2, read-only:2 | 4/4 | 0/0 | scored |
| data-layout-performance--field-rename | existing | nontrigger:2, read-only:1 | 4/4 | 0/0 | scored |
| database-performance--pool-and-lock | existing | wait-boundary:2, transaction-contract:2, read-only:2 | 2/4 | 0/0 | scored |
| database-performance--transaction-only | existing | nontrigger:2, read-only:1 | 4/4 | 0/0 | scored |
| distributed-system-patterns--search-topology | existing | memory-and-topology:2, complete-results:2, read-only:2 | 12/12 | 0/0 | scored |
| distributed-system-patterns--local-retry-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| failure-oriented-testing--race-clean-lost-update | existing | oracle:2, controlled-schedule:2, scope-and-evidence:1, executed-verification:2 | 2/4 | 0/0 | scored |
| failure-oriented-testing--pure-format-assertion | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| go-backend--cancelled-fanout | existing | send-lifetime:0, join-and-errors:1, scope-and-evidence:1, executed-verification:2 | 2/4 | 0/0 | scored |
| go-backend--go-comment-typo | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| idempotency--scoped-transfer-identity | existing | scoped-auth:2, intent-binding:2, read-only:2 | 12/12 | 0/0 | scored |
| idempotency--expired-lease-owner | existing | stale-effect:2, atomic-boundary:2, read-only:2 | 12/12 | 0/0 | scored |
| idempotency--unknown-external-payout | existing | unknown-not-failed:2, no-invented-capability:2, read-only:2 | 4/8 | 0/0 | scored |
| idempotency--outbox-send-mark-crash | existing | crash-window:2, stable-provider-key:2, read-only:2 | 8/8 | 0/0 | scored |
| idempotency--retention-and-version-drift | existing | unresolved-retention:2, normalization-version:2, read-only:2 | 8/12 | 0/0 | scored |
| idempotency--natural-invitation-invariant | existing | natural-boundary:2, read-only:2 | 10/12 | 0/0 | scored |
| idempotency--bounded-webhook-edit | existing | actual-fix:2, order-and-result:2 | 12/12 | 0/0 | scored |
| idempotency--pure-get-backoff-nontrigger | existing | no-unneeded-protocol:2, read-only:2 | 8/8 | 0/0 | scored |
| infrastructure-change-safety--three-pod-rollout | existing | maintenance-accounting:2, admission-ownership:1, scope-and-evidence:2 | 2/4 | 0/0 | scored |
| infrastructure-change-safety--terraform-comment | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| legacy-code-changes--member-shipping-threshold | existing | intended-correction:2, minimal-boundary:2, read-only:2 | 12/12 | 0/0 | scored |
| legacy-code-changes--tested-helper-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| load-testing--closed-arrivals | existing | arrival-model:2, accounting:2, read-only:2 | 4/4 | 0/0 | scored |
| load-testing--unit-assertion | existing | nontrigger:2, read-only:1 | 4/4 | 0/0 | scored |
| mcp-engineering--private-resource-handle | existing | request-authority:2, pinned-contract:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| mcp-engineering--plain-json-rpc-helper | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| messaging-reliability--reordered-account-events | existing | reordering:2, dedup-effect:2, scope-and-evidence:2 | 2/4 | 0/0 | scored |
| messaging-reliability--local-observer-callback | existing | bounded-selection:0, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| microservice-boundaries--modular-monolith-fit | existing | preserve-simple-boundary:2, transaction-and-ownership:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-boundaries--single-function-refactor-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-data--saga-interleaving | existing | interleaving:2, isolation-gap:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-data--local-transaction-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-extraction--rollback-after-new-writes | existing | new-write-loss:2, one-write-authority:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-extraction--static-asset-copy-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-integration--mixed-version-response | existing | mixed-window:2, compatible-sequence:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-integration--local-json-pretty-print-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-operations--retry-amplification | existing | amplification:2, deadline-budget:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-operations--stylesheet-review-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-testing--unknown-api-consumers | existing | bounded-contract-evidence:2, breaking-change:2, read-only:2 | 4/8 | 0/0 | scored |
| microservice-testing--pure-unit-test-nontrigger | existing | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| overload-control--tenant-fanout | existing | budget-scope:2, fairness:2, ownership:2, read-only:2 | 4/4 | 0/0 | scored |
| overload-control--status-copy | existing | nontrigger:2, read-only:2 | 4/4 | 0/0 | scored |
| performance-diagnosis--held-pool | existing | constraint:2, ownership:2, read-only:2 | 4/4 | 0/0 | scored |
| performance-diagnosis--format-only | existing | nontrigger:0, read-only:2 | 4/4 | 0/0 | scored |
| python-backend--cancelled-export | existing | cancel-ownership:2, effect-uncertainty:0, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | scored |
| python-backend--notebook-list-expression | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| recovery-validation--restored-order-ledger | existing | business-reconciliation:2, recovery-identity:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| recovery-validation--backup-label | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| stream-processing-design--window-finality | existing | event-time-progress:2, late-policy:2, identity-revision-composition:2, independent-aggregate:2, scope-evidence:2 | 4/4 | 0/0 | scored |
| stream-processing-design--local-date-group-nontrigger | existing | nontrigger:0, scope-evidence:2 | 4/4 | 0/0 | scored |
| technical-deprecation--periodic-export-client | existing | consumer-evidence:2, replacement-contract:2, stage-and-ownership:2, prevent-new-adoption:2, removal-and-recovery-gates:2, scope-and-evidence:2 | 0/0 | 0/0 | scored |
| technical-deprecation--private-format-helper | existing | bounded-selection:2, bounded-removal:2, executed-verification:2, scope-and-evidence:2 | 0/0 | 0/0 | scored |
| typescript-backend--untrusted-command-body | existing | runtime-boundary:2, trusted-principal:2, scope-and-evidence:2, executed-verification:2 | 4/4 | 0/0 | scored |
| typescript-backend--stylesheet-spacing | existing | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| invocation-policy--positive-routing-conditional-specialists | focused |  | 2/4 | 0/0 | scored |
| invocation-policy--positive-routing-chain | focused |  | 2/4 | 0/0 | scored |
| invocation-policy--skill-tool-unavailable-fallback | focused | observable-behavior:0 | 0/0 | 0/0 | scored |
| invocation-policy--leading-word-not-policy-trigger | focused |  | 2/4 | 0/0 | scored |
| invocation-policy--source-provenance-preservation | focused | observable-behavior:2 | 0/0 | 0/0 | scored |
| invocation-policy--boundary-nontrigger-local-edit | focused |  | 2/4 | 0/0 | scored |
| invocation-policy--boundary-changed-tradeoff | focused |  | 4/4 | 0/0 | scored |
| graceful-draining--rolling-worker-drain | existing | failure-classification:2, admission-and-ownership:2, durable-handoff:2, scope-and-evidence:2 | 6/8 | 0/0 | scored |
| graceful-draining--shared-grace-budget | existing | shared-deadline:2, queue-admission:2, pdb-scope:2, scope-and-evidence:2 | 8/8 | 0/0 | scored |
| graceful-draining--handoff-ack-loss | existing | completed-replay:2, resource-fencing:2, atomic-progress-effects:2, scope-and-evidence:2 | 6/8 | 0/0 | scored |
| graceful-draining--deadline-and-outage | existing | unfinished-ack:2, deadline-budget:2, uncertain-outcomes:2, scope-and-evidence:2 | 8/8 | 0/0 | scored |
| graceful-draining--resume-mutable-input | existing | cursor-is-not-input:2, accepted-snapshot:2, retention-boundary:2, scope-and-evidence:2 | 8/8 | 0/0 | scored |
| concurrency-correctness--cache-fill-invalidation | existing | observable-contract:2, atomic-shared-ordering:2, scope:2 | 8/8 | 0/0 | scored |
| concurrency-correctness--sequential-file-transform | existing | correct-result:2, scope:2 | 4/4 | 0/0 | scored |
| temporal-ai-workflows--ai-graph-retry-and-budget | existing | graph-reexecution:2, durable-boundaries:2, stable-tool-effect:2, durable-budget:2, read-only:2 | 2/4 | 0/0 | scored |
| temporal-production-readiness--backlog-versus-vendor-quota | existing | capacity-bound:2, aggregate-control:2, read-only:2 | 8/8 | 0/0 | scored |
| temporal-reliability--payment-response-loss | existing | uncertain-charge:2, business-identity:2, read-only:2 | 6/8 | 0/0 | scored |
| temporal-reliability--calendar-temporal-nontrigger | existing | nontrigger:2, read-only:1 | 8/8 | 0/0 | scored |
| temporal-safe-deployments--replay-and-worker-retirement | existing | command-compatibility:2, compatible-routing:2, old-worker-retention:2, read-only:2 | 4/4 | 0/0 | scored |

Critical failure cases remain individually visible: go-backend--cancelled-fanout, messaging-reliability--local-observer-callback, performance-diagnosis--format-only, python-backend--cancelled-export, stream-processing-design--local-date-group-nontrigger, invocation-policy--skill-tool-unavailable-fallback.

Full quotes and reasons, earlier scores, scoring disagreements and all failed/partial grading attempts are preserved. Critical partials remain separate from passes. The six 14-case grader attempts timed out; subsequent three-case grading omitted six case rows, which were sent to fresh single-case graders. Earlier compact grading views omitted mixed skill/fixture read output wholesale, while initial fixtures and raw traces remained available; corrected adjudication views remove only exact candidate instruction bodies.

Only the native Codex host was executed. Claude Code routing is unexecuted. Native complete tool inventory, exact Skill-tool availability and global skill isolation were not independently proved. Successful content grades do not establish compliant activation or cross-host behavior. Exact backend model version and effective reasoning effort were not emitted by JSONL; no reasoning override was used. Existing corpus gaps and selected/unselected case coverage are retained in the matrix.

Evidence audit checked 771 quotes: 708 normalized literal matches; 60 quotes require manual evidence review. These unresolved quote/source gaps remain explicit and no independent score was silently changed.

Background cleanup nontrigger remains a conservative unmet gate: its trace directly reads the target skill despite the unchanged nontrigger criterion; fresh grade 2 conflicts with original 0. Go send-lifetime 0 is disputed because the changed receiver consumes both results before returning; this is an evaluator disagreement, not proof of an observed sender leak. Both grades and exact evidence remain retained.

Raw candidate, inputs, native responder and grader attempts, observable traces, fixture projects, verification logs and publication redaction receipts are in the [verified release asset](https://github.com/talvaknin744/tal-skills/releases/download/v1.0.0/tal-skills-phase5-final-2026-10-05.tar.zst). Archive SHA-256: `36b03e56813d688aa4c98ed1f0a7dc991738f77ed7d5a1e7ded50c93ef1055f6`.

Static validation: 545 tests passed, including the publication integrity check. Original protected retention: 967 records verified. Behavioral scores, actual activation, independent oracle reruns and host capability compliance are separate results; neither process exit nor static checks establish behavioral acceptance.

Existing positive cases received an explicit skill selection in runtime context while their original prompt text remained unchanged. They therefore assess the explicitly loaded candidate and do not establish normal automatic positive selection. Nontrigger and focused conditional cases used normal discovery. The runtime context, capability deviations and unchanged inputs are retained in the archive.
