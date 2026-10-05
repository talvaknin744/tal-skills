---
name: python-backend
description: Implement or review Python backend services when async cancellation, transactions, resource ownership, or mutable request state can change correctness; exclude pure local calculations.
---

# Python backend

Each task and resource needs an owner for its completion and cleanup. Make the requested Python change while preserving its observable effects and cleanup contract. Keep a pure local calculation small; this skill does not require adding a service framework.

1. **Find the boundary.** Inspect the supported Python version, installed driver, request entrypoint, transaction owner, and existing checks. State the accepted input, durable effect, and result or failure before editing. Finish when each effect has one named owner.
2. **Choose the relevant branch.** For concurrent tasks, cancellation, generators, or pooled connections, read [async ownership](references/async-ownership.md). For transactions, retry identity, or database-backed invariants, read [transaction outcomes](references/transaction-outcomes.md). Keep the project's established abstractions when they express the required contract.
3. **Implement the narrow change.** Validate at the untrusted boundary; distinguish Python booleans from numeric quantities where the contract requires it. Initialize mutable defaults per call and make mutation of caller-owned objects explicit. Preserve valid zero and empty results instead of treating truthiness as success. Use wrapper metadata when decorating public callables, while preserving their async behavior separately.
For cancellation or a lost response around an external write, preserve the accepted operation IDs separately from request failure. Cleanup proves that owned work stopped; it does not prove remote rollback. Reconcile those IDs through the provider's actual supported evidence before retrying. If no reconciliation or deduplication contract is supplied, name that gap and keep the remote outcome unresolved.

4. **Prove the failure path.** Exercise the interleaving or cancellation that could violate the contract using owned tasks and explicit gates. Observe persisted state through another connection when claiming database behavior. Run the repository's actual type/lint/test commands; an annotation is not runtime validation. Finish when the changed behavior and resource state are observed, or identify the exact untested boundary.

Report the behavior changed, the executed scenarios, and remaining limits. For a canceled external write, state the preserved operation IDs, observed effects, and the reconciliation needed before retry; distinguish a passing cleanup test from an unverified retry guarantee. Cross-process idempotency, replica consistency, durable handoff, and recovery need their own explicit contracts; installing this skill alone does not supply them.

For source editions and the precise reading scope behind this guidance, read [sources](references/sources.md).

When a business effect needs duplicate-safe retries, hand off to the `idempotency` skill. When shared-state invariants are in scope, hand off to the `concurrency-correctness` skill. If `idempotency` or `concurrency-correctness` is not installed, continue with this skill's local guidance, leave conclusions specific to the missing sibling unresolved, and do not guarantee its outcomes.