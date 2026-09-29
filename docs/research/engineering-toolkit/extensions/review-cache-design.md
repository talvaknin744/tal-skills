# Independent follow-up review: cache design

Reviewed 2026-09-29. **No remaining material findings** in the five frozen
targets below. The existing `microservice-operations` skill now reaches
conditional cache-design guidance; no separate Redis skill was created.

This follows [the earlier cache/storage review](review-cache-and-storage.md).
That report remains a record of its original hashes. This review covers the new
`cache-design.md`, subsequent capacity navigation and source additions, and the
Redis claim ledger. Removing only the new navigation paragraph and appended
source section reproduces the earlier capacity/source hashes exactly. The
earlier implementation text was therefore preserved, not silently re-reviewed
as a new candidate.

## Finding resolved before closure

The coordinating review identified an overstatement at `cache-design.md:9`:
timeout of a replication/persistence wait does not make a previously
acknowledged write's execution unknown. The final reference and research
narrative distinguish a lost enqueue reply from an unconfirmed durability
target, and state that waiting does not undo preceding writes. The ledger
already kept lost-reply uncertainty separate. Independent rechecking of
[WAIT](https://redis.io/docs/latest/commands/wait/) and
[WAITAOF](https://redis.io/docs/latest/commands/waitaof/) confirms that returned
counts must be inspected even after timeout; the commands report preceding
writes on the same connection. Neither establishes strong consistency.

## Primary-source checks

| Design boundary | Result |
|---|---|
| Write-behind acceptance and recovery | The reference distinguishes accepted buffering from the final database effect, requires persistence/failover policy and stable operation identity, and bounds admission and backlog. Recoverable delivery does not make an external effect atomic. Processing-list transfer and pending ownership support recovery; commit-before-ACK still requires duplicate-safe effects. [Persistence](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/), [LMOVE](https://redis.io/docs/latest/commands/lmove/), [XCLAIM](https://redis.io/docs/latest/commands/xclaim/) |
| Retained payload | Default stream trimming can remove an unacknowledged payload while retaining its pending reference. The ledger correctly scopes the newer acknowledgement-aware trimming option and does not treat it as a future replay guarantee. [XTRIM](https://redis.io/docs/latest/commands/xtrim/) |
| Invalidation fan-out | `BCAST` trades per-key tracking for prefix subscriptions, including notifications for unread matching keys. Narrow prefixes can remove unrelated traffic, but do not eliminate hot-prefix fan-out. The candidate also requires a recovery/bypass policy when tracking continuity is lost. [Client tracking](https://redis.io/docs/latest/develop/reference/client-side-caching/) |
| Freshness evidence | `XLEN` counts retained entries. Group pending/lag concern delivery progress; lag can be unavailable and zero lag need not mean effects are complete. Replication history IDs and byte offsets are separate from these measures and from elapsed freshness. Primary routing is appropriately qualified by asynchronous failover. [XLEN](https://redis.io/docs/latest/commands/xlen/), [group metrics](https://redis.io/docs/latest/commands/xinfo-groups/), [INFO](https://redis.io/docs/latest/commands/info/), [replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/) |
| Salted copies | The candidate requires actual placement and writer/delete/stale-fill coherence instead of treating suffixes as automatic capacity. Shared hash tags can keep copies on one slot; immutable version-addressed copies still require a publication contract. These are application deductions from the documented distribution boundary. [Cluster specification](https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/) |
| Eviction and TTL | Policy follows eligible loss and workload. Volatile policies can evict TTL-bearing correctness state before expiry; `noeviction` requires rejected-write handling and is not restart durability. No universal TTL or eviction policy is prescribed. [Eviction contract](https://redis.io/docs/latest/develop/reference/eviction/) |
| Resource budgets | The guidance distinguishes command cost, bytes, batches and concurrency. Pipelining queues replies and does not create a transaction. I/O threads do not eliminate expensive-command interference; asynchronous key reclamation is not an immediate RSS promise. Vendor benchmark gains and arbitrary member-count limits were not adopted. [Pipelining](https://redis.io/docs/latest/develop/using-commands/pipelining/), [UNLINK](https://redis.io/docs/latest/commands/unlink/), [Redis 8 I/O-thread account](https://redis.io/blog/redis-8-ga/) |

The research record contains 23 scoped source entries, seven practice cards and
nine correction records. This review independently checked the material claims
above against selected primary sections; it does not claim another complete
read of every supplementary source or a deployed-version compatibility test.
The record distinguishes original application deductions from command
guarantees and keeps prior standalone cache examples separate from unexecuted
replication, durability, fan-out and throughput scenarios.

## Verification and frozen targets

Checks passed for frozen hashes, JSON/source/practice references, local paths
and anchors, tracked/new-file whitespace, and the unchanged skill entrypoint.
No models, runtime scenarios, infrastructure changes, or performance experiments
ran in this review. The reviewer changed only this report. Application
correctness and capacity still require the reference's project-specific checks.

SHA-256 values, with repository-relative paths:

| Path | Hash |
|---|---|
| `skills/engineering/microservice-operations/references/cache-design.md` | `cb531eadc45f2c520a8f29865d49e372532ad0c1632f3e084581b7883b165d5f` |
| `skills/engineering/microservice-operations/references/capacity.md` | `0783f9608fdef098b3433279a0c7606dd9ed6b38b37158a34722f55e7b79b793` |
| `skills/engineering/microservice-operations/references/sources.md` | `ec9d33af971abb9a150bc89dabc01a6d1a4b77703bb333461d2583bac6fb3730` |
| `docs/research/engineering-toolkit/extensions/redis-high-throughput.md` | `b100a4b6c1c390e2b7a77ebafbd11f051ff63f82c3d14bf7c2de992d8017ac41` |
| `docs/research/engineering-toolkit/extensions/redis-high-throughput.json` | `4a610b8c4923da6f969c8483ee964f53d0a25cb2a2a03c477f38b244b5d19622` |
