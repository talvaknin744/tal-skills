Use document sharding plus scatter/gather, with complete-result enforcement and a metrics adapter alongside each vendor process. Start the design at 32 logical shards, subject to checking the largest shard's actual memory use. Reject Proposal A and Proposal B's partial HTTP 200 behavior. Replicas are a separate availability choice; a collection of disjoint shards is not redundant.

The [proposal](/tmp/book-skill-trials-20260929/distributed-system-patterns/project/design.md:3) establishes a capacity constraint: 768 GiB of index cannot fit in one process on a machine allowing 48 GiB of index. Aggregate cluster memory does not combine the memory available to each independent process. Proposal A therefore fails before load balancing helps; each process would need 16 times its index allowance, and 32 full copies would total 24,576 GiB.

The capacity lower bound is `ceil(768 / 48) = 16` shards under perfect balance. Sixteen shards use the full 48 GiB allowance per shard and leave no index-growth or skew allowance. Thirty-two balanced shards average 24 GiB, leaving 24 GiB within the index budget; 64 average 12 GiB. Actual resident memory, distribution skew, query buffers, and helper overhead still need validation. Keep non-index allocations within the machine's remaining memory; an average is not a maximum-size guarantee.

Thirty-two shards are a reasonable initial compromise between memory margin and fan-out. There is no supplied measurement showing that 64 shards are needed for memory or improve leaf latency. Query terms cannot identify one document-ID shard: every query must send the full conjunction to every required shard. Each document belongs to exactly one shard, so unioning each shard's complete conjunction results is correct; intersecting term results across unrelated document shards is not needed.

```text
UI/search client
  -> one query coordinator
       -> every logical shard in a pinned archive/partition manifest
            -> one ready vendor process for that shard
       <- complete document-ID set from every required shard
  <- union of IDs, or an explicit error before the request deadline

On each vendor host:
vendor counters --local Unix socket--> metrics adapter --HTTP--> collector
```

With one process per shard, the baseline is 32 serving processes and 768 GiB of index in aggregate. Each shard is necessary; losing any one makes complete search unavailable until it returns. That failure outcome is acceptable under the stated requirement if it is explicit and timely. Compared with keeping Proposal B at 64 shards and fixing only error handling, 32 reduces required participants and overhead while retaining substantial average memory margin. If measurements show a largest shard does not fit or smaller shards materially improve the full request latency, revisit the count.

The synthetic leaf model gives the following estimates. They are arithmetic from the supplied independent 1% slow probability, not production observations:

| Required shards | Balanced index per shard | Probability at least one 2-second leaf | Probability all leaves finish in 40 ms |
| --- | ---: | ---: | ---: |
| 16 | 48 GiB | 14.8542% | 85.1458% |
| 32 | 24 GiB | 27.5020% | 72.4980% |
| 64 | 12 GiB | 47.4404% | 52.5596% |

For `n` required leaves, the slow probability is `1 - 0.99^n`. Ignoring coordinator/network/response overhead, waiting for every result gives an expected maximum leaf time of `40 + 1960 * (1 - 0.99^n)` milliseconds: about 579 ms for 32 and 970 ms for 64. These are uncapped completion times. A coordinator enforcing 300 ms instead returns errors for the slow cases. Even the all-fast probabilities are optimistic bounds on successful responses by 300 ms because coordinator work and returning every matching ID have not been measured.

Set an end-to-end 300 ms deadline at entry, propagate the remaining budget, and reserve time for aggregation, serialization, and delivering the response. Returning partial results at 300 ms violates completeness, and waiting until exactly 300 ms to begin constructing the response risks missing the latency requirement. Stop or cancel outstanding work when a complete answer becomes impossible within budget. Use an explicit timeout/unavailable response without a success-shaped partial result. Large match sets may themselves exceed the budget or transport capacity; the requirement to return every match cannot be changed to silent truncation. Measure that case before claiming feasibility.

Routing and completeness need these explicit contracts:

| Edge or owner | Contract |
| --- | --- |
| Partition manifest owner | Publish a deterministic, versioned document-ID hash/assignment rule and the exact expected logical-shard set. Record archive/index generation and shard identities. Validate that every document is assigned exactly once. The coordinator owns routing from that manifest. |
| Client to coordinator | Supply the conjunction unchanged, a request identity, and a deadline. The coordinator pins one manifest/generation for the request. A client receives either the complete union or an explicit failure; no partial HTTP 200. |
| Coordinator to shard process | Select an endpoint ready for the required shard and generation; send the full conjunction and remaining deadline. Associate the response with request, shard, and generation through the request context and configured endpoint, or explicit metadata if supported. Do not assume the unmodifiable binary exposes new protocol fields. |
| Shard to coordinator | A valid response means the entire local conjunction search completed and returned every matching ID. Empty is a valid contribution; missing, truncated, timed-out, malformed, wrong-shard, or wrong-generation responses are not. Count one accepted response for each required logical shard, rather than merely counting responses. |
| Coordinator to client | Union and deduplicate IDs only after every required shard contributed. Late or duplicate replies cannot satisfy another shard's requirement. Query success also requires finishing response production within the budget. |
| Endpoint readiness | A process enters routing only after its configured subset has loaded and the shard/generation identity is verified. Being alive is insufficient. If the binary cannot expose these facts, establish them through launch configuration, inventory, and a verified readiness probe; that mechanism remains to be validated. |

