---
schema_version: 1
name: tal-a2a-integration
description: Build or review a pinned A2A integration with explicit task ownership, observer lifecycle, effect safety, and peer evidence.
agents:
  - tal-a2a
  - tal-consistency
  - tal-durability
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-python
  - tal-typescript
skills: []
disable-model-invocation: true
---

# A2A integration

Use for an explicitly requested A2A peer interaction. Ordinary job endpoints and
native coding-agent delegation keep their existing interfaces. The main session
applies the [handoff guide](../_shared/handoff.md); A2A is not required to run this
workflow's local specialists.

1. **Establish the peer and task contract.** Read the specification/SDK versions,
   Agent Card, binding, capabilities, task store, message/artifact expectations,
   principal mapping, and business-effect contract. Assign `tal-a2a` the protocol
   and lifecycle question. Identify the authority for task state and the owners
   of execution and observation before implementation.
2. **Assign one writer and relevant questions.** The main session, `tal-a2a`, or
   matching language role owns overlapping integration files. Add
   `tal-idempotency` for repeated business commands, `tal-durability` for
   persistent continuation, `tal-consistency` for cancellation/completion races,
   and `tal-failure-testing` for an independent observer or access-boundary test.
   The assignment is ready when every dispatch addresses a separate material
   uncertainty and every edited path has one owner.
3. **Implement and observe lifecycle behavior.** Have the owner exercise the
   real pinned peer path and the requested task/message/artifact behavior.
   Select relevant duplicate input, observer disconnect/reconnect, task access,
   cancellation race, terminal state, and artifact-completeness checks. Record
   which guarantees come from the peer, SDK, application, or modeled fixture.
   Distinguish observer termination from underlying task termination.
4. **Review and accept.** Freeze the candidate for independent A2A or language
   review, return findings to the owner, and rerun affected checks after
   correction. Accept the requested lifecycle and effect claims only to the
   extent the pinned peers and fixtures demonstrated them. A review-only task
   returns findings and missing observations without an implementation stage.

A bounded adapter fix uses one owner and focused review. Stop dependent remote
mutations or completion claims when task authority, principal access, peer
semantics, or an effect outcome is unresolved. Return the supported peer/version
contract, changed files, actual checks, final candidate/review, and explicit
interoperability or authentication limits.

## Native invocation

Codex: `$tal-a2a-integration Add reconnect support to this A2A task client using
the pinned peer contract; verify that one observer leaving preserves task work.`

Claude: `/tal-a2a-integration Add reconnect support to this A2A task client using
the pinned peer contract; verify that one observer leaving preserves task work.`
