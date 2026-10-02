# Cache coherence

Use this branch when cache state disagrees with the contract, especially after a fill, invalidation, deletion, eviction, restart, or delayed response. Trace all of those paths together.

## Establish what the cache may promise

For permissive reads, define acceptable lag and failure behavior. For decisions that enforce a business invariant, let the authoritative mutation validate the decision even when a cache supplies the display. A fresh display cannot guarantee a later reservation succeeds.

Cache-aside does not itself provide cache/store consistency. Committing to the database and then deleting a cache key leaves an interval before invalidation and can race with an old fill. A TTL limits the lifetime of an inserted entry; it does not establish source freshness when a delayed or replica-stale value is inserted later. A strict freshness claim requires the complete read/write protocol to support it, or an authoritative read path with suitable semantics.

When a write commits but invalidation fails, specify the caller's result, the dependent reader's path, and who repairs the gap. Success may permit stale reads under a declared contract; strict read-after-write needs a supported freshness check, authoritative routing, or explicit pending/unavailable result. Preserve a known database commit separately from the cache error; repeating the mutation requires its own retry safety. Force this failure between commit and response, then read through another service. [Uber's CacheFront account](https://www.uber.com/us/en/blog/how-uber-serves-over-150-million-reads/) illustrates successful writes despite failed invalidation, not cross-store atomicity.

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

### Scope versions to the entity

If deletion/recreation can reuse a key and revision, revision equality alone can
accept an old entity's delayed result. Bind payload and revision to a non-reused
incarnation, or use an equivalent durable version that cannot repeat across
recreation. Establish the current incarnation through the authority or its
supported ordered history, then compare identity and revision atomically at
publication. An arbitrary incarnation token is an identity, not a sortable
generation. Metadata loss still needs the admission/recovery rule above.

Force a fill for incarnation X/revision 1 to resume after deletion and recreation
as Y/revision 1. Reject X and preserve Y's value. Read identity, revision and
payload from the same source snapshot; a matching numeric revision cannot repair
fields assembled across two incarnations.

Possible repairs include a generation that survives value eviction, revocable cache-issued fill permissions with defined loss semantics, or an authority check/refill protocol after metadata loss. Select one only after specifying how it handles races with a new invalidation. Ordinary cache deployments do not inherit Facebook's historical lease protocol simply by using the word “lease.”

If a loader uses a Redis lock, release and renew only through an atomic comparison against its unique acquisition token; separate GET and DEL/PEXPIRE calls can affect a successor's lock. A lost renewal response leaves extension uncertain: stop protected work when valid ownership cannot be established. In-flight fills still need atomic revision/permission validation at the cache. A safe-unlock token does not supply the resource fencing described in [obsolete owners](delayed-work.md#obsolete-owners-and-delayed-requests). Test an expired holder releasing after a successor acquires, then a lost renewal response followed by a delayed fill. Check the deployed command/client protocol; [Redis documents](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) owner-checked Lua operations and conditional release with DELEX from Redis 8.4.

These mechanisms can prevent regression among versions the cache has observed. They do not automatically make reads linearizable with a database write the cache has not yet learned about. State the residual invalidation delay and required fallback honestly.

If strict reads rely on freshness metadata, gate cache admission during startup on evidence that its authority covers the participating writers and recovered history. While that evidence is unavailable, use the contract's authoritative read or unavailable path. Test initialization with surviving stale values and delayed fills, before and after admission. [Dropbox Chrono](https://dropbox.tech/infrastructure/meet-chrono-our-scalable-consistent-metadata-caching-solution) demonstrates why startup belongs in the correctness argument; its storage-enforced timestamp bounds are prerequisites, not portable cache settings.

For a cache or projection rebuilt while source writes continue, read [projection-rebuild.md](projection-rebuild.md) for the snapshot/live-stream handoff.

## Verify freshness and failure cost

Force the three-step history, then repeat with eviction or metadata loss before the delayed fill. Check a deleted record and payload/revision pairing where relevant. Exercise unavailable cache or ordering metadata: a correctness-sensitive path must keep its contract through wait, authoritative routing, or explicit failure.

If bypassing cache increases database traffic, assess capacity, request coalescing, and load shedding within the requested scope. Record stale-version observations or convergence delay against the chosen contract; a high hit rate is not evidence of freshness.

Derive permitted results independently of the fill/merge implementation from
definitively committed operations and the declared freshness contract. Inspect
actual entries as well as expected lookups to detect resurrected or wrong-entity
values. A complete projection compares expected and actual identity/value sets
in both directions at one supported cut. A sparse cache may legitimately omit
entries and permit declared lag; verify those permissions rather than requiring
every source key to be cached. Reconcile unknown mutation outcomes before using
them as oracle facts.

Sources: [Meta's cache consistency failure analysis](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/), [Facebook Memcache paper, §3.2.1](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf), [Redis transactions](https://redis.io/docs/latest/develop/using-commands/transactions/), [Microsoft Cache-Aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), and [Amazon caching challenges](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/).
