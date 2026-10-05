---
name: object-design-patterns
description: Choose, apply, or review object-oriented design patterns when behavior varies, object lifecycles are tangled, or interfaces couple clients to implementations. Use for explicit pattern selection and refactoring inheritance, state-dependent behavior, wrappers, or object creation; exclude routine local edits without a design decision.
license: MIT
---

# Object design patterns

Make a concrete change easier by isolating the part that varies. A pattern is a candidate design with costs, and leaving a simple design intact is a valid outcome. Use the project's language and existing abstractions.

## 1. Establish the design pressure

Read the affected code, callers, tests, and requested change. Locate repeated decisions, incompatible interfaces, inheritance obligations, or construction knowledge that makes the change spread. Name the stable behavior and the specific dimension that varies, supported by current requirements or credible upcoming work.

Honor the task mode: a review supplies findings; a design supplies a proposal; an implementation request authorizes the scoped refactor. Complete this step with a concrete before/after scenario, affected clients, and the behavior those clients must retain. When no recurring design pressure exists, recommend the local solution and finish the requested task.

## 2. Compare the smallest alternatives

Compare the existing design or a simple function, conditional, or data table with the closest pattern candidate. Use intent and constraints to choose, rather than class-diagram resemblance. Read only the relevant branch:

- For interchangeable behavior, lifecycle transitions, notifications, or deferred requests, read [behavior-and-state.md](references/behavior-and-state.md).
- For interface translation, composable responsibilities, subsystem access, or object trees, read [structure-and-interfaces.md](references/structure-and-interfaces.md).
- For concrete construction dependencies, compatible product families, or instance lifetime, read [construction.md](references/construction.md).

Prefer composition for independently varying behavior. Inheritance remains an option when every subtype can honor the base contract and the shared algorithm is intentional. Complete the comparison by naming the dependency removed, added indirection and ownership, and the concrete requirement that justifies them. If a pattern adds more burden than it removes, retain or simplify the existing design.

## 3. Define the collaboration contract

Map pattern roles to existing domain names. Specify what each participant owns, how collaborators are selected and supplied, and which component may change state. Follow the observable call path through the proposed boundary, including relevant errors and side effects.

Substitutability includes accepted inputs, return meanings, failure behavior, ordering, and mutation; matching method signatures alone is insufficient. Keep concrete type checks and casts out of clients that should depend on the shared contract. Express the design with a short responsibility map or code sketch, using native functions, protocols, or modules where appropriate. This step is complete when a client can use each proposed variant without knowing its implementation and the expected outcome is stated.

## 4. Preserve behavior and demonstrate the change

For implementation, characterize affected behavior and refactor incrementally in the existing test framework. Demonstrate the requested variant or transition and a relevant invalid or boundary case. Select additional probes from the branch reference; test observable outcomes instead of class names. For review or design, describe these checks and mark any unexecuted validation clearly.

Trace the representative change again: identify which code changes now and which clients remain stable. Remove transitional duplication and unused abstractions introduced by the refactor. Finish with the decision and its tradeoff, changed files or concrete findings, checks actually run, and any material unresolved contract. Completion requires evidence for preserved behavior and the requested variation, or an explicit validation gap with its next check.

For the book edition, verified chapter locations, and the boundary between source ideas and original probes, read [sources.md](references/sources.md).
