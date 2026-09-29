---
name: pragmatic-programming
description: Improve changeability when a policy change fans out, unrelated modules move together, a dependency is hard to replace, or an uncertain feature needs a prototype or tracer bullet. Use for these design and refactoring decisions; exclude routine fixes with settled design.
license: MIT
---

# Pragmatic programming

Make a concrete next change cheaper and expose uncertain assumptions early. Apply the relevant branch to the requested scope; a review produces findings, a design produces a proposal, and an implementation changes the authorized slice.

## 1. Choose the change to test

Read the affected behavior, callers, tests, and relevant change history. Select a requested or evidenced likely change: revising a rule, replacing a dependency, or connecting an unfamiliar integration. Name the behavior that must survive and the uncertainty that could invalidate the approach. Respect delivery constraints and existing technology choices.

**Done:** one representative change has an observable outcome and identified constraints; speculation is labeled as an assumption.

## 2. Locate knowledge and dependencies

Trace that change through code, configuration, stored data, generated artifacts, and documentation where relevant. Identify which representations express the same rule and who owns it. Similar syntax may express independently changing policies; sharing it can create coupling. Treat derived data as a consistency obligation, with an explicit authority and refresh mechanism.

For duplicated rules, shared helpers, or changes spreading into unrelated modules, read [changeability.md](references/changeability.md). Walk the change through the current boundaries and distinguish necessary collaboration from knowledge of another component's internals.

**Done:** every representation affected by this change has an authority or an explicit unresolved ownership decision, and each proposed boundary addresses observed coupling.

## 3. Preserve a useful option

Choose the smallest intervention that localizes the selected change: an owned rule, generated representation, narrower interface, or isolated dependency. Compare its ongoing complexity with the cost it removes. Introduce indirection for a credible variation; extra interfaces and universal frameworks require their own evidence.

Describe how to replace or undo the decision. Include callers, persisted formats, external effects, and migration costs when affected. A code revert alone cannot restore incompatible data or reverse an external action. Keep remaining commitments visible rather than promising cost-free substitution.

**Done:** the proposal names what becomes easier to change, its present cost, and a workable reversal path or explicitly accepted limit.

## 4. Get feedback at the uncertain boundary

When a fact is unresolved, choose an experiment that can change the decision. Read [experiments.md](references/experiments.md) for disposable prototypes, retained tracer bullets, and representative performance checks. State the question, smallest useful scope, observation, and decision threshold before building. Use project targets or label proposed thresholds.

A known, bounded refactoring can proceed using existing behavioral checks. A new experiment earns its cost by resolving a material uncertainty.

**Done:** the uncertainty is answered with observed evidence, or an unexecuted experiment has a concrete acceptance condition and next action.

## 5. Verify locality and behavior

For implementation, establish relevant behavior checks, restructure in small steps, and verify before adding changed behavior. Test the affected rule and integration boundary, including a meaningful failure or boundary case. Compare actual touched dependencies with the intended locality; a passing isolated test alone cannot establish an integration claim.

Finish with the decision or changed slice, evidence, remaining commitment, and checks actually run. For attribution or edition questions, consult [sources.md](references/sources.md).

**Done:** the selected behavior and changeability claim are demonstrated or explicitly unverified, and remaining gaps have a specific validation step.
