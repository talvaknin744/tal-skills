## Overload-control policy

[service.md](../final-project/service.md) allows up to **480 concurrent database queries** (4 pods × 40 requests × 3 queries) against a 100-connection allocation. A per-pod request cap cannot serve as a fleet database cap or prove that tenant B will get capacity.

### Admission and budgets — proposed

- **Gate before dispatching any query.** Acquire one atomic, fleet-wide bundle of three database permits per running report, including an asynchronous export. Start with a **90-connection ceiling**, or 30 bundles, leaving 10 connections of headroom. Enforce the physical connection limit across all pods; scaling out must not multiply it. If the grant system is unavailable, stop new dispatch while retaining accepted jobs for recovery.
- **Partition the 30 bundles:** four exclusively for B’s authenticated metadata lookups, four for durably accepted exports, and 22 shared. Exports may also compete for shared bundles. Do not lend B’s reserve to 500 ms work: a disconnect or cancel signal cannot promptly reclaim an issued query. The export reserve ensures continuous synchronous demand cannot indefinitely prevent accepted jobs from running.
- **Schedule shared capacity by measured connection-held time**, with an eventual turn for each backlogged, authenticated tenant. Charge the canonical tenant identity from authentication, including accounts that belong to the same quota entity. The present equal-request token bucket misses the roughly 100-fold difference between a 5 ms lookup and a 500 ms export. Measure CPU, memory, and output-storage costs as separate limits before treating database capacity as the only constraint.
- **Bound waiting.** Initial limits for validation: at most 64 transient HTTP waiters and 8 MiB fleet-wide, with 16 waiters and 2 MiB per tenant; wait at most 20 ms for B metadata and 50 ms for other requests, always less than the remaining client deadline. Remove expired or disconnected waiters before dispatch. These byte limits need checking against real request sizes. Reject tenant quota exhaustion as a quota response and temporary capacity exhaustion as 503, before effects begin.

B’s 100 ms objective still needs an end-to-end budget for routing, queueing, and queries. The reserved bundles protect access under A’s load; they cannot guarantee a successful lookup within 100 ms during an arbitrary database stall. Report B’s **successful latency and rejection rate separately**.

### Accepted-work ownership — proposed

Send **202 only after durable persistence and backlog admission**. As initial, measurable bounds, admit no more than 1,000 pending jobs or 1 GiB of retained job data fleet-wide, and 250 jobs or 256 MiB per tenant. Reject *new* intake when either bound is full. Never delete an already accepted export to shed load. Keep its payload, canonical tenant, progress, effect state, and recovery owner durable; include retry-waiting and paused jobs in backlog accounting. Alert on oldest age, starting at 15 minutes, without expiring the promise.

Claim a job only when execution capacity is available; avoid speculative prefetch that occupies worker slots. After five jittered transient retries, park it durably, probe recovery at a bounded rate, and give operations an explicit repair path. Verify effect completion before acknowledging a job; use a stable job identity and effect reconciliation so a restarted attempt does not silently repeat documented effects. The persistence and effect semantics needed to establish that guarantee are absent from `service.md`.

The executing worker owns its three-permit bundle until **all three queries actually finish or database termination is confirmed and connections are released**. A caller disconnect detaches the HTTP response; it does not release the bundle. The same rule applies to timeouts, job lease loss, and retries. Release once after cleanup, including when acquisition or dispatch only partly completed.

### Feedback and recovery — proposed

Begin with the fixed budgets above. If adaptation is later enabled, vary only the 22 shared bundles within a measured safe range; retain B’s and accepted jobs’ reserves. Base reductions on admitted-work latency by class, database occupancy and pool wait, active queries, queue age, timeouts, and held work with no completions. Keep 1 ms rejection responses out of the successful-work latency histogram. Record offered, admitted, rejected, completed, late, and retried work separately. Freeze increases on missing samples; restore capacity gradually after current database health and useful completions recover.

Replace immediate threefold 503 retries with jittered, deadline-limited retries for safe requests. Until callers change, size the front gate for their four-attempt bursts. Autoscaling should consider offered and rejected demand as well as useful completions, while keeping the **same fleet database ceiling**; extra pods cannot create database connections.

### Checks required before adoption

All checks below are **unexecuted**; `service.md` reports no recovery test.

| Required row | Status and expected result |
| --- | --- |
| Broker contract | **Unresolved.** No broker, version, delivery, ordering, duplicate, or visibility contract is supplied, so no broker fairness guarantee is assumed. Verify those semantics if the durable queue uses a broker. Fair receive alone must not be counted as useful start or completion. |
| Allocation and waiting | **Proposed.** Run A’s 1,000/s load beside B’s 10/s lookups, then change A’s work from 5 ms to 500 ms at the same request rate. Shared throughput should fall without exceeding 90 held connections; B should retain access to its four bundles. Split A across fabricated caller labels: labels mapping to the same authenticated quota entity must not gain share. Measure each tenant’s connection-held time, waiting, deadlines, and eventual progress. |
| Actual release | **Proposed.** Fill shared and export capacity, signal disconnects before queries stop, then send B traffic. The disconnected queries remain charged until actual release; B can use its reserve. The peak must stay at or below 90 connections through cleanup and readmission. Record useful work lost or repeated if any interruption mechanism is introduced. |
| Discriminating recovery | **Proposed.** Test burst, database slowdown, stalled queries, pod loss, scale-out, coordinator failure, and gradual restoration against the same-demand baseline. Assert bounded waiting, no accepted-job loss, controlled backlog drain, stable useful throughput, and no retry surge. If broker visibility is used, test extension and expiry while an original attempt still holds connections: redelivery must not erase that ownership or repeat effects. |

This is a read-only design; no project files were changed.
