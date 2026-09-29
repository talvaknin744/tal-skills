# Delivery and recovery

Read the card matching the failure. Preserve existing application contracts rather than adding a generic messaging framework.

## Effect before acknowledgement

- **Trigger:** a consumer mutates local state and can receive repeated attempts.
- **Failure:** acknowledging before commit loses work; committing before acknowledgement permits another attempt.
- **Mechanism:** atomically claim the scoped operation identity and commit its local effect/outcome, then acknowledge. Repeated attempts compare intent and reuse the saved outcome. An independently republished duplicate can have `redelivered=false`.
- **Conditions:** claim and effect share a transaction or equivalent atomic primitive; identity survives replay; retained outcomes cover the supported replay horizon.
- **Counterexample:** a provider call and a local inbox do not share a transaction. Preserve the provider's operation key and reconcile a lost reply. A local “processed” flag cannot establish that the external effect failed.
- **Verification:** commit, disconnect before ACK, reconnect, and assert one effect after redelivery. Republish the same identity independently. Use ACK-before-commit as a negative control. Check key reuse with changed intent separately.

Publisher confirmation and consumer acknowledgement cover separate links. Record actual replication, persistence, and confirmation settings before interpreting them. [RabbitMQ acknowledgement boundaries](https://www.rabbitmq.com/docs/confirms)

## Quarantine is a transfer protocol

- **Trigger:** invalid or repeatedly failing work is removed from normal consumption.
- **Failure:** source removal before durable transfer loses the message; target acceptance with lost confirmation can duplicate it.
- **Mechanism:** retain source recoverability until the quarantine contract is satisfied. Keep event identity, payload/schema version, failure reason, attempts, and side-effect status, including unknown outcomes. Repair and replay use the original operation identity.
- **Conditions:** inspect source policy, all routed targets, persistence, retention, overflow, and replay ownership. Backlog capacity must account for a target outage; decide how admission slows or rejects when capacity is exhausted.
- **Counterexample:** a durable source queue does not prove that its dead-letter target survives restart. Quarantining an uncertain payment does not prove it was never charged.
- **Verification:** fail or fill the target before transfer; lose confirmation after acceptance; restart the target after source removal when restart durability is claimed. Assert retained recovery state and duplicate-safe replay.

RabbitMQ's at-least-once dead lettering requires a quorum source with the documented strategy and overflow settings; default dead lettering has weaker guarantees. Possible duplicates and policy-change deletion remain relevant. Check the deployed version. [RabbitMQ quorum dead lettering](https://www.rabbitmq.com/docs/quorum-queues)

## Retry budgets and retention

- **Trigger:** poison messages loop, retry counters reset, or old work is replayed.
- **Failure:** process-local counters reset on restart; expired deduplication admits old effects; repeated retries exhaust capacity without progress.
- **Mechanism:** persist the relevant attempt/disposition state, classify retryable failures, and choose a bounded retry/quarantine policy. Preserve identity and distinguish infrastructure interruption from business failure where the engine permits it.
- **Conditions:** verify which operation increments the installed broker's counter. Size retention from actual replay needs and storage bounds; a time limit may be shortened by a byte/message limit.
- **Counterexample:** NATS publication deduplication and per-subject rejection are not indefinite application-effect guarantees. Deleting or expiring the retained identity changes what a later publication can do.
- **Verification:** restart during retries, replay at the supported retention boundary, and assert bounded work plus a recoverable disposition. Measure oldest unfinished age alongside queue depth.

RabbitMQ 4.3 distinguishes acquisition and failed-delivery counters. Pulsar 4.2 documents different persistence for negative-ack versus retry-topic accounting. Use the precise API/configuration instead of assuming every NACK consumes one durable attempt. [RabbitMQ](https://www.rabbitmq.com/docs/quorum-queues), [Pulsar](https://pulsar.apache.org/docs/4.2.x/concepts-messaging/), [NATS retention](https://docs.nats.io/learn/jetstream/shaping-the-stream)
