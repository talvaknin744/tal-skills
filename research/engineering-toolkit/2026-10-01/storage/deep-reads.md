# Storage design deep reads — 2026-10-01

Four new primary technical articles were read in full. They cover ordinary design decisions as well as failure boundaries: reconfiguration, resource scheduling, partition strategy, and analytical read models. The machine-readable [ledger](deep-reads.json) records source locators, all six dimensions, current contract crosschecks, placement rankings, and detailed verification specifications.

Novelty was checked against all 103 earlier engineering-toolkit Markdown/JSON ledgers, including lane and extension records: 603 distinct prior URLs after trailing-slash normalization. None of the four article URLs was present. This wave's discovery inventory was excluded from the prior-reading set. Full substantive textual bodies were read through official web pages; diagrams were not used as unique evidence. Requests were synchronous, with one target URL per host per batch and at least one second between repeated calls to a target host.

This is research evidence. The verification proposals below are independently authored and unexecuted. No skill/source attribution files were changed, model evaluations run, or commits created.

## 1. Reconfiguration as an application contract

[Scaling services with Shard Manager](https://engineering.fb.com/2020/08/24/production-engineering/scaling-services-with-shard-manager/) — Meta, 2020-08-24. Full textual body read, including architecture and upcoming challenges.

| Dimension | Finding |
| --- | --- |
| Trigger | Design or rebalance a stateful, sharded service. |
| Problem | Static placement ignores uneven load, hardware, locality, and maintenance. |
| Mechanism | Opaque lifecycle callbacks separate placement control from application data movement; constraints express replication and placement intent. |
| Limits | Basic drop-then-add causes downtime; applications validate consensus membership; small services may find the abstraction excessive. |
| Counterexample | Hash routing alone cannot supply safe ownership transfer. |
| Verification | Proposed: exercise relocation with delayed callbacks and old routing; require the selected exclusivity, readiness, downtime, and movement-cost contracts throughout. |

The current [ZooKeeper session contract](https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html) says session expiry is decided by the cluster; a disconnected former owner receives expiry notification after reconnecting. The derived design check must therefore resume an old owner after takeover and inspect the protected resource's accepted mutations. No current public Meta Shard Manager API or implementation was verified; this remains a historical account, and the independent dependency crosscheck does not certify Meta's current implementation.

**Minimum placement:** add lifecycle completion/readiness and movement-cost questions to `distributed-system-patterns/references/serving.md`; use its existing ownership branch for stale actors. Existing guidance already names routing owners and membership change, so repeating it as a new skill would add little.

## 2. Admission from resource lifetime and useful completion

[Here's how CockroachDB keeps your database from collapsing under load](https://www.cockroachlabs.com/blog/admission-control-in-cockroachdb/) — Cockroach Labs, Sumeer Bhola, 2022-06-06. Full body read, including slots/tokens, grant chaining, locking, tenancy, and epoch-LIFO.

| Dimension | Finding |
| --- | --- |
| Trigger | Allocate saturated resources across heterogeneous, multi-stage work. |
| Problem | Uncontrolled queues waste deadlines, obscure fairness, and delay lock release. |
| Mechanism | Use slots for observable ongoing work, tokens for delayed or unobservable resource consumption; coordinate admission across stages and priorities. |
| Limits | Epoch-LIFO assumes clock alignment and deadline slack; prioritization can starve work and worsen tails. |
| Counterexample | Independent LIFO at each stage may prevent any transaction completing. |
| Verification | Proposed: vary work cost and deadlines; measure completed operations, waiting, tails, fairness, and cleanup rather than admission rate alone. |

Current [admission-control documentation](https://docs.cockroachlabs.com/docs/stable/admission-control) retains node-local admission, starvation, and timeout limits. It does not preemptively reject long queues or control SQL connection counts. It also describes replication pacing beyond the 2022 design. Historical settings and throughput graphs are not portable defaults. An admission design needs separately stated queue, connection, memory, and rejection policies.

**Minimum placement:** add resource lifetime, work cost, useful completion, lock-release progress, and fairness questions to `microservice-operations/references/capacity.md` for cross-service admission. A standalone `resource-admission-design` skill has a meaningful boundary, but needs evidence and recurring tasks beyond this one database account.

## 3. Partition choice follows the access path

[Four Data Sharding Strategies We Analyzed in Building a Distributed SQL Database](https://www.yugabyte.com/blog/four-data-sharding-strategies-we-analyzed-in-building-a-distributed-sql-database/) — Yugabyte, Karthik Ranganathan, 2020-01-14. Full body read, including examples, default rationale, future work, and conclusion.

| Dimension | Finding |
| --- | --- |
| Trigger | Choose table or index partitioning for point and range access. |
| Problem | Distribution, range locality, resize movement, and initial parallelism conflict. |
| Mechanism | Compare modulo, order-preserving, consistent-hash, and range placement against access patterns; choose table and index layouts separately. |
| Limits | Range placement can concentrate load; hash placement can enlarge range-query work. |
| Counterexample | Adding nodes does not immediately parallelize an initially single range tablet. |
| Verification | Proposed: replay point, range, monotonic-insert, skew, and resize workloads at equal budgets; observe distribution, routed work, latency, and movement cost. |

Current [hash/range documentation](https://docs.yugabyte.com/stable/architecture/docdb-sharding/sharding/) preserves the tradeoff and distinguishes YSQL from hash-only YCQL. [Tablet-splitting documentation](https://docs.yugabyte.com/stable/architecture/docdb-sharding/tablet-splitting/) supersedes the historical roadmap: splitting has been enabled by default since 2.18. Range tables initially have one tablet unless explicitly partitioned; post-split compaction adds CPU/disk cost, and colocated tables cannot split. Record the effective version and layout before recommending growth behavior.

**Minimum placement:** add query locality and startup/split-cost comparisons to `distributed-system-patterns/references/serving.md`. Its existing sharding checks already cover skew, hot keys, routing, and movement. Compare request concentration separately from stored bytes; a seemingly balanced dataset can still yield one saturated owner.

## 4. Analytical storage has a query meaning

[Postgres to ClickHouse: Data Modeling Tips V2](https://clickhouse.com/blog/postgres-to-clickhouse-data-modeling-tips-v2) — ClickHouse, Lionel Palacin and Sai Srirampur, 2025-03-06. Full body read, including raw/aggregated and incremental/refreshable materializations.

| Dimension | Finding |
| --- | --- |
| Trigger | Choose an analytical read model over changing transactional data. |
| Problem | Source schemas and query semantics do not transfer unchanged. |
| Mechanism | Compare query-time deduplication, scheduled recomputation, and incremental transformations using freshness, identity, query flexibility, and computation cost. |
| Limits | Ordering keys also determine deduplication; historical distinct aggregates retain deleted identities. |
| Counterexample | Ever-created counts cannot answer how many records currently exist. |
| Verification | Proposed: compare with a known source snapshot after replay, deletion, grouping changes, dimension-only updates, refresh delay, and rebuild; verify meaning before latency. |

Current [ClickPipes ordering-key guidance](https://clickhouse.com/docs/integrations/clickpipes/postgres/ordering-keys) still requires extra direct CDC key columns to remain stable per row and replica identity to include custom ordering-key values for deletes. Appending an ID does not repair a mutable key. The current [incremental-view contract](https://clickhouse.com/docs/concepts/features/materialized-views/incremental-materialized-view) adds a crucial limit: JOIN views trigger on the left/source table; right-side changes do not retroactively update earlier materialized rows. Declare ingestion-time enrichment versus current-state joins and choose recomputation where needed.

Independent verification must define exact versus approximate answers, current versus historical counts, acceptable age, and whether a multi-table source snapshot is required. Wait for a known watermark or quiescent comparison boundary. `FINAL` does not itself establish that CDC caught up or that multiple source tables represent one consistent instant. The article's historical projection-versus-`FINAL` behavior was not revalidated and is not adopted as a current blanket rule.

**Minimum placement:** a small linked storage/read-model decision reference under `architecture` can own this choice. Use `microservice-data/references/projections.md` only when the actual read crosses service-owned data; that skill intentionally excludes single-database tuning.

## Placement ranking

| Rank | Option | Boundary and disposition |
| --- | --- | --- |
| 1 | Minimal existing-reference additions | Add missing decision questions to distributed topology, capacity, and architecture references. Preserve triggers and avoid repeating their existing invariants and ownership checks. |
| 2 | New `storage-design` skill | A real candidate for choosing/evolving a datastore, table/index layout, partition key, or analytical read model. Its return artifact would join workload, correctness/freshness, physical layout, update semantics, adoption, and comparative checks. Promote when archive screening shows recurring demand and a broader vendor-neutral evidence base. |
| 3 | New `resource-admission-design` skill | A distinct scheduler/resource-lifecycle workflow across databases, runtimes, and services. Broader than storage selection and insufficiently grounded by one deep read. |

A new storage skill should exclude ordinary query fixes, microservice ownership/sagas, race diagnosis, restoration, and topology choices that contain no storage decision. Otherwise it would route existing work to another generic wrapper. The strongest distinct opportunity here is the missing workload-to-storage decision artifact; the smallest useful intervention is to add that artifact to architecture first and reuse existing specialists for topology and concurrency.
