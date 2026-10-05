---
name: microservice-data
description: Design or review service data ownership, cross-service invariants, sagas, or reporting projections. Use for shared-table splits and cross-service transactions or joins; exclude single-database tuning and retry deduplication.
license: MIT
---

# Microservice Data

**ownership ledger:** An ownership ledger names who can change each business fact and how others observe it.

Make ownership, consistency, and recovery explicit for the requested business operation. A review stays read-only; a design supplies an actionable model; implementation changes the scoped code and tests. Apply the relevant branches below without turning a narrow fix into a service redesign or a production migration.

**Example:** For an order status write, identify the owning service, database constraint, and any other service that reads or changes it.

## 1. Map the data and its owners

Trace the affected reads, writes, transactions, constraints, and external effects. Assign authority over each mutable concept and its valid transitions to an owner. Distinguish authoritative records from copies used for reading. Inspect shared tables for a missing domain owner or distinct concepts accidentally stored together; a separate database per service alone does not establish useful ownership.

**Done:** every affected write and constraint has an owner, and each cross-owner access is identified from code or explicitly marked unknown.

**Example:** State whether a payment-pending order is an allowed intermediate state and how long it may remain there.

## 2. State the invariants

Write what must always hold and what may temporarily lag, using observable business outcomes. For each cross-service rule, specify the allowed intermediate state, acceptable duration, and behavior when convergence fails. A lost response can leave an outcome uncertain even when the remote write succeeded.

Preserve local transactions where they protect an invariant. If a rule genuinely needs indivisible updates, first examine whether the affected state belongs within one owner. A saga preserves recoverable workflow state; it does not supply whole-process atomicity. Assess an existing distributed transaction by its actual blocking, failure, and recovery guarantees before proposing a replacement.

**Done:** each invariant is enforced locally or has explicit distributed semantics; unresolved business policy is a named decision rather than an invented guarantee.

**Example:** A shipment saga can retry or compensate a reservation, but must name the durable state and owner that advances it.

## 3. Model distributed changes

For a workflow spanning multiple owners, read [workflows.md](references/workflows.md). Describe durable states and transitions, local commit points, and what advances or repairs the process. Choose orchestration, choreography, or a mix using ownership and the ability to understand progress. Keep service-local decisions with the data owner.

For a shared-table split, identify the original invariant before replacing each foreign key, uniqueness check, or transaction. An API lookup followed by a write is not equivalent to an atomic database constraint. Retain meaningful history when referenced objects change or disappear.

**Done:** every affected partial outcome has a valid next state, a responsible actor, and a way to discover stalled work; read-only changes may mark this branch inapplicable.

**Example:** For a reporting query, state its source, maximum acceptable lag, and what the caller sees when the projection is stale.

## 4. Design the read path

For cross-service joins, reporting, or copied state, read [projections.md](references/projections.md). Select direct queries, aggregation, or a projection using freshness, latency, volume, and availability requirements. Keep copies distinguishable from authoritative state. Explain what a user sees while a write has committed but a read model has not caught up.

When parallel workers publish independent results and a completion index, read
[result publication](references/result-publication.md) for mutation scope and
reader-visible readiness.

**Done:** each affected read identifies its source of truth, freshness contract, and missing/stale-data behavior; new projections also have a bootstrap and repair path.

**Example:** Interrupt after local commit and check whether the durable workflow state identifies the next recovery action.

## 5. Verify convergence and failure

Build scenarios around the affected boundaries: local commit before downstream failure, uncertain response, concurrent requests against the same invariant, failed compensation, or a lagging projection. Select those the actual design admits. For implementation, add meaningful regressions and run the relevant checks in the existing framework; use local substitutes or an authorized sandbox for effects.

**Done:** provide the ownership and state model, changed files or evidence-backed findings, and checks actually run. Each claimed invariant and recovery outcome is demonstrated or explicitly unverified with a next validation step. The conceptual basis and independently authored verification guidance are distinguished in [sources.md](references/sources.md).
