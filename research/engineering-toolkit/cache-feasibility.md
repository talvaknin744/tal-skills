# Cache-race feasibility research

Executed 2026-09-29 at 08:29:36 UTC. Eight controlled scenarios used a real, disposable Redis server and two separate service processes, each with its own Redis TCP connection and SQLite connection. Generated local records were the only data. The owned container was removed after the run. [Machine-readable results and traces](cache-feasibility.json)

## Contract and environment

A read invoked after a successful service write acknowledgement at revision R must return R or newer. A read already in flight may return its earlier snapshot, but publishing that snapshot must not make later reads regress. Database commit and service acknowledgement are distinct events.

The probe uses Redis **8.10.2**, selected from the [Docker Official Images manifest](https://github.com/docker-library/official-images/blob/master/library/redis), and pinned to `redis@sha256:3811787313eba226a2ef38658c6ccb91cd5e110edc89c37767de373120a0e5a0`. The server reported the same version. Host Python was 3.14.3; SQLite was 3.53.2 in WAL mode. Separate service process IDs were 8779 and 8780; Redis client IDs were 12 and 13.

Redis bound only to loopback through an ephemeral port. Persistence was disabled for this disposable probe; `maxmemory-policy` was `noeviction`. An explicit deletion of the cached value models eviction. The test did not induce memory-pressure eviction. SQLite supplies real committed source records through separate connections; this does not establish the behavior of a different database or its replicas. [SQLite isolation](https://www.sqlite.org/isolation.html), [transaction semantics](https://www.sqlite.org/lang_transaction.html)

## Observed outcomes

| Scenario | Actual result |
|---|---|
| Ordinary cache-aside | A captures revision 1; B commits revision 2 and deletes the cache; A publishes revision 1. A later read returns 1 after B acknowledged 2. Forbidden outcome reproduced. |
| Client-side version check, then unconditional write | A observes floor 1; B advances the floor to 2; A writes cached revision 1 using its earlier check. The stale value is observable through an unprotected cache read. A prior check alone is insufficient. |
| Atomic conditional fill | After B acknowledges revision 2, A's revision 1 publication is rejected. A's overlapping read may still return 1; the later read returns 2. |
| Cached value removed, floor retained | Deleting only the value does not erase floor 2. The delayed revision 1 publication remains rejected; the later read returns 2. Repeated warm reads avoid another source read. |
| Older notification arrives late | After revision 3, a delayed notification for revision 2 leaves floor 3 intact. The old fill is rejected; the later read returns 3. |
| Floor expires; absence treated as zero | A real positive `PEXPIRE` removes floor 2. After value removal, a permissive conditional fill accepts revision 1. The later read returns stale revision 1. |
| Floor expires; absence means unknown | The strict publication refuses the old fill. The cache read also requires usable metadata; the later read falls back to SQLite and returns revision 2. Cache filling remains disabled until an explicit recovery protocol exists. |
| Database commits before cache update | SQLite contains revision 2 while a cache read still returns 1. The fixture withholds service success during this gap. Replaying the floor advancement makes the later read return 2. No physical process crash was injected. |

Each race was ordered by process messages at the relevant operation boundary. The expiry cases used a bounded poll to observe actual expiration; sleeps did not establish the competing read/write order. A test assertion expects each intentionally unsafe variant to exhibit its counterexample, so successful probe execution does not mean the unsafe variants satisfy the contract.

## What the correction establishes

The conditional Lua transition compares the proposed revision with both the shared floor and current cached revision, and publishes only if it cannot regress them. A separate Lua transition monotonically advances the floor and removes obsolete values. Cache reads validate the floor and value together. Redis executes a script without another client's operation interleaving inside it; the comparison and publication therefore share one enforcing boundary. Both keys use the same entity hash tag, as required for a future cluster deployment, although no cluster was tested. [Redis scripting](https://redis.io/docs/latest/develop/programmability/eval-intro/), [cluster key placement](https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/)

This is a conditional cache guarantee. It does not make the database commit and Redis transition atomic. The fixed successful-write path acknowledges only after both finish. A crash or unknown outcome between them still needs durable reconciliation, operation identity, and a chosen reader policy. Redis replication also has separate failure semantics: `WAIT` does not by itself establish strong consistency through failover. [Redis replication](https://redis.io/docs/latest/operate/oss_and_stack/management/replication/)

The experiment distinguishes evictable content from ordering evidence. Expiry deletes a Redis key; a TTL does not preserve the history represented by that key. Treating missing history as permission recreated the bug. The tested strict fallback trades cache availability for a fresh authoritative source read. It does not automatically reconstruct the floor, bound fallback traffic, or protect against losing an acknowledged floor during failover. [Redis expiry](https://redis.io/docs/latest/commands/expire/)

## Adoption and limits

The existing `concurrency-correctness` skill already states the core rules accurately. Use this evidence to strengthen its reference and future executable examples, and connect `failure-oriented-testing` and `recovery-validation` to the expiry and partial-write cases. Preserve the distinction between an allowed overlapping snapshot and a forbidden read started after a successful write acknowledgement.

The temporary original probe is `/tmp/tal-cache-research-20260929/probe.py`; its SHA-256 is `9892b7ce35184a05e0591c3d72a8a1be6121ff856a32bbc8efa473139468e889`. Results, exact traces, image identity, script hashes, source records, and cleanup evidence are in the accompanying JSON. This is research evidence, not a production adapter or a final repository implementation.

Before a production design claims more, verify the chosen datastore's source-read semantics, cache topology, metadata retention and recovery, error/unknown-outcome handling, entity deletion and ID reuse, and fallback capacity. The probe uses revisions 1–3; arbitrary 64-bit revision comparison through Lua numbers was not validated. Script errors, out-of-memory conditions, network faults, replicas, restart, failover, real eviction pressure, and durable outbox repair were not exercised. A process-local mutex was never the enforcing mechanism. Eight deterministic scenarios do not prove all schedules or measure throughput.
