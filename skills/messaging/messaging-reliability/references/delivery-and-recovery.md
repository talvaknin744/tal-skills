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
- **Verification:** restart during retries, replay at the supported retention boundary, and force capacity-driven identity eviction before TTL expiry. An in-contract repeat must not silently become a fresh effect. Assert bounded work plus a recoverable disposition; measure oldest unfinished age alongside queue depth.

RabbitMQ 4.3 distinguishes acquisition and failed-delivery counters. Pulsar 4.2 documents different persistence for negative-ack versus retry-topic accounting. Use the precise API/configuration instead of assuming every NACK consumes one durable attempt. [RabbitMQ](https://www.rabbitmq.com/docs/quorum-queues), [Pulsar](https://pulsar.apache.org/docs/4.2.x/concepts-messaging/), [NATS retention](https://docs.nats.io/learn/jetstream/shaping-the-stream)

## Restored publication state and replay intent

Read this branch when identity/checkpoint state is restored independently of
published events, or an operator replays historical data. Identify authoritative
evidence separately for publication and downstream effects: an output record or
publisher confirmation does not prove consumer completion. Reconcile restored
identity state with those histories before resumption; preserve effect identities
and arbitrate or fence late old publishers. Test identity state both ahead of and
behind publication evidence. Hold unresolved outcomes when the required history
or concurrency control is unavailable.

Choose whether recovery needs historical events or current authoritative state.
Bind it to a named input history/snapshot, transformation version, destination,
and effect policy. A resync cannot replace required historical deltas; historical
replay must not overwrite newer state or repeat business effects. Check controls
on the actual replay route: Segment, for example, permits replay to some disabled
destinations and applies destination filters. Test that route rather than treating
a disabled flag as isolation. [Segment replay and resync](https://www.twilio.com/docs/segment/guides/what-is-replay)

Segment's [2017 implementation account](https://www.twilio.com/en-us/blog/insights/exactly-once-delivery)
provides recovery and capacity examples, not a current retention promise. Its
observed four-week window must not replace the current approximately 24-hour/99%
ingress-deduplication description or a destination's separate contract.
[Current duplicate-data documentation](https://www.twilio.com/docs/segment/guides/duplicate-data)

When admission reserves concurrency before execution, also test failover with
slots stranded in the failed region and a late old pickup/release racing a new
owner. Require useful progress without excess execution or stale reservation
release; do not clear possibly running work solely on a timeout. Distinguish the
scheduler's queued, reserved/dequeued, executing, and checkpointed states, and
verify which transitions consume attempt budgets.
[Trigger.dev incident](https://trigger.dev/blog/incident-report-jun-22-2026),
[current run states](https://trigger.dev/docs/runs).
