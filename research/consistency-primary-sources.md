# Cross-service concurrency and stale reads: primary-source research

Research date: 2026-09-29. Scope: two services reading or changing the same logical state through databases, replicas, caches, or messages. Sources below were read through their official documentation, original papers, or first-party engineering publications. The scenarios and proposed skill workflow are independently authored synthesis, not claims that a source prescribes this exact implementation.

## Recommendation

Add one focused **`concurrency-correctness`** skill for diagnosing, designing, and fixing concrete race conditions or stale-read violations. Its unit of work should be an operation and a reproducible history: which actors read which versions, which decision they made, and which write became authoritative. This fills a more useful gap than another general distributed-systems or microservices skill.

Suggested trigger: “Diagnose or prevent lost updates, write skew, stale reads, cache invalidation races, or obsolete owners writing across processes. Use when concurrent services disagree or a read-check-write path violates an invariant; exclude broad service decomposition, generic performance tuning, and duplicate retries alone.”

Keep common instructions short. Load separate references for transaction races, replica/session consistency, cache coherence, and interleaving tests. Cover outbox and fencing only when the observed history crosses those boundaries. Do not make Redis, distributed locks, serializable transactions, or a new broker the universal answer.

## The critical distinction

“Both services should see the same data” is incomplete. Two reads at different times can legitimately differ. Define the required observable contract for each operation:

| Operation | Concrete contract to establish | Candidate enforcement boundary |
| --- | --- | --- |
| Display a catalogue | Data may lag the source by an agreed bound; disclose behavior during source failure | Cache/projection with an explicit freshness policy |
| Read immediately after changing a setting | Read must include that acknowledged change or a later version | Propagated causal/version context; wait, route, or return pending |
| Reserve the last item | Successful reservations must not exceed inventory | Authoritative conditional update or appropriate transaction |
| Disable the last active administrator | At least one qualifying administrator remains after any committed operation | Multi-record invariant protected across the whole decision |
| Apply an event to a read model | Duplicate or older events must not regress the view | Atomic consumer transition with event identity and entity revision |
| Accept an old worker's completion | A superseded owner cannot overwrite a successor | Protected resource validates the ownership generation |

