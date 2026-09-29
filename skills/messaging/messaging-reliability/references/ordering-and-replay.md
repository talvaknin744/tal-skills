# Ordering and replay

## Completed consumer progress

- **Trigger:** records from one partition are processed concurrently or routed through retry topics.
- **Failure:** committing past an unfinished earlier record skips its recovery; retry detours can reverse related effects.
- **Mechanism:** preserve ordering for the required business key and checkpoint only the completed prefix of delivered records. A completion is the required durable effect or a durable alternative disposition. Track actual delivered positions; Kafka offsets need not be consecutive integers.
- **Conditions:** use the actual consumer API. Traditional Kafka commits identify the next record to consume; share-consumer acknowledgement APIs have different contracts. Handle reassignment and stale workers at the protected mutation boundary.
- **Counterexample:** a later successful record does not justify committing an earlier failed record. Topic order alone does not order parallel database effects.
- **Verification:** finish offsets 10 and 12 while 11 remains unresolved; checkpoint stays at 11. Once 11 completes, advance to 13. Also test delivered positions with numerical gaps and recovery after ownership reassignment.

Kafka-to-Kafka transactions cover output records and consumed offsets when configured correctly, including downstream `read_committed` visibility. They do not include an arbitrary external database or email provider. [Kafka consumer positions](https://kafka.apache.org/43/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html), [transaction boundaries](https://kafka.apache.org/43/design/design/)

## Complete state, deltas, and deletion

- **Trigger:** a projection receives delayed, duplicated, missing, or reordered events.
- **Failure:** an older snapshot overwrites new state; discarding a late delta loses a required change; stale state resurrects a deleted entity.
- **Mechanism:** distinguish event identity, aggregate key, and authoritative aggregate revision. Apply a newer complete-state event atomically with progress. For deltas, require the next revision, retain a bounded gap buffer, and replay or reconcile gaps. Keep a deletion revision that rejects older state.
- **Conditions:** revisions come from an agreed authority and bootstrap establishes a known baseline. Requiring the next integer revision also requires a complete, contiguous per-aggregate stream. Filtered events or global revisions need explicit predecessor/skip evidence, no-op records, or authoritative reconciliation; a numeric jump alone cannot prove a missing required delta. Persist progress with the projection effect. Define gap timeout, capacity, and recovery when retained history is insufficient.
- **Counterexample:** independent writers' counters do not establish one order. Last-revision-wins is insufficient for required deltas, and a tombstone discarded too early can permit resurrection.
- **Verification:** snapshots 3, 2, 3 retain 3; tombstone 4 followed by snapshot 3 stays deleted. From quantity 10/revision 1, deliver delta 3 (+5), then 2 (-3), then duplicate 3: final quantity is 12. Exhaust the gap budget and preserve recovery state.

An outbox's event ID and aggregate routing key serve different purposes. Compacted-log retention and tombstone expiry constrain what replay can reconstruct. [Debezium outbox fields](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html), [Kafka compaction](https://kafka.apache.org/43/design/design/)

## Historical schemas and meaning

- **Trigger:** replay spans an older schema era, or event units/meaning change.
- **Failure:** a new consumer accepts the latest schema but cannot interpret retained historical records correctly.
- **Mechanism:** identify the supported replay window, retain representative payloads from each era, and test readers/upcasters against that window. Check domain meaning as well as serialization.
- **Conditions:** compatibility mode and history must match the contract. Non-transitive backward compatibility checks the previous version; transitive compatibility checks the registered history covered by that mode.
- **Counterexample:** a compatible numeric field can silently change from cents to dollars. A registry check does not establish business correctness or repair missing history.
- **Verification:** replay old and new fixtures, including changed units, enum meaning, defaults, deletion, and missing values. Assert business outcomes and a recoverable path for unsupported records.

Source: [Schema Registry compatibility modes](https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html).
