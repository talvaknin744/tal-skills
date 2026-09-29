# Cache coherence

Use this branch when cache state disagrees with the contract, especially after a fill, invalidation, deletion, eviction, restart, or delayed response. Trace all of those paths together.

## Establish what the cache may promise

For permissive reads, define acceptable lag and failure behavior. For decisions that enforce a business invariant, let the authoritative mutation validate the decision even when a cache supplies the display. A fresh display cannot guarantee a later reservation succeeds.

Cache-aside does not itself provide cache/store consistency. Committing to the database and then deleting a cache key leaves an interval before invalidation and can race with an old fill. A TTL limits the lifetime of an inserted entry; it does not establish source freshness when a delayed or replica-stale value is inserted later. A strict freshness claim requires the complete read/write protocol to support it, or an authoritative read path with suitable semantics.

## Reproduce the competing writes

Use this minimal history as a hypothesis to verify in code:

1. A misses cache and reads source revision 7; pause its response.
2. B commits revision 8 and invalidates or updates the cache.
3. A resumes and fills revision 7.

Version checks are useful only when rejection and fill form one atomic cache transition. Read-compare followed by unconditional SET permits another race. Redis transactions or server-side operations can enforce a transition within Redis; they do not include the database commit in the same transaction. Check the actual Redis command/client/version and execution-error semantics.

## Keep ordering evidence alive

When proposing a versioned cache or a cache-issued fill lease, specify:

- Who issues the revision or fill permission, and which source snapshot supplies both payload and revision. Reading them in separate rounds can label an old payload with a new version.
- Which atomic operation accepts a fill and which operation revokes it. A client-side lease check before a later write leaves a gap.
- What happens to the ordering floor or outstanding permission on eviction, expiration, deletion, restart, and restore. If revision 8 disappears and an old revision 7 fill treats absence as permission, the bug returns.
- How a deleted entity stays deleted while old reads and events remain in flight. Tombstone retention and compaction need the same ordering proof.

Possible repairs include a generation that survives value eviction, revocable cache-issued fill permissions with defined loss semantics, or an authority check/refill protocol after metadata loss. Select one only after specifying how it handles races with a new invalidation. Ordinary cache deployments do not inherit Facebook's historical lease protocol simply by using the word “lease.”

These mechanisms can prevent regression among versions the cache has observed. They do not automatically make reads linearizable with a database write the cache has not yet learned about. State the residual invalidation delay and required fallback honestly.

## Verify freshness and failure cost

Force the three-step history, then repeat with eviction or metadata loss before the delayed fill. Check a deleted record and payload/revision pairing where relevant. Exercise unavailable cache or ordering metadata: a correctness-sensitive path must keep its contract through wait, authoritative routing, or explicit failure.

If bypassing cache increases database traffic, assess capacity, request coalescing, and load shedding within the requested scope. Record stale-version observations or convergence delay against the chosen contract; a high hit rate is not evidence of freshness.

Sources: [Meta's cache consistency failure analysis](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/), [Facebook Memcache paper, §3.2.1](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf), [Redis transactions](https://redis.io/docs/latest/develop/using-commands/transactions/), [Microsoft Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), and [Amazon caching challenges](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/).
