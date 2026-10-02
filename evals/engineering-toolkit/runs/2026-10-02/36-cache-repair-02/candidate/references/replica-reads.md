# Replica reads and causality

Use this branch when a dependent read misses an acknowledged write or different read sources violate the operation's session contract. Identify the actual source of each read: primary, replica, secondary index, projection, or local cache. A datastore-wide “strong consistency” label can conceal API-specific behavior.

## Carry the dependency

For read-your-writes across services, identify the context that proves which write the read must include: a datastore causal context, an authoritative commit position, or an entity revision with a documented comparison domain. Propagate it through the real request chain. A newly created unrelated session in another service does not automatically inherit the first session's history.

For monotonic reads, also carry the latest state the session has observed even if it never wrote anything. After observing revision 8, routing that session to a replica at 7 must wait, reroute, or return the contract's explicit unavailable outcome. Sticky routing alone needs a failover rule.

The reader must either use a source guaranteed to include that context, wait for an eligible source, or return an explicit pending/unavailable outcome. Choose a bounded wait and fallback. An arbitrary sleep supplies no proof of replication progress. Routing to a primary helps only to the extent that the datastore's acknowledgement, read, and failover semantics support the required guarantee.

Check that the token describes an acknowledged commit, survives or is invalidated safely on failover, and is comparable on the selected source. A timestamp from an application host is not automatically a commit position. For multiple entities or stores, one entity revision does not establish a cross-entity snapshot or order unrelated histories.

Use trusted, scoped context; if callers can supply an unreachable future token, bound the wait and reject invalid context rather than allowing unbounded resource consumption. State how caches or projections participate: either they prove the required version has been applied or the read routes around them.

## When the operation requires one snapshot

For snapshot pagination or related reads requiring the same historical view, carry an exact source cut instead of a minimum revision. A newer value can violate that contract. Verify that every source can serve the cut, including deleted or not-yet-created keys; define a bounded failure or restart path when history is unavailable. Test replicas ahead and behind the cut plus history compaction. [Quicksilver's proxy design](https://blog.cloudflare.com/quicksilver-v2-evolution-of-a-globally-distributed-key-value-store-part-1/) illustrates the distinction; [etcd 3.6 Range](https://etcd.io/docs/v3.6/learning/api/) exposes historical revisions and compacted-history errors. Minimum-version reads need no exact-cut protocol.

For a projection whose baseline overlaps live updates, read [projection-rebuild.md](projection-rebuild.md).

## Preserve semantics during failure

Distinguish “value absent at a source that satisfies the context” from “replica has not applied the creation yet.” Define what happens during lag, partition, timeout, or unavailable primary. Silently falling back to a stale source changes the contract. A pending response can be correct even when an immediate stale success is not.

A freshness guarantee concerns what a read may observe. It does not reserve that state for a later write. Apply an authoritative conditional mutation or transaction when the subsequent action depends on the observation.

## Check product-specific requirements

- MongoDB causal guarantees depend on the documented read/write concerns and session ordering. Its documentation describes passing operation time and cluster time between sessions; use the installed driver's supported API instead of inventing a portable session header.
- DynamoDB has different read options for tables, local secondary indexes, global secondary indexes, and streams. Verify the exact resource and topology.
- etcd calls one read option `serializable`, but those reads can be stale relative to quorum. Its watch stream has separate guarantees; a watch-fed cache does not automatically inherit the key-value API's default linearizable behavior.

## Verify

Commit revision 8, hold a read source at 7, and issue the dependent request with its real context. Assert that the result satisfies the context or follows the specified wait/fallback/pending path. Test a wait deadline and a failover/token-invalidity path when the chosen design depends on them. Confirm a read without the dependency retains its intentionally weaker or stronger contract.

Where monotonic reads are promised, repeat the rerouting test for a session that only read revision 8 and made no writes.

Sources: [MongoDB isolation, consistency, and recency](https://www.mongodb.com/docs/manual/core/read-isolation-consistency-recency/), [MongoDB causal concerns](https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/), [DynamoDB read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html), and [etcd API guarantees](https://etcd.io/docs/v3.5/learning/api_guarantees/).
