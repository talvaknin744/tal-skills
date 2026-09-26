# Effects across boundaries

## Local transaction and message delivery

If a local change also requires publishing a message, make the delivery intent durable in the same transaction through an outbox or equivalent capture mechanism. A relay can retry publication; its event identity must remain stable. Publishing then recording delivery leaves a duplicate window that consumers must tolerate. [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html)

For a consumer's local database effect, commit deduplication evidence and that effect together, then acknowledge delivery. If processing instead sends an email or invokes an external system, a local processed flag cannot atomically include that remote effect. Durable work scheduling moves the boundary to a sender; it does not remove the sender's uncertainty. Queue deduplication windows and visibility timeouts are not end-to-end business guarantees. [SQS visibility behavior](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)

## Lease expiry and regional ownership

A lease timeout does not establish that the previous owner stopped. Acquire recovery ownership atomically and guard local completion writes by the current ownership generation. When correctness depends on fencing, the receiving resource must reject stale generations; checking a lease immediately before a remote write leaves a race. A local generation counter alone cannot fence an arbitrary provider API. [Kleppmann on fencing](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html)

When several regions can receive the same logical operation, identify the authority that resolves competing claims. Test routing failover and replication lag against that authority; independent regional uniqueness checks cannot by themselves establish a global invariant. Preserve the existing deployment's availability tradeoff and narrow any guarantee that cannot survive its failover model.

## Unknown provider outcome

Persist the identity for each distinct downstream action before dispatch. Reuse it after a lost response, subject to the provider's scope and retention contract. Query authoritative status or retry through a documented idempotent interface when that establishes the outcome. Creating a new key after a timeout can authorize a second effect. [AWS retry design](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)

If no reliable status or duplicate-suppression mechanism exists, retain an unresolved result, stop automatic redispatch, and define an operational reconciliation path. Reconciliation is not a claim that exactly-once execution has been achieved. Define retry deadlines/backoff, attempt accounting, and the point at which recovery escalates. A newly timed-out recovery attempt still has the original identity and uncertainty. [Stripe's treatment of indeterminate errors](https://docs.stripe.com/error-low-level) illustrates why a new key is unsafe after an uncertain result.

Only retire recovery evidence after the operation has a terminal disposition and the documented retention policy permits it. Surface aging unresolved work and delivery backlog so operators can find stranded operations. Keep identifiers useful for tracing without logging credentials or sensitive response bodies.
