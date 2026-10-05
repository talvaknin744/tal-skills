# messaging-reliability

## What it does

Makes broker messages reach a recoverable disposition without losing required effects or repeating harmful ones. It treats publish acceptance, durable business effects, and acknowledgement as separate facts, while preserving the existing broker and storage choices unless evidence requires change.

## When to reach for it

Use it for broker consumers, acknowledgements, retries, quarantine/dead-letter paths, event replay, schema evolution, duplicate or out-of-order delivery, poison messages, and unsafe checkpoints. Local synchronous callbacks and in-process collection transformations belong in ordinary application code. For API/event contract choice and consumer coupling, pair with `microservice-integration`.

## It's working if

- The path from publish through durable effect to acknowledgement/checkpoint names each owner and atomicity boundary.
- Uncertain outcomes retain a logical operation identity and stored evidence for reconciliation or replay.
- Ordering, identity, revision authority, and replay horizon are explicit; stale deltas are not discarded as if they were full state.
- Controlled failure schedules check durable effect count, retained progress/source state, and eventual disposition.
- The supported delivery/effect guarantee and operational recurrence signal are stated with runtime, configuration, and evidence gaps.

## Where it fits

This is the broker delivery and recovery specialist. It neighbors `microservice-integration` for interface semantics, `idempotency` for effect equivalence, `concurrency-correctness` for competing transitions, and `graceful-draining` for worker handoff. See [the messaging skill](../../skills/engineering/messaging-reliability/SKILL.md) and [messaging reading path](../reading-paths.md).
