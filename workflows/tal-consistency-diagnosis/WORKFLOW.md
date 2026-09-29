---
schema_version: 1
name: tal-consistency-diagnosis
description: Reconstruct a failing concurrent history, implement its bounded repair when requested, and verify the forbidden outcome independently.
agents:
  - tal-consistency
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-messaging
  - tal-python
  - tal-typescript
skills: []
---

# Consistency diagnosis

Use when a concurrent execution violates a stated mutation invariant, freshness
requirement, or ownership order. Keep diagnosis read-only unless repair is part
of the request. The main session follows the
[handoff guide](../_shared/handoff.md).

1. **Establish the history.** Gather the observable contract, actor timeline,
   relevant code and statements, authoritative state, cache/replica paths, and
   actual adapter/isolation versions. Assign `tal-consistency` the smallest
   failing-history question. Stop this step when the forbidden result and its
   known versus inferred ordering edges are explicit.
2. **Select the repair owner.** For an authorized repair, choose the main session
   or matching language role as the only writer of overlapping code and tests.
   Use `tal-idempotency` only when duplicate logical attempts introduce a separate
   effect problem, and `tal-messaging` only for broker-delivery semantics. Pass
   their findings to the owner. The repair is ready to implement when its
   enforcement boundary, participating actors, and conflict behavior are stated.
3. **Force the relevant schedule.** Use `tal-failure-testing` when an independent
   discriminator is needed; otherwise the owner creates a focused regression.
   Preserve the schedule and outcomes. Verify the original forbidden behavior
   when feasible, then the repair and relevant existing checks. Datastore or
   distributed-adapter claims need corresponding runtime evidence or an explicit
   remaining validation step.
4. **Review and finish.** Freeze the candidate for a separate consistency or
   language reviewer and return findings to the owner through the shared review
   loop. For diagnosis only, independently challenge the history and conclusion
   rather than creating an implementation stage. Accept when the requested
   diagnosis or repair identifies the invariant, history, enforcement point, and
   evidence covering the claimed consistency domain.

A bounded local race uses one owner and one relevant independent review. Pause
dependent repair when the permitted behavior or authority is unknown; keep
collecting useful evidence. Report uncovered schedules and unavailable real
adapters rather than treating a stress pass or race-detector pass as full proof.

## Native invocation

Codex: `$tal-consistency-diagnosis Diagnose and fix the stale cache fill shown in
this trace; preserve the documented read-after-write contract.`

Claude: `/tal-consistency-diagnosis Diagnose and fix the stale cache fill shown in
this trace; preserve the documented read-after-write contract.`
