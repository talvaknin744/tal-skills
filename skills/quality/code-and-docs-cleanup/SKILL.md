---
name: code-and-docs-cleanup
description: Use for explicit code or documentation cleanup, refactoring, unused-code removal, or stale-instruction repair, or an evidenced maintenance obstacle requiring behavior-preserving restructuring. Exclude routine feature implementation, bug fixes, spelling, and formatting without a separate cleanup task.
license: MIT
---

# Code and documentation cleanup

Improve a concrete maintenance task with a bounded, behavior-preserving change.
Fewer lines alone is not an improvement criterion. A review returns actionable
findings; an implementation edits the authorized slice.

## 1. Establish the cleanup contract

Identify the reader or next change being obstructed, the affected files and
consumers, and the observable behavior to preserve. Include relevant errors,
serialization, ordering, external effects, cancellation, resource ownership, and
operational signals. Record any authorized behavior change separately.

Inspect callers, tests, generated/configured entrypoints, and relevant history
before calling something unused. An exported path, dynamically loaded entrypoint,
or sparsely used command needs consumer evidence; absence of a text match is
enough only for a genuinely closed local scope.

**Done:** the proposed edit removes a named difficulty and has a bounded
preservation claim, with unresolved consumer questions visible.

## 2. Establish proportionate feedback

Use existing behavior checks when they cover the changed boundary. Where missing
feedback makes preservation uncertain, characterize the current public behavior
before restructuring. Explicitly distinguish observed legacy behavior from the
desired specification. Add an independent expectation for the risky outcome;
agreement between old and new implementations can preserve the same bug.

When failures, generated input, or adverse ordering are the uncertainty, the
optional `failure-oriented-testing` skill adds deeper mechanics. Without it,
write a concrete counterexample, expected outcome, and bounded reproduction.

**Done:** relevant baseline checks pass, or an existing failure and its effect on
the proposed cleanup are recorded without silently redefining correctness.

## 3. Make the smallest useful change

For code removal, extraction, or deduplication, read
[preservation.md](references/preservation.md). For stale or repeated documentation,
read [reader-path.md](references/reader-path.md). Read both only for a mixed change.

Keep policies independent when their ownership or reasons for change differ.
Preserve rationale explaining constraints, incidents, compatibility, and deliberate
duplication. Remove obsolete claims when evidence disproves them; rewriting useful
rationale for clarity is legitimate. Validation, retries, exception handling, and
synchronization each have responsibilities to trace before simplifying them.

**Done:** each transformation has an evidenced benefit and leaves the stated
contract intact; a behavior change remains separately reviewable.

## 4. Verify the resulting boundary

Run relevant checks against the final candidate. For documentation, exercise the
affected reader path from its stated starting point and verify prerequisites,
links, and commands. Report any environment-dependent steps not executed.

Inspect the diff for hidden policy coupling, removed responsibilities, misleading
comments, and scope expansion. Report what became easier, preserved behavior,
checks actually run, and remaining evidence gaps. Consult
[sources.md](references/sources.md) for editions, reading scope, and limits.

**Done:** the maintenance benefit and preservation claim are supported by the
final diff and recorded observations; proposed checks are labeled unexecuted.
