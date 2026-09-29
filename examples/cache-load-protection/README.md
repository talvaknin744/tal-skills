# Cache load protection failure probes

Run from the repository root with Python **3.14.3** and Docker running:

```sh
python3 -B examples/cache-load-protection/verify.py --report /tmp/tal-cache-load-report.json
```

The standard-library-only runner creates a labelled Redis **8.10.2** container on
a random loopback port and a temporary SQLite database. The image, platform and
bundled Bloom module path are pinned in [dependencies.lock.json](dependencies.lock.json).
The image is ARM64; another host may require Docker emulation. The runner checks
the server version and Bloom commands and records the loaded module version. It
does not infer module availability from the version of a command's documentation.
Docker downloads the image if missing; cleanup retains that image.

Only invented local records are used. Ordinary success, exceptions and handled
signals remove this invocation's container and temporary database. Docker CLI
commands have deadlines and own process groups; cleanup discovers the labelled
container even if `docker run` loses its response. A killed host/runner or an
unavailable Docker daemon can prevent cleanup and is not covered by that promise.
No existing Redis service, user database, or production configuration is changed.

## Eight cases

| Case | Unsafe control and required observation | Evidence kind |
| --- | --- | --- |
| Bounded TTL jitter | Synchronized expiry concentrates one fixture bucket; positive-only jitter exceeds its age ceiling. Jitter within `[ceiling-jitter, ceiling]` spreads this fixed schedule without extending the ceiling. A slow fill keeps the original deadline. | Virtual-time arithmetic; eight real Redis `PTTL` observations. No load benchmark. |
| Repeated missing key | Twenty uncached SQLite reads become one read plus nineteen negative-cache hits. After observed Redis expiry, another request reaches SQLite. | Actual Redis/SQLite; sequential requests for one key. |
| Create after missing read | A captured absence publishes after creation and DEL-only invalidation. Atomic revision comparison rejects the old fill; loss of the floor forces database reads and disables publication. | Independent real Redis/SQLite connections with explicit gates in one process. |
| Bloom readiness | Missing, replaced, or incomplete filter state cannot establish database absence. A Lua operation checks the expected ready generation, filter type and membership together. | Actual RedisBloom plus authoritative SQLite fallback. |
| Bloom false positive | A real membership positive for an uninserted key still results in an authoritative missing-row answer. | Actual Bloom witness; deliberately high error rate, not rate measurement. |
| Lease and resource fence | A stale plain DEL removes a successor's lease. Owner-conditional release preserves it, while SQLite's accepted fence rejects the stale mutation. | Actual lease expiry and SQLite conditional update; no distributed grant protocol. |
| SCAN and prohibited KEYS | Fixture ACL rejects KEYS. SCAN reaches cursor zero and accumulates the complete stable target set, tolerating duplicates and empty batches. | Actual Redis iteration; no complexity or latency benchmark. |
| Singleflight cancellation | Canceling an unshielded waiter cancels shared work. Shielding preserves the other waiter; an active-key bound rejects another key. | Event-gated in-process asyncio model; no distributed coordination. |

Each case passes only when its particular unsafe control and guarded observations
match their assertions. These are eight scenarios, not eight universal fixes.
The [recorded run](evidence/verified-run.json) includes per-case limits, runtime
versions, source hashes and cleanup results. Failed runs are retained separately;
rerun after changing a hashed source. Run without Python's `-O` option.

## Boundaries that matter

**Freshness:** the virtual clock measures age from the fixture's source sample.
Delayed publication gets only the remaining TTL; expiry or refresh failure never
renews that sample's hard age deadline. Upstream replica age, random collisions,
refresh scheduling and a real request storm are outside this example.

**Negative caching:** absence is a typed value, distinct from a cache miss or a
database error. Repeated misses are bounded only for the measured same-key case.
The source commit and Redis revision floor do not share a transaction. The guarded
schedule acknowledges creation after both steps; a crash or lost invalidation
needs a separate recovery protocol. Missing floors stay unknown rather than being
reconstructed from old cache data. No false promise of a distributed transaction
or safe automatic metadata rebuild is made.

**Bloom absence:** the ready generation is trusted fixture metadata, published
after a quiescent complete build. Atomic readiness/type/membership checks prevent
the demonstrated missing-key race; they do not prove an online index is current.
A database commit before asynchronous `BF.ADD`, an incomplete rebuild falsely
marked ready, or reuse of a generation name can still hide existing rows. An
actual service needs a verified update/rebuild protocol or must treat negatives
as hints and perform a bounded authoritative lookup. Positive membership always
requires the relevant authoritative answer. Fallback capacity is not tested.

**Lease versus fence:** random owner tokens support safe release; ordered fencing
tokens come from the SQLite sequence. The resource rejects A after B's newer fence
is installed there. Lease expiry alone does not stop A, and the token comparison
does not fence an unrelated payment or other external effect. No Redis failover,
replication, persistence, transaction rollback or clock-skew experiment is included.

**Iteration:** SCAN's `COUNT` is a work hint, not a batch or latency ceiling. A full
iteration is still O(N); KEYS performs O(N) work in one command. The fixture's ACL
choice demonstrates an application path that forbids KEYS, not a rule banning all
administrative use. Stable-key results do not establish a snapshot during writes
or whole-cluster coverage.

## Primary contracts

- [Redis BF.EXISTS](https://redis.io/docs/latest/commands/bf.exists/): positive/negative replies and missing/wrong-type keys; the report records the pinned runtime's actual reply.
- [Redis Bloom filters](https://redis.io/docs/latest/develop/data-types/probabilistic/bloom-filter/): approximate membership and false positives.
- [Redis SCAN](https://redis.io/docs/latest/commands/scan/) and [KEYS](https://redis.io/docs/latest/commands/keys/): completion, duplicate/empty batches, COUNT and documented complexity.
- [Redis distributed locks](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/): unique ownership, conditional release and fencing limitations.
- [Redis scripting](https://redis.io/docs/latest/develop/programmability/eval-intro/) and [expiration](https://redis.io/docs/latest/commands/expire/): local atomic script execution and TTL behavior.
- [SQLite isolation](https://www.sqlite.org/isolation.html): the source and protected resource are local database operations.

This fixture complements the existing cache-ordering and ownership examples. It
adds no dependency on them and changes no skill or production adapter.
