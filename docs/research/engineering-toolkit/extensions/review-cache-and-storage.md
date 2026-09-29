# Independent review: cache load protection and Discord storage

Reviewed 2026-09-29 by a separate source reviewer. **No material findings** in
the frozen references or their research records below. This review checked
technical claims, source scope, transfer limits, and package-local navigation.
It did not execute cache/storage scenarios, run models, operate infrastructure,
or change the authors' files. Proposed checks are not observed runtime results.

## Source checks and adversarial histories

| Boundary | Review result |
|---|---|
| Expiry jitter and refresh | `cache-load-protection.md` keeps jitter within the freshness ceiling, distinguishes refresh timing from hard serving expiry, and preserves source age when refreshing from a replica. The soft/hard distinction agrees with [Amazon's caching discussion](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/). The [Redis pattern article](https://redis.io/blog/how-to-tame-the-thundering-herd-problem/) supplies a technique, not a portable latency guarantee. |
| Refresh notification | The reference correctly rejects expired-key notifications as a before-expiry scheduler. Redis documents delayed deletion events and loss during subscriber disconnection. [Notification contract](https://redis.io/docs/latest/develop/pubsub/keyspace-notifications/) |
| Probabilistic refresh | The added XFetch paragraph does not promise one winner. The paper's §5/Figure 3 samples early expiration using measured recomputation time; its expected stampede result is not mutual exclusion. Cloudflare explicitly allows zero or multiple origin calls. [Primary paper](https://cseweb.ucsd.edu/~avattani/papers/cache_stampede.pdf), [Cloudflare explanation](https://blog.cloudflare.com/sometimes-i-cache/) |
| Negative caching | The candidate separates authoritative absence, denied visibility, and transient failure. Its create/invalidate/delayed-negative history exposes the stale-publication race; a short TTL alone only bounds the permitted delay. Tenant/query equivalence, per-request authorization, and entry admission remain explicit application requirements. This is a sound extension of the AWS mechanism, not an asserted AWS protocol. |
| Bloom absence | The candidate requires generation completeness for request-visible records and handles loss between readiness and membership. This is necessary because `BF.EXISTS` zero also covers a missing filter. An ordinary Bloom answer concerns its represented set, not an independently updated database. Retained deleted members cost lookups; deleting shared bits is unsafe. The [Bloom command surface](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/), [BF.EXISTS contract](https://redis.io/docs/latest/commands/bf.exists/), and [Cuckoo comparison](https://redis.io/docs/latest/develop/data-types/probabilistic/cuckoo-filter/) corroborate these limits. |
| Keyspace traversal | The reference correctly treats `SCAN` as incremental work, not an exact snapshot, fixed-size page, or latency guarantee. Duplicate keys, empty nonterminal batches, concurrent mutation, cursor completion, downstream pacing, and shard coverage are included. [KEYS](https://redis.io/docs/latest/commands/keys/), [SCAN guarantees](https://redis.io/docs/latest/commands/scan/) |
| Shared reads | `capacity.md` separates routing affinity from result identity, checks strict post-write readers and visibility, bounds active calls/waiters/keys, and assigns cancellation to the appropriate owner. Go's pinned primitive is local to a Group; `Forget` can admit an overlapping call. Tokio permits do not bound every waiting task. [singleflight v0.23.0 source](https://github.com/golang/sync/blob/v0.23.0/singleflight/singleflight.go), [Tokio 1.53.1 semaphore](https://docs.rs/tokio/1.53.1/tokio/sync/struct.Semaphore.html) |
| Lease and fencing | The subsequently authorized `cache-coherence.md` paragraph correctly distinguishes a unique unlock token from resource-enforced stale-owner rejection. Atomic owner-checked release prevents deleting a successor's lease; it does not prove that old work stopped. Renewal uncertainty and in-flight publication checks remain explicit. Redis also distinguishes the Redis 8.4 `DELEX` form from earlier Lua implementations. [Official lock guidance](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/) |
| Historical leases | Meta's cache-issued token can be invalidated by a delete before publication; shortening a generic lease does not reproduce this mechanism. The record preserves this historical implementation boundary and its optional stale-serving policy. [Scaling Memcache at Facebook, §3.2.1](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf) |
| Storage migration | `rollout.md` requires range dispositions, concurrency reconciliation, deletion/expiry/write-order comparisons, and a supported authority-switch recovery path. A nearly complete copy or matching popular samples can still omit cold history. The [ScyllaDB Migrator 2.1.x validator](https://migrator.docs.scylladb.com/stable/validate.html) supports timestamp/TTL tolerances; its write-pause instruction is specifically for MySQL-to-ScyllaDB. The candidate does not universalize it. |
| Tombstones and diagnostics | The candidate avoids making forced compaction or reduced deletion retention a general migration fix. Repair/deletion evidence and maintenance capacity remain prerequisites. Node-local, per-SSTable Scylla diagnostics also cannot establish absence of hot request traffic; older SSTables may lack the newer metadata. [Cassandra tombstones](https://cassandra.apache.org/doc/latest/cassandra/managing/operating/compaction/tombstones.html), [ScyllaDB diagnostics](https://docs.scylladb.com/manual/stable/troubleshooting/large-partition-table.html) |

The complete accessible main narrative of [Discord's 2023 account](https://discord.com/blog/how-discord-stores-trillions-of-messages)
supports hot-partition diagnosis, channel-affine coalescing, checkpointed token
range migration, tombstone-heavy final ranges, and comparison reads. It does not
publish the full authorization, shared-loader cancellation, deletion/TTL
reconciliation, or admission contracts proposed here. The research labels these
as engineering inferences and does not transfer Discord's node counts, engine
choice, language choice, or historical performance into universal advice.

## Provenance and verification limits

Both records distinguish documentation reading from experiments. The cache
record has eight practice cards and twelve source records, including selected
Cloudflare/XFetch sections and reused AWS/Meta sections. The Discord record
counts one new deep article and no new publisher. No whole-book reading or
additional incident coverage is claimed by this review.

One nonblocking provenance clarification: the current Bloom overview does not
explicitly explain individual deletion in prose. Its command list and the
Cuckoo comparison substantiate the correct limitation; this review does not
treat that wording as an additional section read in the Bloom page.

Redis documents were read as current documentation, not tested against an
installed Redis version. Reading pins independently checked were Go x/sync
v0.23.0, Tokio 1.53.1, ScyllaDB manual 2026.3, Migrator 2.1.x, and the Cassandra
page displaying 5.0. Tokio's page failed in the web extractor but was accessible
through direct HTTPS. Discord's embedded diagrams were not inspected; selected
paper text was sufficient for the claims checked, without auditing proofs or
reproducing experiments.

Local checks verified the research JSON/source references, referenced paths and
the new capacity anchor, unchanged skill entrypoints, and scoped whitespace.
These establish packaging and textual consistency, not agent behavior or a
working cross-store cache protocol. No required correction remains.

## Frozen review targets

Paths are relative to the repository root; hashes are SHA-256.

| Path | Hash |
|---|---|
| `skills/engineering/microservice-operations/references/cache-load-protection.md` | `04beae92e71a1f40e78efafdbac713fd1483efd4b4615a47d8491c6ca4bcc579` |
| `skills/engineering/microservice-operations/references/capacity.md` | `5a340d5f308b31891baa7df1e39d4f0a8aa04fd3f8d00e292886552ece9f06e9` |
| `skills/engineering/microservice-operations/references/sources.md` | `e0b140695e418c360f718b3c2f56c315452c11a787a2df22862eb4f1d0c03e25` |
| `skills/infrastructure/infrastructure-change-safety/references/rollout.md` | `6bf253f6f1dd281fa4c17402f27cc5ca803f851084f585e21acab39a2accbafc` |
| `skills/engineering/concurrency-correctness/references/cache-coherence.md` | `508c569843c5fc428e2dbc2872daa46d7dbabc5661d435c66bf7881f5927e45b` |
| `skills/engineering/concurrency-correctness/references/sources.md` | `f518e7bf02e910a92070b040db354b869064870781c48734eba70b8d3a5be5bf` |
| `docs/research/engineering-toolkit/extensions/cache-load-protection.md` | `5835bf53db519a2629f241d8a22d2d8f8127eeca573db1df700b71210752c4ea` |
| `docs/research/engineering-toolkit/extensions/cache-load-protection.json` | `2220e3a5275b8de6a7397822041a2dd59ace927bd00b0318b2a361b181695102` |
| `docs/research/engineering-toolkit/extensions/discord-message-storage.md` | `1fcc61413653b82b5a1d79d7814a1aea59aecdbab7ae8d0c025b6bea5db46e2a` |
| `docs/research/engineering-toolkit/extensions/discord-message-storage.json` | `7cadcd3707e03f6e114b0d2cc2e8e416413feefdf021eff695b3cb9f3cb8a24e` |
