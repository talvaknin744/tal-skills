# Delayed messages, responses, and owners

Use only the branch explaining the observed race. Keep broad messaging architecture and operation-level duplicate recovery outside a narrow concurrency fix.

## Reordered events

Separate event identity, aggregate identity, and aggregate revision. The first identifies repeat delivery; the second defines a routing/ordering domain; the third can express progress within that domain. Neither an event ID nor a broker key alone enforces application state transitions.

Establish who allocates comparable revisions. Independent writers can produce conflicting histories; a locally increasing counter or wall-clock timestamp does not supply one authoritative order. Such a topology needs an explicit conflict/merge policy or a common authority, with tests for concurrent writes.

For complete-state events, an atomic compare-and-apply transition can reject an older revision and harmlessly recognize a duplicate. Include deletion/tombstone semantics. For delta events, applying revision 3 and discarding a late revision 2 may lose a required change. Specify gap detection and buffering, replay, or authoritative reconciliation. Establish the initial revision during bootstrap and the behavior when retained history no longer covers a gap.

Commit the local projection effect and local progress/deduplication record together where the datastore supports it. A separate “already processed?” query and later update can race between consumers. Broker acknowledgement should reflect the intended durable boundary; a crash can cause repeat delivery.

An outbox atomically commits publication intent with a business update. Delivery remains asynchronous and may duplicate. It does not prove every consumer has reached that revision, create a total order across independent aggregates, or eliminate a stale read window. A dependent reader needs its own freshness protocol.

Verify revisions 3, 2, 3 for complete-state events; separately omit an intermediate delta and assert the documented gap behavior. Include two consumers acting on the same progress record when the topology admits it.

## Obsolete owners and delayed requests

A timeout means the caller stopped waiting; the remote action may still complete. Lease expiry likewise does not prove the previous owner or its in-flight request stopped. Model a paused owner resuming after a successor has committed.

Where stale owners must be rejected, the protected resource must enforce ownership generations. The generation's ordering must survive relevant restarts, and the acceptance comparison must be atomic with the protected mutation. Checking a lease in an application service before sending an unconditional remote write leaves a delay window. A random lock token useful for safe unlock is not necessarily an ordered fencing token.

Verify the generation allocator's authority and durability. A time-sortable UUID, ULID, or independently maintained clock does not by itself prove ownership order.

State precisely what a resource rejects: a rule rejecting generations below the highest accepted generation fences older owners after a newer generation reaches that resource; it does not reject every duplicate from the same generation or automatically revoke an old owner at wall-clock lease expiry. If immediate revocation is required, the write authority needs a protocol that enforces that stronger rule.

When the target is an external API that cannot enforce the generation, recording a token elsewhere does not fence the API call. Use the provider's actual conditional/idempotency capability or a durable reconciliation path, and disclose the remaining uncertain outcome. Preserve logical operation identity if recovery may repeat an effect.

Verify by pausing generation 4, letting generation 5 mutate the protected resource, then releasing generation 4. Assert rejection at the mutation boundary rather than merely checking an ownership table in a test. For uncertain remote effects, test a lost response after success and ensure recovery does not infer failure from the timeout.

Sources: [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html), [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html), and [Kleppmann's fencing analysis](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html).
