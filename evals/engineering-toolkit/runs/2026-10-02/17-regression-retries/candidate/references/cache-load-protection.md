# Cache load protection

Use the relevant branch when synchronized expiry, repeated missing IDs, or cache maintenance overloads an origin. Establish the allowed staleness and origin admission limit first. For shared in-flight loads, caller equivalence, cancellation, and hot-key ownership, use [Hot keys and shared reads](capacity.md#hot-keys-and-shared-reads).

## Expiry jitter and refresh-ahead

**Many keys expire together:** independently spread their deadlines over a bounded window. Keep every deadline within the freshness contract; if the base TTL is already the maximum, subtract jitter. Measure the resulting miss distribution. Jitter does not prevent many readers missing the same hot key. [Redis pattern discussion](https://redis.io/blog/how-to-tame-the-thundering-herd-problem/)

**A hot value should refresh before expiry:** separate its refresh deadline from its hard serving deadline. Size the buffer against measured load latency and the bounded retry budget; coalesce refreshes and spread their schedules. A failed refresh may retain the old value only within the declared stale-serving allowance. Preserve source revision/age when refreshing: reading an already stale replica must not silently reset the freshness proof. [AWS soft/hard TTL discussion](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

Use a scheduler or access-triggered refresh that can act before the deadline. Redis expired-key notifications occur after deletion, may arrive late, and lose events during disconnection; they cannot establish timely refresh. [Notification contract](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/)

Probabilistic early refresh, including XFetch, can reduce simultaneous regeneration without selecting exactly one worker. Test zero and multiple refresh contenders; keep origin admission and hard expiry explicit. Choose actual coordination if overlapping refresh work is unacceptable. [Primary paper, §5](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), [Cloudflare's tradeoff](https://blog.cloudflare.com/sometimes-i-cache/)

## Repeated nonexistent IDs

Cache an explicit absence result only after an authoritative lookup established it. Keep transient failure distinct. Select a short bounded negative TTL from the acceptable delay in discovering newly created objects; invalidate or supersede negatives on creation when the contract requires it. A delayed pre-create lookup can republish absence after invalidation, so strict create-then-read behavior needs conditional publication or authoritative fallback. The same stale-fill race applies to positive entries.

Share a negative entry only across callers for whom absence has the same meaning: include tenant/query scope and enforce authorization per request. A hidden object or denied request is not evidence of global absence. Bound entry count/admission because arbitrary missing IDs can exhaust the cache. Verify miss → create → delayed negative fill, different tenants sharing an ID, and an origin timeout. [Negative-cache basis](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

## Bloom filters before database misses

Use a filter only when absent-key traffic justifies its maintenance. A positive requires an ordinary lookup; a negative describes the represented set. Skipping the database additionally requires proof that this filter generation covers all records visible to the request. An asynchronously updated or incomplete filter cannot supply that proof. Retained deleted members merely cause extra lookups; a standard Bloom filter does not support safe individual deletion. [Bloom contract](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/)

Specify bootstrap, write synchronization, and rebuild/catch-up before promoting a generation. Check readiness and membership without a loss/replacement race; a separate existence check followed by a membership query is insufficient. Redis `BF.EXISTS` also returns zero for a missing filter. Missing, unready, or uncertain generations need a bounded authoritative fallback or explicit unavailability, never a fabricated absence. [Command contract](https://redis.io/docs/latest/commands/bf.exists/)

Verify database commit before filter update, incomplete rebuild, and filter loss between readiness and lookup. In each case, an existing record must remain discoverable or the request must report the declared unavailable outcome. A filter does not enforce database uniqueness or authorization.

## Redis keyspace maintenance

For a large live keyspace, replace blocking `KEYS` enumeration with paced cursor iteration where its semantics fit. `SCAN` can repeat keys, return an empty batch before completion, and observe mutations inconsistently. Finish at cursor zero; make processing duplicate-safe. `COUNT` is a hint, not a latency or result-size bound. Bound downstream batches/concurrency and verify client coverage across shards. A full scan remains linear work; `MATCH` is not an index. Use a supported snapshot or application index when the task requires an exact view. [KEYS](https://redis.io/docs/latest/commands/keys/), [SCAN](https://redis.io/docs/latest/commands/scan/)

Test concurrent insert/delete, repeated keys, empty nonterminal batches, and foreground latency during enumeration. Report the observed workload and limits, rather than calling a cursor loop nonblocking by construction.

**Done:** the chosen branch has a reproducible failure schedule, an explicit freshness/fallback contract, and measured bounds on origin calls or maintenance work. These source-backed scenarios are requirements for a project-specific check, not claims that this reference executed them.
