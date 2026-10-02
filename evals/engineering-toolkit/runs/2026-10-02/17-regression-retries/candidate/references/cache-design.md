# Design a cache around its contract

Use when choosing cache placement, read/write policy, retention, or scaling. Record the authoritative store, required freshness, acceptable loss, workload skew, and constrained resource. Select only the branches the design needs; “high throughput” supplies none of those answers.

## Decide what success acknowledges

For cache-aside, a database commit and cache invalidation are separate outcomes; define failed-invalidation repair and dependent-read behavior. For write-behind, accepted buffering is distinct from a committed database effect. Specify persistence, failover loss, replay inputs, stable operation identity, and reconciliation before acknowledging mutations.

With Redis, verify actual persistence settings and command support. `WAIT` confirms replica receipt; `WAITAOF` confirms AOF fsync counts for preceding writes on the same connection. Check returned counts; neither creates strong consistency. A timeout does not undo preceding writes; distinguish an unconfirmed durability target from the write's known or unknown outcome. [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), [WAIT](https://redis.io/docs/latest/commands/wait/), [WAITAOF](https://redis.io/docs/latest/commands/waitaof/)

## Keep buffered work recoverable and bounded

If writes are buffered, compare sustained arrival and drain rates; bound admission, bytes, age, batches, and concurrency. Backlog growth requires an overload outcome, not unlimited buffering. Preserve payload and identity through the supported replay horizon.

Redis consumer groups or list-to-processing-list transfer support recovery; destructive popping can lose work. Commit duplicate-safe effects before ACK/removal. Reclaiming a message does not fence an old worker at the database. Default stream trimming can remove pending payloads. [LMOVE](https://redis.io/docs/latest/commands/lmove/), [XCLAIM](https://redis.io/docs/latest/commands/xclaim/), [XTRIM](https://redis.io/docs/latest/commands/xtrim/)

## Choose read freshness and invalidation cost

Trace L1, shared cache, and replica paths together. Require evidence that dependent reads include their acknowledged write, or use a bounded authoritative/pending path. Primary routing avoids ordinary replica delay; asynchronous failover can still lose acknowledged history.

For Redis, `XLEN` is retained stream cardinality; group `pending` and `lag` describe consumer progress. Replication uses separate history IDs and byte offsets; health timestamps are not freshness proof. [Replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/), [group metrics](https://redis.io/docs/latest/commands/xinfo-groups/)

If using client tracking, measure invalidation traffic against saved reads. `BCAST` sends matching changes to every prefix subscriber, including clients that never read the key. Narrow prefixes do not eliminate hot-prefix fanout. Define local-cache invalidation/bypass when tracking continuity is lost. [Tracking](https://redis.io/docs/latest/develop/reference/client-side-caching/)

## Separate hot keys from large values

Measure request concentration, command cost, payload bytes, and network saturation separately. Partitioning distributes distinct keys; it does not split one hot value automatically. Salted copies need actual node distribution plus partial-update, delete, and stale-fill recovery. Immutable version-addressed copies have a narrower coherence problem; partitioned counters require explicit aggregation semantics. Redis hash tags can colocate every copy. [Cluster distribution](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/)

For shared origin reads, use [coalescing boundaries](capacity.md#hot-keys-and-shared-reads). For expiry, negative entries, membership filters, or enumeration, use [cache load protection](cache-load-protection.md).

## Choose what may disappear

Classify disposable values separately from ordering floors, locks, deduplication records, and accepted work. Redis volatile policies select TTL-bearing keys; they can evict before expiry. TTL is not a minimum retention guarantee. Choose policy from acceptable loss and access patterns; separate roles where needed. `noeviction` requires rejected-write handling and does not establish durability. Plan bounded origin admission during cold start, mass eviction, outage, and recovery. [Eviction](https://redis.io/docs/latest/develop/reference/eviction/)

## Bound command and pipeline work

Budget command/reply bytes, batch sizes, concurrency, and elapsed time. Pipelining reduces round trips but queues replies in memory; it does not supply a transaction. Redis I/O/background threads do not remove expensive-command interference. `UNLINK` detaches keys before asynchronous reclamation; RSS may remain high. Select measured limits rather than a universal collection count. [Pipelining](https://redis.io/docs/latest/develop/using-commands/pipelining/), [UNLINK](https://redis.io/docs/latest/commands/unlink/)

**Done:** document each chosen contract and its failure check: lost ACK, sustained backlog, interrupted invalidation, partial copy update, metadata loss, or cold-cache fallback. In implementation mode, record executed outcomes, foreground latency, and resource bounds; in design mode, mark these as proposed checks.
