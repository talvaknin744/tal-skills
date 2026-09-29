---
name: microservice-data
description: Design or review data ownership across services, cross-service invariants and sagas, or reporting and query projections over service-owned data. Use when splitting shared tables or replacing cross-service transactions and joins; exclude single-database tuning and single-operation retry deduplication.
license: MIT
---

# Microservice Data

Make ownership, consistency, and recovery explicit for the requested business operation. A review stays read-only; a design supplies an actionable model; implementation changes the scoped code and tests. Apply the relevant branches below without turning a narrow fix into a service redesign or a production migration.

## 1. Map the data and its owners

Trace the affected reads, writes, transactions, constraints, and external effects. Assign authority over each mutable concept and its valid transitions to an owner. Distinguish authoritative records from copies used for reading. Inspect shared tables for a missing domain owner or distinct concepts accidentally stored together; a separate database per service alone does not establish useful ownership.

**Done:** every affected write and constraint has an owner, and each cross-owner access is identified from code or explicitly marked unknown.

## 2. State the invariants

Write what must always hold and what may temporarily lag, using observable business outcomes. For each cross-service rule, specify the allowed intermediate state, acceptable duration, and behavior when convergence fails. A lost response can leave an outcome uncertain even when the remote write succeeded.

Preserve local transactions where they protect an invariant. If a rule genuinely needs indivisible updates, first examine whether the affected state belongs within one owner. A saga preserves recoverable workflow state; it does not supply whole-process atomicity. Assess an existing distributed transaction by its actual blocking, failure, and recovery guarantees before proposing a replacement.

**Done:** each invariant is enforced locally or has explicit distributed semantics; unresolved business policy is a named decision rather than an invented guarantee.

## 3. Model distributed changes

For a workflow spanning multiple owners, read [workflows.md](references/workflows.md). Describe durable states and transitions, local commit points, and what advances or repairs the process. Choose orchestration, choreography, or a mix using ownership and the ability to understand progress. Keep service-local decisions with the data owner.

For a shared-table split, identify the original invariant before replacing each foreign key, uniqueness check, or transaction. An API lookup followed by a write is not equivalent to an atomic database constraint. Retain meaningful history when referenced objects change or disappear.

**Done:** every affected partial outcome has a valid next state, a responsible actor, and a way to discover stalled work; read-only changes may mark this branch inapplicable.

## 4. Design the read path

For cross-service joins, reporting, or copied state, read [projections.md](references/projections.md). Select direct queries, aggregation, or a projection using freshness, latency, volume, and availability requirements. Keep copies distinguishable from authoritative state. Explain what a user sees while a write has committed but a read model has not caught up.

**Done:** each affected read identifies its source of truth, freshness contract, and missing/stale-data behavior; new projections also have a bootstrap and repair path.

## 5. Verify convergence and failure

Build scenarios around the affected boundaries: local commit before downstream failure, uncertain response, concurrent requests against the same invariant, failed compensation, or a lagging projection. Select those the actual design admits. For implementation, add meaningful regressions and run the relevant checks in the existing framework; use local substitutes or an authorized sandbox for effects.

**Done:** provide the ownership and state model, changed files or evidence-backed findings, and checks actually run. Each claimed invariant and recovery outcome is demonstrated or explicitly unverified with a next validation step. The conceptual basis and independently authored verification guidance are distinguished in [sources.md](references/sources.md).
