# Messaging contracts

Use this reference for event payloads and asynchronous request-response. Decide the contract before selecting broker-specific options.

## Payload and meaning

An event records a fact; a command or request asks an owner to do something. Name which has occurred, and distinguish acceptance of work from completion. For each event field, decide whether it describes the entity when the event happened or its current state when subsequently fetched. Include stable identity and the version or occurrence information needed to interpret that distinction.

Compare a small notification containing an identifier with a payload carrying the data consumers need. Fetching details introduces another availability dependency and can multiply load; carrying details enlarges the durable public contract and copies data to more places. Choose using the consumer's freshness, access, retention, and size requirements. A reference may be appropriate for large or restricted data. Sharing a field through one API does not automatically authorize broadcasting it to every subscriber.

## Delivery and completion

For asynchronous replies, persist enough request state that a different service instance can correlate and handle the reply. Define what a late response means after timeout or cancellation. Identify whether completion is observed by a reply, status lookup, or resulting event.

Check the configured transport's guarantees rather than assuming that a queue guarantees a completed business effect. Specify where acknowledgement happens, how duplicate deliveries are handled, which ordering is actually required, and what happens when processing keeps failing. Bound retries and give quarantined work a visible owner and recovery route. Inspect the durable handoff between a committed change and event publication; an uncoordinated second write leaves a failure gap.

Verify the relevant boundaries with an interrupted handler, a repeated delivery, and a delayed or unprocessable message. Require only the scenarios the actual contract permits. Detailed single-operation deduplication can be handled separately with `$idempotency` when available; this skill's concern is the cross-service contract.
