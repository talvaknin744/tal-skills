---
schema_version: 1
name: tal-recovery-validation
description: Rehearse or review recovery against accepted work, effect records, dependencies, and defined recovery objectives.
agents:
  - tal-durability
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-infrastructure
  - tal-python
  - tal-reliability
  - tal-typescript
skills: []
disable-model-invocation: true
---

# Recovery validation

Use when a backup, restore, replay, or resumed workload must satisfy an application
recovery claim. A dashboard-label change follows the short local path. The main
session applies the [handoff guide](../_shared/handoff.md).

1. **Define what recovery means.** Gather the artifact and its provenance,
   accepted-operation/input manifest, effect/progress records, restore procedure,
   schema/runtime versions, dependent services and surviving consumers, and
   stated recovery objectives with their reference times. Assign
   `tal-reliability` the objective and rehearsal contract. This step ends when
   expected recovered identities, invariants, and allowed loss are checkable.
2. **Choose owners and the safe target.** Designate one owner for overlapping
   recovery scripts, fixtures, and reports. Use the main session or reliability
   role for rehearsal, a matching language role for code repair, and
   `tal-infrastructure` only for platform restore mechanics. Add `tal-durability`
   when retained inputs/progress or continuation are in question and
   `tal-idempotency` when effects must be reconciled. Confirm the isolated target
   and source-preservation conditions before any requested rehearsal.
3. **Rehearse the application's return.** Have the owner perform the authorized
   restore and record the resulting data, effects, progress, compatibility, and
   measured bounds. Use `tal-failure-testing` for a separate missing/corrupt state
   or interruption question. Compare against expected accepted work before
   proposing reopening writes. If retained history cannot establish an exact
   result, preserve that limitation and identify the evidence needed to close it.
4. **Review and accept.** Freeze the recovery artifacts and report for an
   independent reliability or durability reviewer. Return findings and scoped
   repairs to the owner; rerun affected checks after changes. Accept a validated
   recovery claim only for the artifacts, application contract, and environment
   actually exercised. A review-only task returns evidence-backed findings and
   an explicit rehearsal gap.

A bounded local restore uses one owner and a focused independent review. Stop
dependent reopening or replay when identities/effects disagree, retained inputs
are insufficient, source preservation is at risk, or execution authorization is
missing. Return actual recovery outcomes, measured objectives, candidate/review
identity, and unresolved dependencies. Successful import is one observation,
not the application-level acceptance condition.

## Native invocation

Codex: `$tal-recovery-validation Rehearse this order-ledger restore in a new
scratch directory and check it against the accepted-order manifest.`

Claude: `/tal-recovery-validation Rehearse this order-ledger restore in a new
scratch directory and check it against the accepted-order manifest.`
