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
