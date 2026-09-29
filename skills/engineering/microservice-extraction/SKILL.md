---
name: microservice-extraction
description: Plan, review, or implement an incremental extraction from a monolith into a microservice. Use for migration seams, code/data separation, coexistence, and cutover recovery; exclude deciding service boundaries from scratch and ordinary deployments.
license: MIT
---

# Microservice extraction

Extract one capability through observable stages, keeping the existing business behavior usable while ownership moves. Judge progress by the migration's intended benefit, not by how much of the monolith disappears.

## 1. Bound the extraction

Identify the selected capability, expected benefit, consumers, invariants, and success measure. Inspect its entry points, scheduled jobs, database access, reporting consumers, and downstream effects. Include UI callers where their behavior changes. If the seam remains uncertain, resolve that uncertainty before committing to a detailed cutover.

Compare the proposed extraction with a smaller local change that could achieve the same goal. Preserve a requested extraction while reporting evidence that changes its feasibility. A plan or review stays analytical; an implementation request authorizes its scoped changes. Production cutover follows the user's actual authorization.

**Done:** the slice and its callers, readers, writers, constraints, and material unknowns are recorded.

## 2. Choose a migration sequence

Separate the code move from the data move. Choose their order from the dominant risk: code first can expose value sooner; data first can establish whether independence is feasible. Sketch both before starting either. Use an internal abstraction or routing seam that can direct the selected operation to its old or new implementation.

For each stage, state which implementation handles each caller, which store owns reads and writes, what remains shared, and what allows the next stage. Give temporary shared access an exit condition. Read [data-transition.md](references/data-transition.md) whenever state changes ownership, schema, or location.

**Done:** every stage has a single declared authority for each mutable record, a transition condition, and a recovery path. Code running in another process alone does not complete data separation.

## 3. Design coexistence and recovery

Preserve contracts for callers that upgrade at different times. Explain how routing, configuration, schema changes, background workers, and in-flight work behave during overlap. For shadow or parallel execution, arrange comparison without repeating customer-visible effects.

Read [cutover.md](references/cutover.md) to define validation, rollout, and recovery. Distinguish reverting a binary or route from recovering data. Once the new owner has accepted writes, returning traffic to an old copy requires a demonstrated reconciliation path; otherwise use a forward repair or an explicit bounded pause.

**Done:** failure before and after ownership transfer has a known authoritative state, a recovery action, and an observable outcome. Irreversible effects have an explicit treatment.

## 4. Execute or deliver the next stage

For implementation, make the smallest authorized stage and run relevant existing checks plus regressions for its compatibility and interruption risks. Rehearse data changes on disposable data or an authorized environment. Keep later stages as a concrete plan when they exceed the request.

For planning or review, provide the stage sequence, ownership transitions, validation gates, stop conditions, and unresolved decisions. Mark rehearsals and production observations as proposed until performed. Consult [sources.md](references/sources.md) when verifying book attribution or the difference between editions.

**Done:** the requested stage is verified or its evidence gap is explicit. A completed extraction also requires obsolete routes and writers to be retired after the recovery window, an accountable service owner, and evidence that the original goal improved.
