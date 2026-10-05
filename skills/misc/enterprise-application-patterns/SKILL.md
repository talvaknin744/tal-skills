---
name: enterprise-application-patterns
description: Choose or evolve enterprise domain-logic structure, relational persistence mapping, and application transaction boundaries. Use for Transaction Script versus Domain Model or Table Module, object persistence responsibilities, and edits spanning multiple requests; exclude service decomposition, query tuning alone, and presentation-only changes.
license: MIT
---

# Enterprise Application Patterns

Fit the application's structure to its business rules, data shape, and change pressures. A review supplies evidence and recommendations; a design supplies a concrete arrangement; implementation changes the requested slice and relevant tests. Use existing framework capabilities before adding infrastructure. Apply persistence and concurrency branches where the request or traced behavior makes them relevant; mark other branches inapplicable.

## 1. Trace one business operation

Follow the affected entry points through calculations, validation, reads, writes, and result construction. Include another operation sharing the same rules when reuse drives the request. Locate the authoritative rule, the current persistence responsibility, and the transaction boundary. Separate a business operation spanning user interactions from any one database transaction.

Collect actual change pressure: repeated conditional logic, inconsistent validation, object/table mismatch, stale edits, or tangled save ordering. Code size and the label “enterprise” do not establish domain complexity.

**Done:** the affected rules, data, callers, and commit points are located in evidence; unknown requirements are explicit.

## 2. Select the domain-logic structure

Read [domain-logic.md](references/domain-logic.md) when choosing between Transaction Script, Domain Model, and Table Module or relocating business behavior. Compare the cost of the next representative rule change with the cost of introducing the structure. Retain adequate scripts; use richer behavior and relationships where their reuse justifies them; consider table modules when the application already works naturally with record sets.

Apply the choice to the affected slice. Distinct parts of an application may use different approaches. Introduce an application boundary when callers need coordinated operations, and identify which rules remain within domain objects versus orchestration.

**Done:** the recommendation identifies where each affected rule will live, one plausible alternative, and the concrete pressure that favors the choice.

## 3. Match persistence to the model

For mapping, object identity, load behavior, or save coordination, read [persistence.md](references/persistence.md). Trace how a representative object or record set is loaded, changed, and saved. Choose persistence responsibilities from the actual mismatch between application state and stored data. An existing mapper or unit of work may already implement the needed mechanism.

State who tracks changes and orders writes, and the lifetime in which repeated loads represent the same object. Inspect query behavior where traversing relationships or rendering a result triggers additional loads. Keep the mapping decision separate from adopting a particular ORM.

**Done:** every affected load and write has an owner, with identity scope, flush behavior, and database commit behavior distinguished.

## 4. Protect the business operation

For writes, concurrent editing, or multi-request workflows, read [transactions.md](references/transactions.md). State the invariant and the database transaction protecting it. Where user interaction separates reading from saving, choose a conflict policy covering that whole interval. Identify all paths that can change protected data.

Separate temporary edit state from committed business state. Define how a stale submission, failed save, or abandoned edit is handled. Resolve business choices that affect correctness without expanding the request into a presentation or session redesign.

**Done:** a concurrent schedule and a failed-save schedule have explicit outcomes; conflict detection and protected writes share an enforceable boundary.

## 5. Demonstrate the decision

Specify concrete inputs and expected decisions, values, or invariant relationships for a representative rule change, persistence round trip, or competing-edit/rollback case. Exercise shared rules through each affected entrypoint. Use supplied business rules; label illustrative assumptions and unresolved expectations. Implementations run relevant regressions; reviews and designs deliver these scenarios as an unexecuted validation specification.

**Done:** deliver the chosen structure, evidence or changed files, tradeoffs, and checks actually run. Mark unverified framework guarantees and give the next validation step. [Sources and attribution](references/sources.md) distinguish the book's concepts from this independently authored workflow.
