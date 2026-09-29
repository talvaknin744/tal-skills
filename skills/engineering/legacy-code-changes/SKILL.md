---
name: legacy-code-changes
description: Change or assess untested legacy code using characterization tests and minimal dependency isolation. Use when missing behavioral coverage makes a requested change risky or constructors, globals, or hidden collaborators obstruct testing; exclude greenfield work and routine changes already covered by focused tests.
license: MIT
---

# Legacy Code Changes

Make the requested change observable while preserving the surrounding behavior. Work outward from the code that must change; the age or appearance of a codebase does not determine how much work it needs.

## 1. Bound the change

Read the affected entrypoint, its callers, its outputs and side effects, and the available tests. Identify the behavior the user wants to change and the neighboring behavior that must remain. Distinguish a review or plan from authorized implementation; a review supplies concrete evidence and a proposed test boundary without editing files.

Find the existing build and test commands. Record the baseline result when executable, including failures that predate the task. This step is complete when the requested difference, affected path, and missing feedback are explicit; whole-system coverage is not a prerequisite.

## 2. Characterize reachable behavior

Choose the smallest existing interface through which the affected behavior can be exercised and observed. Capture actual outputs, state transitions, or meaningful collaborator interactions for representative inputs and the boundaries touched by the change. A characterization test records what happens today; a separate requirement determines whether it is correct.

Keep surprising observations visible. Preserve unrelated quirks for this task, and identify the particular expectation that an authorized bug fix must change. Confirm expectations against execution when possible rather than inventing a baseline from intended behavior. Control variable inputs only where necessary for a repeatable check.

Complete this step with passing baseline checks, or identify the precise construction, access, or build dependency preventing them. If blocked, use step 3 and return to characterization before changing behavior.

## 3. Open the necessary test boundary

When a dependency prevents construction or hides effects, read [dependency-isolation.md](references/dependency-isolation.md). Distinguish separation from an unwanted dependency from sensing an effect; the replacement must support the purpose of the test.

Make the smallest test-enabling edit, keeping existing decision logic in place. Use an available boundary smoke check before editing when feasible. Preserve production defaults, call order, and ownership unless the request changes them. Compile or run the available checks after each consequential edit.

The boundary is ready when tests execute the real behavior being changed, can observe its relevant effects, and avoid the obstructing dependency. Record any production path the substitute cannot validate.

## 4. Make the intended difference

For implementation, express the requested behavior in a focused regression that fails against the old behavior, then make it pass. Change characterization expectations only where the requested difference warrants it. Keep the surrounding checks passing. Separate necessary test-enabling edits, behavior changes, and any later structural cleanup so failures can be traced to a small change.

For a review, specify the distinguishing input and expected result, the minimal enabling edit, and the checks that would demonstrate preservation. This step is complete when the intended difference is demonstrated or its proposed validation is concrete.

## 5. Check the boundary of confidence

Run the relevant existing tests and build checks, inspect the diff for unrelated changes, and account for every changed expectation. Report the requested result, preserved behavior, checks actually run, and remaining gaps. A passing fake-based test supports the exercised logic; it does not establish compatibility with the real dependency.

For source provenance or the limits of the supplied draft, consult [sources.md](references/sources.md). Completion means the scoped change has evidence, or the review states exactly what remains to validate.
