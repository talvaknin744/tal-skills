# Source basis

This original decision workflow is informed by Brendan Burns, *Designing Distributed Systems: Patterns and Paradigms for Scalable, Reliable Services*, O'Reilly, first edition. The [user-supplied Microsoft PDF](https://info.microsoft.com/rs/157-GQE-382/images/EN-CNTNT-eBook-DesigningDistributedSystems.pdf) contains 164 pages. Its copyright page identifies December 2017 as the first edition, December 6, 2017 as first release, and 2018 as the copyright year.

Locators below are verified one-based PDF positions, counted from the cover. Printed chapter pages are PDF position minus 14. Ranges sometimes overlap because sections share a page.

| Applied concept | Chapter and section | PDF pages |
| --- | --- | --- |
| Per-instance extension and stable helper interfaces | Ch. 2, “The Sidecar Pattern”; “Dynamic Configuration with Sidecars”; “Designing Sidecars for Modularity and Reusability” | 25–27; 30–33 |
| Local connection brokering versus shared routing | Ch. 3, “Ambassadors”; “Using an Ambassador to Shard a Service”; “Using an Ambassador to Do Experimentation or Request Splitting” | 35–36; 40–41 |
| Interface normalization | Ch. 4, “Adapters”; “Monitoring”; “Logging” | 45–48 |
| Interchangeable serving instances and readiness | Ch. 5, “Stateless Services”; “Readiness Probes for Load Balancing”; “Session Tracked Services” | 59–60; 62–63 |
| Partition identity, resizing, and hot shards | Ch. 6, “Sharded Caching”; “Replicated, Sharded Caches”; “An Examination of Sharding Functions”; “Hot Sharding Systems” | 73–76; 80–85 |
| Parallel requests and required contributions | Ch. 7, “Scatter/Gather with Root Distribution”; “Scatter/Gather with Leaf Sharding”; “Choosing the Right Number of Leaves”; “Scaling Scatter/Gather for Reliability and Scale” | 88–94 |
| Ownership and stale requests | Ch. 9, “Determining If You Even Need Master Election”; “Implementing Locks”; “Implementing Ownership”; “Handling Concurrent Data Manipulation” | 108–109; 112–116; 117–119 |
| Independent work and capacity | Ch. 10, “A Generic Work Queue System”; “Dynamic Scaling of the Workers”; “The Multi-Worker Pattern” | 123–129; 131–133 |
| Stage composition | Ch. 11, “Patterns of Event-Driven Processing”: copier, filter, splitter, sharder, merger | 136–141 |
| Aggregate completeness | Ch. 12, “Join (or Barrier Synchronization)”; “Reduce” | 148–152 |

The numbered steps, completion criteria, fixtures, and acceptance checks are original synthesis. Chapter 9 already discusses downstream owner/version checks; this workflow additionally requires an enforceable protected-write boundary and offers monotonic fencing as one mechanism. Durable batch membership, acknowledgement interruption checks, reduction algebra, explicit partial-result policy, and the exact independent-probability calculation are engineering extensions. Historical availability arithmetic and deployment commands are not carried forward as guarantees or current instructions.

The included MIT license covers this repository's original skill material. The source book remains its authors' and publisher's copyrighted work; no book text, figures, or example deployment code are bundled.

## Partition selection and movement extensions

[partitioning-and-movement.md](partitioning-and-movement.md) adds workload comparison and application lifecycle questions from two new full article reads on October 1, 2026:

- Meta, [Scaling services with Shard Manager](https://engineering.fb.com/2020/08/24/production-engineering/scaling-services-with-shard-manager/), August 24, 2020: opaque shard lifecycle callbacks, intent/placement constraints, application-owned data movement and membership validation, and the availability cost of basic drop-then-add relocation. This is a historical design account; no public current Shard Manager API was verified.
- Yugabyte, [Four Data Sharding Strategies We Analyzed in Building a Distributed SQL Database](https://www.yugabyte.com/blog/four-data-sharding-strategies-we-analyzed-in-building-a-distributed-sql-database/), January 14, 2020: modulo, ordered/hash, consistent-hash, and range placement tradeoffs; point/range access, growth, initial parallelism, and separately selected table/index layouts. Vendor examples and historical roadmap claims are not platform-neutral guarantees.

Current primary crosschecks on the same date: Yugabyte's [sharding](https://docs.yugabyte.com/stable/architecture/docdb-sharding/sharding/) documentation distinguishes YSQL layouts from YCQL's hash-only capability; [tablet splitting](https://docs.yugabyte.com/stable/architecture/docdb-sharding/tablet-splitting/) documents automatic splitting, initial range-table placement, post-split compaction costs, and colocation limits. Its current default supersedes the article's future-work discussion. The [ZooKeeper Programmer's Guide](https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html), “ZooKeeper Sessions,” establishes that a disconnected former owner receives session-expiration notification after reconnecting; resource-side enforcement is an independently derived requirement when obsolete actions would violate the invariant.

The comparison artifact, completion criteria, proposed movement states, version/delete checks, resource budgets, and adverse schedules are independently authored synthesis. Publisher performance numbers are not claimed as this repository's measurements.

## Operation ownership transfer extension

[ownership.md](ownership.md) adds an operation-level transfer example from Snowflake, [Strengthening Snowflake's Distributed Query Lifecycle with Execution Anchors](https://www.snowflake.com/en/blog/engineering/snowflake-distributed-query-execution-anchors/), May 5, 2026. The full main article was read on October 1, 2026: per-transaction owner guards, voluntary completion of pending writes, durable death records, conditional recovery claims, and staged rollout. The article does not disclose the entire ambiguous-commit resolution protocol.

The current [FoundationDB Developer Guide](https://apple.github.io/foundationdb/developer-guide.html), “Transactions with unknown results,” “The commit_unknown_result Error,” and timeout/cancellation guidance, was crosschecked on the same date: already-sent commits may succeed, and unknown-result retries require idempotency. The effect inventory, completion criteria, and proposed adverse schedules are original synthesis. No production handoff or FoundationDB runtime test was executed.
