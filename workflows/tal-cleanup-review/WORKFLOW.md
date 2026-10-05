---
schema_version: 1
name: tal-cleanup-review
description: Review or perform a bounded code and documentation cleanup with preserved behavior and an independent final-candidate check.
agents:
  - tal-boundaries
  - tal-cleanup
  - tal-failure-testing
  - tal-go
  - tal-python
  - tal-typescript
skills: []
disable-model-invocation: true
---

# Cleanup and review

Use for an explicit cleanup, consolidation, documentation usability, or
behavior-preservation review. A feature request alone keeps its original scope.
The main session follows the [handoff guide](../_shared/handoff.md).

1. **Define the preserved contract.** Read the affected code/docs, actual callers
   or reader starting point, ownership boundaries, supported versions, current
   diff, and available checks. Identify the requested simplification and the
   evidence for redundancy or confusion. State any intentional behavior change
   separately from cleanup.
2. **Choose the short path.** Assign the main session or `tal-cleanup` as the
   single owner of overlapping files. For a one-file text or straightforward
   local cleanup, proceed directly to the edit and focused review. Add a language
   specialist only for language-sensitive behavior, `tal-boundaries` only when
   consolidation would merge independently owned policies, and
   `tal-failure-testing` only when a material preserved behavior lacks a useful
   discriminator. Review-only requests use an investigator/reviewer with no
   implementation stage.
3. **Make the bounded change.** Have the owner remove or consolidate only
   evidenced redundancy, retaining prerequisites, compatibility conditions, and
   useful rationale. Verify affected behavior with relevant existing checks. For
   documentation, exercise the stated entry path against the actual interface
   when available. A text-only correction normally needs a diff/meaning check,
   not a new runtime test suite.
4. **Review and finish.** Freeze the candidate for an independent cleanup or
   relevant language reviewer. Return findings to the owner and rerun affected
   checks after correction through the shared loop. Accept when the requested
   simplification preserves the identified contract and the instructions remain
   usable from their stated starting point. Review-only work ends with actionable
   findings and evidence.

Stop a proposed deletion or consolidation when its caller, ownership, or
compatibility evidence is unresolved; continue the supported cleanup. Return the
bounded change or review findings, preservation evidence, candidate/review
identity, and remaining limits. Line count and stylistic uniformity alone are
not acceptance conditions.

## Native invocation

Codex: `$tal-cleanup-review Consolidate the repeated setup instructions in this
README and verify the documented starting path; preserve compatibility notes.`

Claude: `/tal-cleanup-review Consolidate the repeated setup instructions in this
README and verify the documented starting path; preserve compatibility notes.`