These are design examples, not guarantees of a particular datastore. A consistency model describes legal histories; a product setting must actually supply that model for the requested topology and API. Linearizability respects the real-time order of non-overlapping operations; it does not mean an observed value remains unchanged after a read returns. [Jepsen's consistency models](https://jepsen.io/consistency/models/linearizable), [etcd API guarantees](https://etcd.io/docs/v3.5/learning/api_guarantees/).

## Findings and technical boundaries

### 1. A database transaction is not automatically sufficient

PostgreSQL READ COMMITTED takes a new snapshot for each statement. Two reads within one transaction can therefore differ. Its UPDATE rechecks the predicate against an updated target row after waiting for a competing updater. REPEATABLE READ supplies a stable snapshot but still permits serialization anomalies. SERIALIZABLE prevents committed histories that cannot be ordered serially; applications must handle aborts. These facts support reviewing the entire invariant, not merely checking for `BEGIN` and `COMMIT`. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

For a same-row invariant, independently assess a conditional statement such as decrementing stock only while stock remains positive and checking the affected-row count. For an edit based on an earlier read, compare the expected revision in the write and return or retry a conflict deliberately. A process-local mutex only coordinates callers in that process. These are synthesis examples; verify the actual driver's returned-row and transaction behavior.

A `SELECT FOR UPDATE` row lock blocks competing writers/lockers of those rows until the transaction ends. It does not automatically represent an application-level predicate over rows that do not exist. Choose a lock scope, constraint, or isolation strategy that covers the invariant, and use a consistent acquisition order where multiple locks are needed. [PostgreSQL explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html).

A serialization retry must rerun the complete transaction, including the logic that selected values and SQL. PostgreSQL identifies serialization failures as SQLSTATE `40001`; deadlocks and uniqueness failures require separate classification, because some apparent conflicts are persistent errors. Bound and observe retries. As an implementation inference, keep externally visible effects outside a freely repeated transaction body, or make those effects independently safe to repeat. [PostgreSQL serialization failure handling](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html).

### 2. A fresh read cannot make a later write atomic

Route-to-primary and cache bypass can reduce stale observations while leaving the check-then-act race intact. Independently constructed counterexample: A and B each read `available=1`; A writes a reservation; B writes another. Correctness comes from enforcing the reservation invariant at the mutation boundary, not from an earlier observation. Keep “what could this reader see?” separate from “what can this writer commit?” in the skill output.

DynamoDB illustrates the distinction: read-committed isolation prevents dirty reads, but an item can change immediately after a read. Strongly consistent reads are available on tables and local secondary indexes, while global secondary indexes and streams have different read guarantees. The skill must inspect the specific resource and API rather than applying a database-wide label. [DynamoDB read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html).

### 3. Cross-service read-your-writes needs carried context

MongoDB's causal sessions track operation time and cluster time. The official documentation describes advancing those values in another session to preserve causality across sessions. The durable causal guarantees depend on majority read concern and majority write concern; session operations must be sequential. Creating an unrelated session in service B does not carry service A's causal history. [MongoDB read isolation, consistency, and recency](https://www.mongodb.com/docs/manual/core/read-isolation-consistency-recency/), [MongoDB causal consistency and read/write concerns](https://www.mongodb.com/docs/manual/core/causal-consistency-read-write-concerns/).

General synthesis: carry a trusted commit/revision token through the operation's dependency chain; require the reader's source to have reached it, with a bounded wait and specified fallback. A primary route, session affinity, or arbitrary sleep is only as strong as the storage/failover contract beneath it. During a partition or lag spike, an operation may need to wait, reject, or return pending to preserve the chosen guarantee. Do not silently downgrade to a stale replica for a correctness-sensitive decision.

etcd makes another naming trap explicit: its lower-cost `serializable` reads may be stale relative to quorum, whereas other key-value operations default to linearizable behavior. Its watch stream has separate ordering/progress properties. A watch-backed local cache should therefore not inherit the underlying key-value API's read guarantee without a synchronization protocol. [etcd API guarantees](https://etcd.io/docs/v3.5/learning/api_guarantees/).

### 4. Cache invalidation and fill are competing writes

Meta documents a late fill overwriting newer data, eviction losing the revision needed to reject it, and mismatched payload/revision reads. Inspect fill, invalidation, eviction, and error paths together; payload and revision must describe the same source snapshot. [Meta: Cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/).

The original Facebook Memcache paper describes cache-issued lease tokens: a fill must present its token, and a delete invalidates the outstanding fill permission. This is a concrete example of the cache enforcing the ordering protocol, rather than the client checking and later performing an unconditional set. It is a historical system design, not a promise that an ordinary Redis or Memcached deployment already implements those leases. [Scaling Memcache at Facebook, §3.2.1](https://www.usenix.org/system/files/conference/nsdi13/nsdi13-final170_update.pdf).

Redis `WATCH`/`MULTI`/`EXEC` supports conditional execution over watched Redis keys; modifications, expiration, or eviction can abort it. Redis transactions do not provide general rollback after execution-time command errors. A Redis-side CAS can protect a cache transition, but it cannot by itself make a database write and cache update one atomic operation. Verify server version and client behavior before proposing newer convenience commands. [Redis transactions](https://redis.io/docs/latest/develop/using-commands/transactions/).

Design alternatives, to select against the contract:

- For permissive reads, use cache-aside with documented staleness and repair behavior. Cache-aside itself does not guarantee cache/store consistency. [Microsoft Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside).
- For strict decisions, make the authoritative service/datastore enforce the invariant at commit, even if a cache supplies the display.
- For versioned caches, make stale-fill rejection atomic and preserve the necessary generation across eviction, deletion, and restart, or prove a safe refill protocol. A deleted key cannot silently reset the ordering floor.
- For time bounds, measure age from trustworthy source/version evidence. TTL since cache insertion alone does not prove source freshness if the inserted data was already stale or a delayed fill is accepted.

The last three points are independently derived review rules, not blanket guarantees of a named product.

### 5. Outbox closes a publication gap, not every ordering gap

An outbox records a business update and publication intent in one database transaction. The relay may still publish duplicates, and ordered business events need their own handling. [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

Debezium's router distinguishes event ID from aggregate ID: event ID can support duplicate removal, while aggregate ID becomes a Kafka key important to partition ordering. Neither field alone proves that an arbitrary consumer's local state changes are ordered correctly. [Debezium Outbox Event Router](https://debezium.io/documentation/reference/stable/transformations/outbox-event-router.html).

Synthesis: record event identity and aggregate revision separately. Atomically compare/apply the transition and commit consumer progress with its local effect where possible. For a complete-state event, rejecting older revisions may suffice; for delta events, silently skipping an older or missing event can lose required changes. Specify gap handling, tombstones, bootstrap, replay, and reconciliation. Do not claim a total order across independent aggregates or a transaction spanning external effects.

### 6. Ownership records and protected writes are different boundaries

Kleppmann's original fencing analysis shows why checking a lease before a remote write is insufficient: a paused process or delayed request can arrive after a successor has taken over. A monotonic token must be checked by the protected resource, which rejects older generations. A random lock token that makes unlock safe is not automatically a fencing token. [Kleppmann: How to do distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html).

This is already covered in this repo's ownership and idempotency references. The new skill should inspect that boundary when stale ownership explains the race, then keep the requested fix scoped. Avoid adding a second generic distributed-locking manual.

### 7. Measure violated contracts and force the dangerous schedule

Meta measures client-visible violations across convergence windows, distinguishes deletion from staleness, and limits authority checks. Monitor the consistency contract, not just cache hit rate. [Meta: Cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/).

Amazon describes local-cache disagreement across instances, cold-cache load during deployment, and the need to test cache unavailability without overwhelming the dependency. A consistency fix that bypasses cache should therefore include source-capacity and load-shedding checks where relevant. [Amazon Builders' Library: Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/).

FoundationDB's original paper describes deterministic simulation of distributed processes and injected disk, network, and process failures. It also states limitations: simulation may miss performance issues and errors in external dependencies or assumptions about them. Use reproducible schedules as correctness evidence while retaining real datastore integration checks for the guarantees the model abstracts. [FoundationDB paper, §4 and §6.2](https://www.foundationdb.org/files/fdb-paper.pdf).

## Existing repo coverage and the gap

Read-only comparison against the local files on the research date:

| Existing skill | Strong coverage already present | Missing concrete invocation supplied by proposed skill |
| --- | --- | --- |
| `microservice-data` | Owners, cross-owner invariants, saga recovery, projections, freshness and repair | Diagnose the precise interleaving inside an existing read/write/cache path |
| `microservice-integration` | Event meaning, contract compatibility, acknowledgement, duplicates and late messages | Show why an event consumer's compare/apply or version gate is racy |
| `distributed-system-patterns` | Topology choice, ownership election, leases, protected-resource fencing | Select the smallest database or cache atomic primitive for a particular invariant |
| `idempotency` | Stable logical identity, concurrent claiming, uncertain remote effects, outbox/inbox limits | Different valid operations racing, stale observations, write skew, cache refill ordering |

Do not duplicate these skills' broad design workflow. Link by skill name as an optional neighboring concern, while keeping all knowledge required to execute the new skill within its own installed directory.

## Proposed skill output and completion rule

For the affected operation, produce:

1. One sentence naming the invariant or freshness/session guarantee, including permitted temporary states.
2. A short actor-by-actor history with read versions, source roles, commit points, and relevant network/lease boundaries.
3. The smallest correction that makes the bad history impossible or changes the contract explicitly; name exactly where it is enforced.
4. The response to conflict, timeout, lag, or partition, including bounded retry of the correct unit.
5. A reproducible regression and actual results, or a precise unexecuted validation plan for read-only work.

Completion means every claimed guarantee has an enforcement point and a corresponding observable check. An in-memory fake is not evidence that the production database implements the assumed isolation. An occasional stress-test pass is not proof that a forbidden schedule cannot occur.

## Recommended behavioral evaluations

These are proposed evaluations, not checks executed during this research.

| Case | Fixture and deterministic schedule | Expected evidence |
| --- | --- | --- |
| Lost inventory update | Two service instances read the same revision; release both writes | No over-reservation; one conflict/retry or atomic decrement result; no process-local mutex presented as cross-instance protection |
| Write skew | Two transactions inspect two active owners and each disables a different owner | The cross-row invariant survives; same-row revision checks alone are rejected as insufficient |
| Stale replica after write | Service A commits revision 8; service B reads a replica at 7 | Carried context plus wait/route/pending behavior; no arbitrary sleep claimed as proof |
| Cache resurrection | Pause old DB result, commit/invalidate newer data, then release old fill | Late fill cannot poison the cache under the claimed contract |
| Evicted revision | Accept revision 8, evict entry or generation metadata, then deliver revision 7 | Ordering protection survives or a documented authority check prevents regression |
| Torn payload/revision | Read old payload, commit a change, then read new revision | Stored cache pair corresponds to one valid source snapshot |
| Outbox reorder | Deliver revisions 3, 2, 3 to a consumer; separately omit revision 2 for a delta stream | View cannot regress; duplicates are harmless; delta gaps are repaired or explicitly blocked |
| Stale owner returns | Pause generation 4, allow generation 5 to commit, then resume 4 | Protected resource rejects the obsolete write, not merely an application-side lease check |
| Whole-transaction retry | Inject serialization failure after a decision read and before commit | Fresh decision logic on retry; no duplicated external effect |
| Cache outage | Disable cache under representative request load | Correctness-sensitive reads retain their contract; source overload is bounded or validation remains explicitly unverified |

Separate the raw fixture and user request from the evaluator rubric. A fresh agent should receive the skill and fixture without intended answers. Use barriers, deferred responses, fake clocks, or controlled transaction sessions to force the relevant order; supplement with the actual datastore where its behavior is essential.
