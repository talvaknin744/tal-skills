# Messaging and durable execution research

Surveyed 2026-09-29. The companion [source records](messaging.json) contain exactly ten publisher entries and four complete article readings. The other article candidates were screened for relevance and access, not counted as deep readings. Publisher selection is a coverage decision, not a popularity ranking. No sample deployment or broker command was executed.

## Where the new skill adds value

The existing `idempotency` skill already addresses atomic effects, outboxes, uncertain responses, and remote reconciliation. `graceful-draining` covers checkpoint identity, generation exclusion, fencing, and independent retry budgets. `microservice-integration` covers transport selection and consumer contracts; `microservice-data` covers ownership, sagas, and projections.

Give `messaging-reliability` the narrower job of tracing one event through **durable publication intent, broker acceptance, consumer effect, acknowledgment or offset advancement, quarantine, and replay**. Its output should identify the guarantee and recovery evidence at each boundary. Route detailed operation deduplication, service decomposition, and deployment handoff back to the existing specialist skills when those branches apply.

## Four useful readings

| Reading | Application | Caveat to retain |
| --- | --- | --- |
| [Confluent: Error Handling Patterns](https://www.confluent.io/blog/error-handling-patterns-in-kafka/) | Retry routing changes the order in which related work completes. | A routing sketch needs a recovery protocol before it becomes an implementation. |
| [RabbitMQ: At-Least-Once Dead Lettering](https://www.rabbitmq.com/blog/2022/03/29/at-least-once-dead-lettering) | Quarantine transfer deserves the same failure analysis as ordinary delivery. | Retaining failed transfers consumes capacity and can push pressure upstream. |
| [NATS: Infinite Message Deduplication](https://nats.io/blog/new-per-subject-discard-policy/) | Match deduplication lifetime to the permitted replay horizon. | The article itself demonstrates that deleting the retained entry allows the identity again. |
| [Temporal: Automated Worker Versioning](https://temporal.io/blog/automated-worker-versioning-with-github-actions) | Keep compatible execution capacity until version-specific work drains. | A traffic rollback and recovery of already pinned work are different operations. |

The machine-readable records give each reading a trigger, failure, mechanism, conditions, counterexample, and verification scenario. They separate article observations from the implementation recommendations below.

## Current documentation checks

**Name the acknowledgment boundary.** RabbitMQ publisher confirms and consumer acknowledgments cover different links; neither establishes the other. A consumer can finish its effect and lose its acknowledgment, so a subsequent delivery still needs duplicate-safe processing. Limit outstanding work according to actual processing capacity. [RabbitMQ confirms](https://www.rabbitmq.com/docs/confirms)

**Inspect the failure path's configuration.** Current RabbitMQ documentation retains the distinction between default at-most-once dead lettering and opt-in at-least-once transfer. Quorum source queues need the relevant policy, routing, and `reject-publish` overflow. Target outage can retain messages in the source; retries can duplicate at targets. Policy changes can delete unconfirmed dead letters. Inspect deployed settings before promising retention. [Quorum queues](https://www.rabbitmq.com/docs/quorum-queues)

**Scope exactly-once claims to participating state.** Kafka 4.3 documents coordinated output and consumed-offset transactions for Kafka-to-Kafka processing. External destinations need their own coordination. After an aborted transaction, resetting application and consumer position is part of recovery. Its newer share consumers acknowledge individual records; the offset-watermark description applies to traditional consumers. [Kafka design](https://kafka.apache.org/43/design/design/)

**Cover history, not just the previous schema.** Schema Registry's default `BACKWARD` mode checks the last version; `BACKWARD_TRANSITIVE` checks prior registered versions. Select compatibility using the schemas that can actually reappear from retention, quarantine, bootstrap, and rollback. Structural compatibility still needs business-meaning tests. [Schema evolution](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html)

**Read retention together with deduplication.** NATS documents a bounded duplicate-ID window; per-subject rejection is a separate stream option. Age limits still expire records under `Discard New`, and stream limits can remove records before a lagging consumer reads them. Inspect storage, replica, expiry, and retention settings rather than inferring durability from a successful API call. [Publishing](https://docs.nats.io/learn/jetstream/publishing), [stream limits](https://docs.nats.io/learn/jetstream/shaping-the-stream), [stream API](https://docs.nats.io/reference/jetstream/api/stream/create)

**Choose a compatible rollout model.** Current Temporal documentation distinguishes pinned and auto-upgrade workflows; auto-upgrade requires replay-safe changes. Its Worker Versioning model needs blue-green or rainbow capacity, rather than an in-place rolling replacement. Verify supported SDK/server versions and the drain evidence for the actual deployment. [Worker Versioning](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning)

## Recommendations for implementation and evaluation

These are repository-specific synthesis, not copied source instructions:

1. Start from the existing producer, consumer, broker, SDK version, group/subscription type, retention settings, and sink. Produce an event timeline with commit and uncertainty points before proposing a transport change.
2. Distinguish transient dependency errors, invalid payloads, business rejection, infrastructure interruption, and uncertain effects. Give each a finite retry or reconciliation policy, a visible disposition, and a responsible recovery owner.
3. Require a stable event identity through retries and redrives. Record whether replay reconstructs a projection or repeats externally visible business actions. Use the actual retained evidence to justify either mode.
4. Decide ordering at the business key. Validate the behavior when an early message is delayed while later messages succeed, including restart and ownership reassignment. A topic's order is not proof of effect order.
5. Test quarantine as a protocol: durable transfer before source acknowledgment, unavailable/full target, duplicate transfer, operator repair, and controlled replay. Monitor oldest unfinished age and blocked-key progress, not only queue depth.
6. Include historical schema fixtures from every supported replay era. Test changed units, enum meaning, and missing data as well as serialization acceptance.

Suggested positive evaluations: a consumer commits an offset across a failed earlier event after parallel processing; a quarantine target fails after the source has decided to discard; a replay occurs after deduplication expiry. A nontrigger is an in-process list transformation with no durable messaging or externally visible effect. Local state-machine tests demonstrate the proposed transition logic; broker failover and real SDK behavior require separate integration evidence.

## Deeper protocol checks and runnable scenario designs

The event ID and aggregate routing key have different jobs; Debezium's outbox table exposes both. Keep revision authority explicit. The existing concurrency skill already distinguishes complete-state and delta events, so reuse that rule rather than inventing another ordering model. [Debezium outbox](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html)

Traditional Kafka commits identify the next record to consume. Parallel processors need a completed-prefix decision; a later successful task cannot justify skipping an earlier unresolved record. [KafkaConsumer 4.3.1](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)

Retry accounting is version-sensitive: RabbitMQ 4.3 distinguishes acquisitions from failed deliveries. Pulsar 4.2 documents a potentially resetting negative-acknowledgment counter and persisted retry-topic accounting; its retry-topic guidance applies to Shared subscriptions. Its DLQ also needs a subscription/retention arrangement that actually keeps messages. [RabbitMQ counters](https://www.rabbitmq.com/docs/quorum-queues), [Pulsar messaging](https://pulsar.apache.org/docs/4.2.x/concepts-messaging/)

Use barriers or explicit scheduler steps for these original fixtures; avoid timing sleeps:

| Scenario | Schedule and required assertion |
| --- | --- |
| Completed prefix | Offsets 10 and 12 finish while 11 blocks. Commit stays at 11; after durable disposition of 11 it advances to 13. A restart may repeat 12 without repeating its effect. |
| Complete state | Deliver versions 3, 2, 3. State remains version 3. Apply tombstone 4, then replay 3; the deleted entity stays deleted. |
| Missing delta | Begin at quantity 10/revision 1. Deliver revision 3 (+5), then 2 (-3), then 3 again. Buffer the gap, apply each once, and finish at quantity 12/revision 3. |
| Unknown side effect | Provider stores operation K then loses its reply. Quarantine preserves K and unknown status. Recovery checks K; it creates no second operation. |
| Failed quarantine | Target is full or unavailable. Source remains recoverable. After target acceptance but lost confirmation, duplicate transfer is harmless. |
| Bounded admission | Hold two handlers at a barrier with capacity two. Further deliveries stay outside the application's reserved/executing set. Cancellation settles owned resources before releasing slots. |

These can share one semantic fixture set across TypeScript, Python, and Go. A local provider fake should expose its effect count and durable lookup separately so the test can distinguish a lost response from a failed operation. The test oracle must check outputs and retained recovery state, not just an exception or a log message.

## Advice deliberately not adopted

- Broad “Kafka cannot acknowledge individual messages” comparisons are historical shorthand. The screened [StreamNative article](https://streamnative.io/blog/reliability-that-thinks-ahead-how-pulsar-helps-agents-stay-resilient) predates the current Kafka share-consumer surface. Record the actual consumer API before comparing behavior.
- NATS's [advanced publishing page](https://docs.nats.io/learn/jetstream/advanced-publishing) sometimes calls unconfirmed async writes “lost.” Its [basic publishing page](https://docs.nats.io/learn/jetstream/publishing) states the necessary distinction: a timeout can follow a successful store. The skill must preserve **unknown outcome**, rather than classifying every missing acknowledgment as proven loss.
- Cross-product marketing claims and broker-local deduplication are insufficient evidence for end-to-end business-effect guarantees. The survey retains useful candidates without importing those claims into agent instructions.

The old NATS `model_deep_dive` URL now redirects to a general index. References above use the current specific pages. Article examples remain versioned historical evidence; current documentation and installed runtime behavior govern implementation.
