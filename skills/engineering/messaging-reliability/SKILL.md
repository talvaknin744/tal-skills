---
name: messaging-reliability
description: Diagnose broker delivery, acknowledgements, retries, quarantine, replay, and schema evolution. Use for lost, duplicate, out-of-order effects or unsafe checkpoints. Local synchronous callbacks and in-process collection transforms need no messaging skill.
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
- For replay, migration or restore involving registry schema identifiers, read [schema registry identity](references/schema-registry-identity.md). Verify the client's lookup authority and retained identifier mappings before resuming affected work.
- For product-specific guarantees, compare the deployed version and configuration with the [source records](references/sources.md). A product feature name alone is insufficient evidence for the complete effect boundary.

Keep related work scoped. If installed, `idempotency` handles operation equivalence and uncertain external effects, `concurrency-correctness` handles competing state transitions, and `graceful-draining` handles worker handoff. This package contains the messaging decisions needed without those optional skills.

## Demonstrate the failure and correction

Choose schedules at the changed durable boundaries: successful commit followed by lost acknowledgement, failed earlier event followed by successful later work, unavailable quarantine target, replay after retention expiry, or historical payload after a schema change. For competing deliveries of the same logical identity or ordering key, pause contenders before the durable identity claim or conditional write, then let them overlap using explicit barriers or ordered steps. State how arbitration selects the permitted mutation and the expected final business state. Give crash steps before and after the selected commit, acknowledgement and external acceptance transitions where present. State expected counts for durable effects, notification intents, provider acceptances, retained source records and acknowledgements, plus progress outcomes. An exception alone is not the oracle.

For external effects with unknown status, preserve the original identity and reconciliation state. Resume automatic execution only when the protocol establishes that it is safe. Keep unresolved work visible with an owner and next recovery action.

Run bounded local checks when permitted and sufficient for the question. Otherwise provide concrete proposed schedules and expected outcomes, label them unexecuted, and name the runtime or integration evidence still required. Separate state-machine checks from actual broker observations. Report the executed runtime, configuration, injected fault, and observed result. Queue durability settings do not demonstrate survival of a restart or replica loss. Bound retry work, reserved concurrency, and quarantined backlog according to the service's capacity and recovery contract.

Finish with the supported delivery/effect guarantee, changed implementation or review findings, executed checks, and remaining limits. Completion means the selected failure is reproduced and corrected, or the missing evidence and next validation step are explicit. Include the operational signal that will reveal recurrence, such as oldest unfinished age or blocked-key progress.

For selected hazards, completion also requires concrete schedules and expected outcomes in the final report, as a compact list or matrix when useful. For overlapping operations, name the contenders, pause and release ordering at durable arbitration, and possible final business state with effect counts. For each chosen commit, acknowledgement, notification dispatch or external acceptance boundary, show failure before and after it, restart steps, source disposition and expected durable effect, notification intent and provider acceptance counts. Include restart after durable recording of the send result where present. Label each schedule executed or proposed. Sequential checks leave concurrent boundaries unverified. Naming future tests without steps and expected outcomes leaves validation incomplete.
