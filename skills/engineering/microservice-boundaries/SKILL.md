---
name: microservice-boundaries
description: Choose or review microservice boundaries, assess a proposed service split, or diagnose a distributed monolith's coupling. Use for business capability decomposition and service ownership; exclude routine module refactoring and general architecture reviews.
license: MIT
---

# Microservice boundaries

Choose boundaries that let useful changes ship independently. Treat a service as an owned business capability with a contract and state, rather than a target size or a separate process for every entity.

## 1. Establish the reason to split

Identify the outcome: independent release, selective scaling, failure isolation, or clearer ownership. Read the relevant use cases, change history, dependency paths, and deployment constraints. Separate an observed bottleneck from an assumed benefit. Consider an in-process module or a coarser service when it could achieve the same outcome with less coordination.

Match the requested mode: a review yields findings; a design yields a boundary proposal; an authorized implementation changes only the selected slice. Preserve a user-mandated topology while explaining material tradeoffs.

**Done:** the decision has a concrete goal, evidence or an explicit assumption, and a condition for judging improvement. Service count alone is not that condition.

## 2. Map capabilities and invariants

Trace representative business changes from entry point through rules, state transitions, storage, and downstream effects. Name each capability in the domain's language. Distinguish a bounded context's internal model from the information it exposes. Similar names in different contexts need not imply one shared model.

For each candidate boundary, record its responsibility, commands or events, authoritative state, invariants, and owner. Keep one aggregate's lifecycle under one owner; several aggregates may share a service. A bounded context suggests a cohesive boundary, not a compulsory one-to-one mapping to deployments. Mark shared writes and cross-boundary transactions for explicit resolution.

**Done:** every capability and invariant affected by this decision has a proposed home, and contested ownership is visible.

## 3. Test independence

Walk a representative change through each candidate design. Count the components, teams, contracts, and releases that must move together. Trace a dependency outage as well as a successful call. Distinguish necessary business collaboration from exposure of another service's internals.

When a split introduces network calls or existing services repeatedly change together, use [coupling.md](references/coupling.md) to test the seam. When ownership, team alignment, or shared platforms drive the decision, read [ownership.md](references/ownership.md). Read only the relevant branch.

Compare credible options against the stated goal: retain a module, combine tightly coupled capabilities, or extract a service. Evaluate remote joins, latency, consistency, operational burden, and the ability to reverse a mistaken boundary. Keep strong atomic invariants together unless a concrete alternative preserves the required business behavior.

**Done:** each candidate has an evidenced benefit, its dominant cost, and a change or failure scenario that could invalidate it.

## 4. Recommend a bounded next step

Give the chosen boundary map, public responsibilities, data ownership, and the reason it beats the alternatives. Identify the smallest experiment that could disprove the recommendation: isolate a module, measure a call path, or demonstrate an independent release. Specify the observation and pass/fail condition; use thresholds supplied by the project or label proposed targets.

For implementation, verify the selected seam with the project's relevant checks. For design or review, keep unexecuted experiments explicit. Source provenance and edition differences are in [sources.md](references/sources.md); consult it when attribution matters.

**Done:** every proposed boundary has an owner and contract, every material coupling has a treatment or unresolved decision, and the next step tests the claimed benefit.
