---
name: messaging-reliability
description: Diagnose or implement broker consumers, acknowledgements, retries, quarantine, replay, and schema evolution. Use for lost, duplicate, or out-of-order effects and unsafe checkpoints; exclude in-process collection transformations.
license: MIT
---

# Messaging reliability

**recoverable disposition:** A recoverable disposition records how each message reaches a safe, observable outcome.

Make each message reach a recoverable disposition without losing required effects or repeating harmful ones. Keep the existing broker and storage choices unless the evidence requires a change.

## Establish the boundary

Read the producer, consumer, persistence, retry, and deployment configuration involved in the request. Record the actual broker/client versions and consumer API, event identity, ordering key, revision authority, and permitted replay horizon. Identify the business effect and the point at which it becomes durable. A broker acceptance, a database commit, and a consumer acknowledgement establish different facts.

Draw the relevant transitions: publish → acceptance → processing → durable effect → acknowledgement/checkpoint. Add retry or quarantine only where used. For each uncertain transition, name the stored evidence that lets recovery continue. A missing reply leaves the outcome unknown until reconciled; preserve the logical operation identity across reconnection, republication, and operator replay.

Completion: every effect, progress record, and acknowledgement in the changed path has an owner and an explicit atomicity boundary.

## Choose the relevant branch

- For database effects, redelivery, poison messages, retry limits, or dead-letter queues, read [delivery-and-recovery.md](references/delivery-and-recovery.md). Inspect whether failed quarantine transfer leaves the source recoverable.
- For parallel consumers, delayed events, missing revisions, retained history, or schema changes, read [ordering-and-replay.md](references/ordering-and-replay.md). Establish whether events contain complete state or required deltas before discarding an old revision.
- For product-specific guarantees, compare the deployed version and configuration with the [source records](references/sources.md). A product feature name alone is insufficient evidence for the complete effect boundary.

Keep related work scoped. If installed, `idempotency` handles operation equivalence and uncertain external effects, `concurrency-correctness` handles competing state transitions, and `graceful-draining` handles worker handoff. This package contains the messaging decisions needed without those optional skills.

## Demonstrate the failure and correction

Choose schedules at the changed durable boundaries: successful commit followed by lost acknowledgement; failed earlier event followed by successful later work; unavailable quarantine target; replay after retention expiry; or historical payload after a schema change. Use explicit barriers or ordered steps for local tests. Check durable effect count, retained source/progress state, and the eventual disposition; an exception alone is not the oracle.

For external effects with unknown status, preserve the original identity and reconciliation state. Resume automatic execution only when the protocol establishes that it is safe. Keep unresolved work visible with an owner and next recovery action.

Separate state-machine checks from actual broker observations. Report the executed runtime, configuration, injected fault, and observed result. Queue durability settings do not demonstrate survival of a restart or replica loss. Bound retry work, reserved concurrency, and quarantined backlog according to the service's capacity and recovery contract.

Finish with the supported delivery/effect guarantee, changed implementation or review findings, executed checks, and remaining limits. Completion means the selected failure is reproduced and corrected, or the missing evidence and next validation step are explicit. Include the operational signal that will reveal recurrence, such as oldest unfinished age or blocked-key progress.
