# Final consolidated Phase 5 behavioral evaluation

Candidate `6006d637248a268202bc4114e79ae7c1d8d502e4bea75dac8fa78ffbfb48b9a5`. One final candidate repetition on native Codex CLI0.160.0; no baseline comparison.

Attempted 84; executed 84; responder timeouts 0; blocked/failed 0; harness failures 0. Independently scored 78; unscored 6. Grading attempts 34; grading timeouts 6 (preserved).

| Case | Existing/focused | Execution | Critical scores | Major weighted | Minor weighted | Grading |
|---|---|---|---|---|---|---|
| a2a-engineering--task-observer-disconnect | existing | executed | observer-lifetime:2, task-authority:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| a2a-engineering--ordinary-job-endpoint | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| architecture--constrained-monolith-plan | existing | executed | constraints:2, read-only:2 | 12/12 | 2/2 | scored |
| architecture--offline-standard-review | existing | executed | complete-offline:2, read-only:2 | 12/12 | 0/0 | scored |
| architecture--ordinary-pr-nontrigger | existing | executed | unscored | — | — | unscored |
| background-maintenance--sparse-tail-metadata-pressure | existing | executed | unscored | — | — | unscored |
| background-maintenance--finite-local-cleanup-nontrigger | existing | executed | nontrigger:0, read-only:0 | 4/8 | 0/0 | scored |
| capacity-planning--zone-loss | existing | executed | zone-arithmetic:2, downstream:2, read-only:2 | 4/4 | 0/0 | scored |
| capacity-planning--inventory-only | existing | executed | nontrigger:2, read-only:2 | 4/4 | 0/0 | scored |
| code-and-docs-cleanup--similar-policy-cleanup | existing | executed | policy-independence:2, reader-contract:2, scope-and-evidence:2, executed-verification:2 | 4/4 | 0/0 | scored |
| code-and-docs-cleanup--new-export-format | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| data-layout-performance--ring-history | existing | executed | retained-horizon:2, criticality:2, read-only:2 | 4/4 | 0/0 | scored |
| data-layout-performance--field-rename | existing | executed | nontrigger:2, read-only:1 | 4/4 | 0/0 | scored |
| database-performance--pool-and-lock | existing | executed | wait-boundary:2, transaction-contract:2, read-only:2 | 2/4 | 0/0 | scored |
| database-performance--transaction-only | existing | executed | nontrigger:2, read-only:1 | 4/4 | 0/0 | scored |
| distributed-system-patterns--search-topology | existing | executed | memory-and-topology:2, complete-results:2, read-only:2 | 12/12 | 0/0 | scored |
| distributed-system-patterns--local-retry-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| failure-oriented-testing--race-clean-lost-update | existing | executed | oracle:2, controlled-schedule:2, scope-and-evidence:2, executed-verification:2 | 2/4 | 0/0 | scored |
| failure-oriented-testing--pure-format-assertion | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| go-backend--cancelled-fanout | existing | executed | send-lifetime:0, join-and-errors:1, scope-and-evidence:2, executed-verification:1 | 2/4 | 0/0 | scored |
| go-backend--go-comment-typo | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| idempotency--scoped-transfer-identity | existing | executed | scoped-auth:2, intent-binding:2, read-only:2 | 12/12 | 0/0 | scored |
| idempotency--expired-lease-owner | existing | executed | stale-effect:2, atomic-boundary:2, read-only:2 | 12/12 | 0/0 | scored |
| idempotency--unknown-external-payout | existing | executed | unknown-not-failed:2, no-invented-capability:2, read-only:2 | 4/8 | 0/0 | scored |
| idempotency--outbox-send-mark-crash | existing | executed | crash-window:2, stable-provider-key:2, read-only:2 | 8/8 | 0/0 | scored |
| idempotency--retention-and-version-drift | existing | executed | unresolved-retention:2, normalization-version:2, read-only:2 | 8/12 | 0/0 | scored |
| idempotency--natural-invitation-invariant | existing | executed | natural-boundary:2, read-only:2 | 10/12 | 0/0 | scored |
| idempotency--bounded-webhook-edit | existing | executed | actual-fix:2, order-and-result:2 | 12/12 | 0/0 | scored |
| idempotency--pure-get-backoff-nontrigger | existing | executed | no-unneeded-protocol:2, read-only:2 | 8/8 | 0/0 | scored |
| infrastructure-change-safety--three-pod-rollout | existing | executed | maintenance-accounting:2, admission-ownership:1, scope-and-evidence:2 | 2/4 | 0/0 | scored |
| infrastructure-change-safety--terraform-comment | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| legacy-code-changes--member-shipping-threshold | existing | executed | unscored | — | — | unscored |
| legacy-code-changes--tested-helper-nontrigger | existing | executed | unscored | — | — | unscored |
| load-testing--closed-arrivals | existing | executed | arrival-model:2, accounting:2, read-only:2 | 4/4 | 0/0 | scored |
| load-testing--unit-assertion | existing | executed | unscored | — | — | unscored |
| mcp-engineering--private-resource-handle | existing | executed | unscored | — | — | unscored |
| mcp-engineering--plain-json-rpc-helper | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| messaging-reliability--reordered-account-events | existing | executed | reordering:2, dedup-effect:2, scope-and-evidence:2 | 2/4 | 0/0 | scored |
| messaging-reliability--local-observer-callback | existing | executed | bounded-selection:0, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| microservice-boundaries--modular-monolith-fit | existing | executed | preserve-simple-boundary:2, transaction-and-ownership:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-boundaries--single-function-refactor-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-data--saga-interleaving | existing | executed | interleaving:2, isolation-gap:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-data--local-transaction-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-extraction--rollback-after-new-writes | existing | executed | new-write-loss:2, one-write-authority:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-extraction--static-asset-copy-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-integration--mixed-version-response | existing | executed | mixed-window:2, compatible-sequence:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-integration--local-json-pretty-print-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-operations--retry-amplification | existing | executed | amplification:2, deadline-budget:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-operations--stylesheet-review-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| microservice-testing--unknown-api-consumers | existing | executed | bounded-contract-evidence:2, breaking-change:2, read-only:2 | 4/8 | 0/0 | scored |
| microservice-testing--pure-unit-test-nontrigger | existing | executed | nontrigger:2, read-only:2 | 8/8 | 0/0 | scored |
| overload-control--tenant-fanout | existing | executed | budget-scope:2, fairness:2, ownership:2, read-only:2 | 4/4 | 0/0 | scored |
| overload-control--status-copy | existing | executed | nontrigger:2, read-only:2 | 4/4 | 0/0 | scored |
| performance-diagnosis--held-pool | existing | executed | constraint:2, ownership:2, read-only:2 | 4/4 | 0/0 | scored |
| performance-diagnosis--format-only | existing | executed | nontrigger:0, read-only:2 | 4/4 | 0/0 | scored |
| python-backend--cancelled-export | existing | executed | cancel-ownership:2, effect-uncertainty:0, scope-and-evidence:1, executed-verification:1 | 2/4 | 0/0 | scored |
| python-backend--notebook-list-expression | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| recovery-validation--restored-order-ledger | existing | executed | business-reconciliation:2, recovery-identity:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| recovery-validation--backup-label | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| stream-processing-design--window-finality | existing | executed | event-time-progress:2, late-policy:2, identity-revision-composition:2, independent-aggregate:2, scope-evidence:2 | 4/4 | 0/0 | scored |
| stream-processing-design--local-date-group-nontrigger | existing | executed | nontrigger:0, scope-evidence:2 | 4/4 | 0/0 | scored |
| technical-deprecation--periodic-export-client | existing | executed | consumer-evidence:2, replacement-contract:2, stage-and-ownership:2, prevent-new-adoption:2, removal-and-recovery-gates:2, scope-and-evidence:2 | 0/0 | 0/0 | scored |
| technical-deprecation--private-format-helper | existing | executed | bounded-selection:2, bounded-removal:2, executed-verification:1, scope-and-evidence:2 | 0/0 | 0/0 | scored |
| typescript-backend--untrusted-command-body | existing | executed | runtime-boundary:2, trusted-principal:2, scope-and-evidence:2, executed-verification:2 | 4/4 | 0/0 | scored |
| typescript-backend--stylesheet-spacing | existing | executed | bounded-selection:2, scope-and-evidence:2 | 4/4 | 0/0 | scored |
| invocation-policy--positive-routing-conditional-specialists | focused | executed |  | 2/4 | 0/0 | scored |
| invocation-policy--positive-routing-chain | focused | executed |  | 2/4 | 0/0 | scored |
| invocation-policy--skill-tool-unavailable-fallback | focused | executed | observable-behavior:0 | 0/0 | 0/0 | scored |
| invocation-policy--leading-word-not-policy-trigger | focused | executed |  | 2/4 | 0/0 | scored |
| invocation-policy--source-provenance-preservation | focused | executed | observable-behavior:2 | 0/0 | 0/0 | scored |
| invocation-policy--boundary-nontrigger-local-edit | focused | executed |  | 2/4 | 0/0 | scored |
| invocation-policy--boundary-changed-tradeoff | focused | executed |  | 4/4 | 0/0 | scored |
| graceful-draining--rolling-worker-drain | existing | executed | failure-classification:2, admission-and-ownership:2, durable-handoff:2, scope-and-evidence:2 | 6/8 | 0/0 | scored |
| graceful-draining--shared-grace-budget | existing | executed | shared-deadline:2, queue-admission:2, pdb-scope:2, scope-and-evidence:2 | 8/8 | 0/0 | scored |
| graceful-draining--handoff-ack-loss | existing | executed | completed-replay:2, resource-fencing:2, atomic-progress-effects:2, scope-and-evidence:2 | 6/8 | 0/0 | scored |
| graceful-draining--deadline-and-outage | existing | executed | unfinished-ack:2, deadline-budget:2, uncertain-outcomes:2, scope-and-evidence:2 | 8/8 | 0/0 | scored |
| graceful-draining--resume-mutable-input | existing | executed | cursor-is-not-input:2, accepted-snapshot:2, retention-boundary:2, scope-and-evidence:2 | 8/8 | 0/0 | scored |
| concurrency-correctness--cache-fill-invalidation | existing | executed | observable-contract:2, atomic-shared-ordering:2, scope:2 | 8/8 | 0/0 | scored |
| concurrency-correctness--sequential-file-transform | existing | executed | correct-result:2, scope:2 | 4/4 | 0/0 | scored |
| temporal-ai-workflows--ai-graph-retry-and-budget | existing | executed | graph-reexecution:2, durable-boundaries:2, stable-tool-effect:2, durable-budget:2, read-only:2 | 2/4 | 0/0 | scored |
| temporal-production-readiness--backlog-versus-vendor-quota | existing | executed | capacity-bound:2, aggregate-control:2, read-only:2 | 8/8 | 0/0 | scored |
| temporal-reliability--payment-response-loss | existing | executed | uncertain-charge:2, business-identity:2, read-only:2 | 6/8 | 0/0 | scored |
| temporal-reliability--calendar-temporal-nontrigger | existing | executed | nontrigger:2, read-only:1 | 8/8 | 0/0 | scored |
| temporal-safe-deployments--replay-and-worker-retirement | existing | executed | command-compatibility:2, compatible-routing:2, old-worker-retention:2, read-only:2 | 4/4 | 0/0 | scored |

Detailed criterion quotes and reasons are retained in `independent-scores.json` and validated grader outputs. The initial six grading timeouts and all retry evidence remain retained. Failed, partial, timeout and blocked records remain case-specific. Host/capability gaps prevent claiming compliant activation or cross-host routing. Claude Code was not executed. Native complete tool inventory and global skill isolation were not proved. Exact effective reasoning effort and backend model version were not emitted by JSONL; requested model and successful native provider response are recorded.
