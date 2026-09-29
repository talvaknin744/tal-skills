# Cache consistency: three additional primary accounts

Research date: 29 September 2026. This extension adds **three new deep article reads**,
not three new skills. Exact publication dates, access scope, source records,
practice cards, and the hashes of compared references are in
[cache-consistency.json](cache-consistency.json). No runtime experiment or model
evaluation was performed in this extension.

The prior lane inventories and research tree were checked for these URLs and
titles. Meta's *Cache made consistent*, the Facebook Memcache paper, and Amazon's
caching article were excluded because they were already read. Existing notes on
etcd recovery are a crosscheck, not another new article.

## What the articles add

| New primary account | Contract and useful difference |
| --- | --- |
| [Dropbox Chrono](https://dropbox.tech/infrastructure/meet-chrono-our-scalable-consistent-metadata-caching-solution), 25 July 2024; Lihao He, Ganesh Rapolu, Yu-Wun Wang | Its freshness authority precedes every write; Panda enforces a commit-time upper bound. Restart restores a persisted bound before serving. The authors found a startup bug their initial steady-state model omitted. |
| [Uber CacheFront](https://www.uber.com/us/en/blog/how-uber-serves-over-150-million-reads/), 26 August 2025; Preetham Narayanareddy, Eli Pozniansky | Write-path invalidation improves consistency, but a successful database write still receives success if invalidation fails. Database timestamps replace application-clock markers; negative entries and follower fills also matter. |
| [Cloudflare Quicksilver, Part 1](https://blog.cloudflare.com/quicksilver-v2-evolution-of-a-globally-distributed-key-value-store-part-1/), 10 July 2025; Anton Dort-Golts, Marten van de Sanden | A proxy preserves its replication cut using historical versions, deletion history, and protected recent updates. Both a newer and an older replica can be unsuitable for that exact cut. |

These are accounts of integrated proprietary systems. Chrono is not a Redis
configuration recipe. Quicksilver's stated sequential consistency is not a
claim of globally current reads. CacheFront's stronger practical consistency is
not an unconditional read-after-write guarantee. No proposed improvement
requires every read to become linearizable.

## Ranked repository improvements

The recommendations below are original application guidance; the JSON contains
each trigger, failure, mechanism, limit, counterexample, and verification case.

1. **Make the acknowledgement boundary explicit.** Extend
   [cache-coherence.md](../../../../skills/engineering/concurrency-correctness/references/cache-coherence.md)
   with a conditional check for database commit followed by failed cache work:
   which result reaches the caller, what a dependent reader may observe, and
   who repairs the gap? Preserve the successful database outcome when reporting
   a cache failure; retrying a business mutation is a separate decision.
   Existing material explains the gap, but its operational response is implicit.

2. **Verify bootstrap before admission.** The same cache reference already
   requires ordering evidence to survive loss. Add an explicit startup schedule
   with surviving stale values and delayed fills while the freshness authority
   initializes. A cache miss and loss of the authority that validates a hit are
   different states. Prefer a small extension to its existing verification
   paragraph, not another protocol manual.

3. **Specify the snapshot-to-stream handoff for rebuilds.** Extend
   [ordering-and-replay.md](../../../../skills/messaging/messaging-reliability/references/ordering-and-replay.md)
   only when bootstrap overlaps live traffic. Name the source cut, collision
   handling, recoverable progress, deletion behavior, and admission criterion.
   Its existing complete-state/delta distinction remains necessary. A connector
   guarantee ends before arbitrary downstream parallel processing.

4. **Distinguish an exact snapshot from a minimum observed version.** The
   [replica reference](../../../../skills/engineering/concurrency-correctness/references/replica-reads.md)
   already covers carried causal context and monotonic reads. Add at most a
   conditional note for operations requiring a common historical cut: a newer
   value is not always an acceptable substitute. Define the response when that
   history has been compacted.

The first three deserve priority; the fourth is relevant to snapshot APIs,
pagination, or coordinated configuration reads, not every cache lookup.

## Current documentation crosschecks

- **Redis:** `WAIT` concerns preceding writes on the same connection. A timeout
  can return fewer acknowledgements than requested, and replication
  acknowledgements do not guarantee survival through failover. It cannot turn
  an ordinary cache into Chrono's freshness authority. This is documentation
  validation, not a failover test. [Current command contract](https://redis.io/docs/latest/commands/wait/)
- **etcd 3.6:** a range revision identifies a historical view; a compacted
  revision produces an error. Per-key `version` resets on deletion, unlike the
  store's revision. Field names therefore need explicit comparison semantics;
  revision filters are not a substitute for requesting a snapshot.
  [API, revisions and Range](https://etcd.io/docs/v3.6/learning/api/)
- **Debezium 3.6:** incremental snapshots reconcile buffered row reads with
  streamed changes before emission. Restart can redeliver events; lost retained
  history or failover-slot discontinuity requires an explicit recovery path.
  The connector does not establish arbitrary consumer transaction semantics.
  [PostgreSQL connector](https://debezium.io/documentation/reference/3.6/connectors/postgresql.html)
- **PostgreSQL 18:** exported snapshots provide a supported baseline/stream
  boundary. Slot crash recovery can resend changes; usable failover slots
  require the documented synchronized, persistent state. A version label alone
  is insufficient evidence of continuity.
  [Logical decoding, §§47.2.2–47.2.5](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html)
- **etcd 3.6 recovery:** the existing revision-bump and compaction guidance
  already addresses surviving watch consumers. Keep it in
  [recovered-history.md](../../../../skills/reliability/recovery-validation/references/recovered-history.md).
  Generic applications need their own generation/rebuild contract; this
  extension supplies no additional tested restore recipe.
  [Recovery documentation](https://etcd.io/docs/v3.6/op-guide/recovery/)

## Useful verification schedules

These are proposed acceptance cases, **not executed results**:

- Commit an update, fail invalidation, and issue a dependent read through a
  different service. Check the actual acknowledgement contract and repair
  outcome, including cached absence followed by insertion.
- Restart the freshness authority while old values and delayed fills survive.
  Attempt reads before initialization completes; repeat after safe admission.
- Pause a baseline row read, apply its deletion through the live stream, then
  release the old row and restart the consumer. The rebuilt state must preserve
  deletion and recover progress without replaying an obsolete baseline.
- Request one historical cut from replicas on either side of it; include a
  delete/recreate interval and expired history. Preserve the requested view or
  take the documented unavailable/rebuild path.

The existing Redis example already executes stale-fill rejection, metadata
loss, notification reordering, and the commit/cache gap. It does not execute
these startup, connector bootstrap, deletion, or failover schedules. Existing
skills already explain TTL limits, tombstone retention, protected mutations,
delta gaps, fallback capacity, and surviving consumers after restore. Repeating
those sections would add volume without filling a new gap.