Pinning a generation is a proposed way to avoid mixing incompatible archive or partition views; the proposal does not specify update or staleness semantics. If the archive changes during serving, decide what generation freshness is acceptable and validate publication accordingly. During shard movement or index replacement, prepare the new subset first, publish a coherent new manifest, retain old ready endpoints until requests using the old manifest drain, and then retire them. A lost old endpoint makes its in-flight request fail; it must not cause the coordinator to skip that shard. Changing `hash(id) mod N` without rebuilding/moving the data is insufficient.

For rolling upgrades that should continue serving queries, add two copies of each logical shard on different machine failure domains and route within each shard's replica group. This changes 32 shards into 64 vendor processes and increases index storage in memory to 1,536 GiB. One process per host would require 64 hosts. Packing two different 24 GiB shard copies per host uses the entire 48 GiB index budget and loses the proposed index margin; do not assume that placement is safe without measurements. Never put both replicas of a shard on the same host. Drain and upgrade one replica while another correct-generation replica remains ready, with enough remaining capacity. Without replicas, a rolling upgrade necessarily causes explicit search failures while a required shard is absent.

Replication alone does not improve the synthetic latency if each query still uses only one copy. An optional parallel request to both independent replicas, accepting the first valid complete reply per shard, reduces the estimated chance that a shard has no fast copy to `0.01^2`. Across 32 shards that is `1 - (1 - 0.0001)^32 = 0.3195%`. It sends 64 leaf requests per query and adds memory and load; independence across replicas is an additional assumption, and correlated slowness can remove the benefit. A bounded delayed hedge can reduce duplicate work but requires measured timings and spare capacity. Do not adopt either policy solely from this estimate: the user specifies no minimum successful-query fraction, and explicit failures are allowed. Cost the replica option separately if continuity during upgrades or a higher success fraction is desired.

The vendor companion is an **adapter** because it translates a Unix-socket counters interface into the collector's HTTP metrics format. It may be packaged as a sidecar; the purpose remains interface conversion. Use one per process because the source socket is local and the binary cannot be rebuilt. Specify the configured socket path and access permissions, HTTP bind address/port and collector reachability, metric names/types/units and shard labels, scrape timeout, and stale-data behavior. Start it independently, wait/reconnect until the socket is ready, reopen the socket after vendor restart, and report unavailable metrics on source failure rather than fabricating zero counters or stale healthy data. Adapter readiness depends on a usable source. Search readiness need not depend on metrics conversion; isolate the helper's resource use so its restart or overload does not break search.

The proposed local search companion is an **ambassador**: it would broker the client's connection to the coordinator. Do not add it by default; a configured coordinator URL and normal client connection handling are simpler when the coordinator already owns fan-out. If client constraints justify it, define its loopback endpoint, coordinator discovery/configuration, request identity and deadline forwarding, error mapping, and shutdown behavior. It should route one query to one coordinator, not duplicate shard routing. Delayed startup or restart makes the local endpoint explicitly unavailable; in-flight failures must surface within the same deadline. Any retry must remain inside the original budget and avoid unbounded duplicate work.

Proposed validation, not performed:

| Check | Acceptance condition |
| --- | --- |
| Partition and result correctness | A known corpus is assigned exactly once; distributed results equal a trusted complete-search result for empty, sparse, broad, and conjunction queries. A missing shard never yields success. |
| Memory and normal-load latency | Largest actual shard fits within 48 GiB of index with the chosen margin; total resident memory fits the host. Measure coordinator fan-out, leaf time, union cost, result bytes, and end-to-end latency under representative concurrency and broad matches. Success or explicit failure reaches the client within 300 ms. |
| Slow or lost participant | Inject a 2-second leaf, crash a leaf, and lose a connection. The coordinator fails explicitly before the deadline unless a valid replica completes in time. Reject malformed/truncated results and late responses. |
| Coordinator saturation or loss | Bound admission and outstanding fan-out; return explicit overload errors within budget. A coordinator failure must be visible as failure, never a partial success. Measure capacity before adding coordinator replicas. |
| Membership change or rolling upgrade | Pin the required shard set throughout each request. Verify generation changes, endpoint replacement, and old-request draining. For replicated serving, demonstrate correct results with one replica absent and capacity on the survivor. |
| Helper lifecycle | Delay initialization, restart helper and vendor independently, replace the socket, deny socket access, and apply an incompatible configuration. Metrics failure is explicit; search remains correct. If an ambassador is adopted, its restart surfaces bounded client errors. |

Only document inspection and the reported arithmetic were performed. No deployments, traffic experiments, coordinator benchmarks, or fault injections ran. Production latency, achievable success fraction, shard-size distribution, update freshness, and vendor readiness/protocol details remain unverified.
