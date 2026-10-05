---
schema_version: 1
name: tal-messaging-evolution
description: Change an event or message interaction while preserving consumer compatibility, effect safety, ordering, and replay behavior.
agents:
  - tal-boundaries
  - tal-consistency
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-messaging
  - tal-python
  - tal-typescript
skills:
  - microservice-integration
disable-model-invocation: true
---

# Messaging evolution

Use for a broker-backed producer, consumer, event contract, or replay change.
For a local callback or a text-only edit, take the direct local path. The main
session follows the [handoff guide](../_shared/handoff.md) and uses
`microservice-integration` when it owns service contract/coexistence decisions.

1. **Bound the interaction.** Read the initiating use case, current producer and
   consumers, schemas, effect store, broker/client versions, retention, and
   delivery configuration. Record event meaning, affected consumer versions,
   success semantics, and compatibility constraints. Unknown consumers remain
   unknown rather than implicitly compatible.
2. **Assign ownership and questions.** Choose one main-session or language owner
   for the overlapping implementation. Assign `tal-messaging` the delivery,
   acknowledgement, and replay contract. Add `tal-idempotency` for duplicate
   effects, `tal-consistency` for entity ordering or concurrent materialization,
   and `tal-boundaries` only for a real ownership change. Record separate message,
   entity, and business-operation identities where the contract needs them.
   Complete this step when each changed contract has an owner and every dispatch
   addresses a distinct unresolved risk.
3. **Implement and exercise coexistence.** Have the owner implement the bounded
   change and necessary old/new compatibility behavior. Use `tal-failure-testing`
   only for an independent fault/schedule question. Select the contract's
   relevant duplicate delivery, commit/ack interruption, reordering, poison
   input, retention, and replay cases. Keep snapshot-event and delta-event
   expectations distinct. Record real selected-broker results separately from
   synthetic delivery tests.
4. **Review and accept.** Freeze the candidate for an independent messaging or
   language reviewer. Return findings to the owner, correct them, and rerun
   affected checks through the shared loop. Accept when affected consumers,
   ordering/effect claims, and coexistence or retirement conditions have evidence
   or are explicitly unresolved in a partial result.

A single consumer fix uses one owner and a focused independent review. Stop
dependent publication, replay, or consumer retirement when authorization,
compatibility, or an uncertain effect is unresolved. Return changed contracts and
files, observed delivery/effect outcomes, final candidate and review result, and
the broker or external-provider surface still unverified.

## Native invocation

Codex: `$tal-messaging-evolution Evolve this account snapshot consumer to accept
the new schema while existing producers remain live; verify replay behavior.`

Claude: `/tal-messaging-evolution Evolve this account snapshot consumer to accept
the new schema while existing producers remain live; verify replay behavior.`
