# Cache load protection: source and gap audit

Researched 2026-09-29. The existing `microservice-operations` package is the right entry point: add a conditional reference reached from capacity guidance. No new public skill is necessary. The user asked to choose before creating another skill; this extension creates none. [Structured source and practice cards](cache-load-protection.json) record triggers, mechanisms, limits, counterexamples, verification schedules, and reading scope.

## Coverage and ownership

| Existing package | Already covered | Narrow addition |
|---|---|---|
| `microservice-operations` | Origin admission, cache loss, allowed staleness, deadlines, service authorization | Expiry timing, negative entries, Bloom readiness, Redis traversal; shared-load lifecycle in its existing capacity reference |
| `concurrency-correctness` | Conditional fills, revision floors, tombstones, dependent reads, restore/bootstrap, resource fencing | Apply these established invariants to absent values and filter generations; no duplicate race manual |
| `idempotency` | Mutation identity, takeover, uncertain effects, authorization before replay | No new read-cache trigger; at most an implementation-specific lease release/renewal clarification |

The audit read each entrypoint and all existing references in these three packages, including the recently added cache/projection guidance. `research_storage` owns capacity and source routing. This task initially owned the new [cache-load reference](../../../skills/engineering/microservice-operations/references/cache-load-protection.md) and these two records; subsequent authorization added one cache-lease paragraph and its source row in `concurrency-correctness`. Independent examples and source review have separate owners.

## Findings that change implementation

Expiry spreading and refresh-ahead solve different problems. Jitter spreads many keys' deadlines; a refresh buffer starts work before one value becomes unusable. Neither creates exclusivity for a hot key. Freshness limits still bound both. The Redis pattern article supports jitter but its broad latency assurances are not adopted. [Redis, 2026-05-13](https://redis.io/blog/how-to-tame-the-thundering-herd-problem/)

The new user notes incorrectly describe XFetch as selecting exactly one worker. The primary paper analyzes probabilistic regeneration; Cloudflare explicitly admits zero or multiple refreshes. Its lock-free tradeoff can be appropriate when duplicate refresh is harmless and origin admission remains bounded. The paper's algorithm and assumptions are not a production correctness proof. [XFetch paper, §5 and Figure 3](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), [Cloudflare, 2024-12-26](https://blog.cloudflare.com/sometimes-i-cache/)

Refresh scheduling needs a before-expiry trigger. Redis notifications can follow expiration late and disappear during disconnection, so subscribing to expired events does not provide one. [Official notification contract](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/)

Negative caching needs an absence contract. A hidden object, transient lookup failure, and confirmed nonexistence are different results. Our application guidance adds caller scope and the create-versus-delayed-negative race to AWS's negative-cache mechanism. A short TTL is a selected staleness allowance, not a universal five-minute default. [AWS caching discussion, reused research](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)

Bloom membership is not automatically database membership. Asynchronous inserts or incomplete rebuilds can hide existing records if negatives bypass the source. A missing Redis filter also returns zero. Generation admission, synchronization and bounded fallback are application responsibilities; standard Bloom deletion is not available. [Bloom overview](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/), [BF.EXISTS](https://redis.io/docs/latest/commands/bf.exists/)

`SCAN` reduces individual traversal work but supplies neither a snapshot nor a strict batch-size bound. Maintenance must handle repeated keys, empty nonterminal batches and concurrent mutation. [KEYS](https://redis.io/docs/latest/commands/keys/), [SCAN](https://redis.io/docs/latest/commands/scan/)

The shared-loader lifecycle belongs with existing capacity guidance. A library's same-key suppression does not choose authorization equivalence, waiter limits, or cancellation ownership for the application. In Go, `Forget` permits a replacement to run while the previous call remains active. [Pinned singleflight v0.23.0 API](https://pkg.go.dev/golang.org/x/sync@v0.23.0/singleflight)

Lease guidance should stay in the existing correctness references. A unique random token enables atomic safe release/renewal; it is not a resource-enforced ownership generation. Uncertain renewal, pauses and failover can leave overlapping work. The current reference already explains fencing. A subsequent authorized addition in `cache-coherence.md` covers owner-checked release and renewal uncertainty, with a local pointer to that existing explanation; idempotency remains unchanged. [Official Redis lock discussion](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)

Meta's cache-issued leases also invalidate stale publication rights; reducing lease duration alone does not recreate that mechanism. Serving an older value while a lease is held requires an explicit stale-serving allowance. This is a reused historical source, not a claim about standard Redis behavior. [Scaling Memcache at Facebook, §3.2.1](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf)

## Evidence limits and next checks

The JSON contains eight executable scenario designs. Particularly useful schedules are: create while an old absence lookup is paused; lose a filter after a separate readiness check; cancel one shared-load waiter; and let an expired owner release a successor's lock. These were not run by this research task. An independent example owner will distinguish real Redis behavior from application models.

Reading consisted of current primary command/library sections, one new Redis pattern article, selected Cloudflare and XFetch sections, and reread AWS/Meta sections. There is no claim of new incident coverage or rereading complete books. No benchmark numbers, copied implementations, or universal TTL defaults are adopted.
