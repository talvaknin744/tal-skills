## Proposed overload policy

The [service brief](../final-project/service.md) gives the service 100 database connections and says each running report uses three at once. The current four pods can admit 160 reports, enough to request 480 connections. A per-pod request cap therefore cannot serve as the global database cap or prove that tenant B will get capacity.

### Admission and budgets

Place admission after authentication and cheap validation, but before a synchronous report enters a wait queue or starts database work. Include asynchronous export workers, retries, and work continuing after a disconnect in the **same fleet-wide database budget**.

Start with a fixed maximum of **32 running reports, or 96 database connections**, leaving four connections of headroom. Reserve each report’s three connection permits as a unit before dispatch. A physical connection-pool limit must also enforce the 96-connection ceiling. Recalculate the budget if other work uses this service’s 100-connection allocation; adding pods must never multiply it.

A proposed allocation of the 32 report slots is:

| Allocation | Slots | Rule |
| --- | ---: | --- |
| B metadata | 8 | Protected from long exports; keep available for B’s 100 ms objective. |
| Durable exports | 4 | Guarantees accepted jobs execution opportunities while the database is healthy. |
| Other synchronous reports | 4 | Schedule by verified tenant identity. |
| Flexible | 16 | Share among eligible classes by tenant and measured resource cost. |

These are fleet allocations, not independent pod limits. Route work to a pod with local capacity, and keep the sum of local database pools within the fleet budget. The eight B slots must remain reachable under uneven routing. Do not lend them to 500 ms exports: an issued query may continue after cancellation, so it cannot be reclaimed in time for B. B’s 100 ms objective remains conditional on a healthy database and B’s stated 10 requests/s; it is not a guarantee under an arbitrary B burst.

Use report slots to bound concurrency and **connection-held time** to account for fairness. A 500 ms export can cost roughly 100 times a 5 ms metadata lookup despite counting as one request in the current token bucket. Classify work on the server, charge observed cost after execution, and schedule waiting work per authenticated tenant so an expensive tenant cannot indefinitely occupy each newly freed flexible slot. Rate limits may protect cheap ingress work, but equal request-count buckets cannot protect the database.

Replace unlimited FIFO waiting with bounded queues. Proposed starting limits are eight B metadata waiters for at most 20 ms, eight other synchronous waiters for at most 50 ms, and 8 MiB of aggregate waiting memory. Recheck the request deadline before dispatch; remove disconnected or expired waiters. Reject excess *before* database work. Use 429 for a tenant quota and 503 with a retry hint for temporary shared-capacity exhaustion. These numbers need measurement against request sizes and B’s end-to-end latency objective.

### Accepted-work ownership

For asynchronous exports, reserve durable backlog capacity and persist the job **before** sending HTTP 202. A proposed intake bound is 400 pending jobs and 256 MiB of persisted payload, with at most 200 jobs and 128 MiB per tenant A or B. When capacity is unavailable, reject before persistence and do not send 202. The limits are starting values; payload sizes and drain rate must validate them.

After 202, the durable job ledger owns the job until its documented effects are complete and recorded. An old accepted export must not be deleted to relieve overload. Pause new intake when full, keep accepted jobs recoverable, and alert when the oldest pending job exceeds a proposed 60-second operating threshold. That threshold triggers investigation; it is **not** a job expiry. Bound automatic retries, for example with jittered backoff capped at 30 seconds and six attempts, then retain the job in a recoverable paused state for an operator or recovery worker to re-admit after the dependency recovers. Eventual completion depends on that recovery path and on the database becoming usable.

A report’s execution owner retains its three-slot reservation until **all issued queries have actually stopped or settled and cleanup has finished**. A caller disconnect may detach the response and request cancellation, but must not release permits merely because cancellation was signaled. Record detached work and its outcome. Worker restart and ambiguous effect or acknowledgement boundaries require a persistent job state and reconciliation rule; the brief does not establish duplicate-effect semantics.

### Feedback and recovery

Run the fixed budget first. Remove the controller’s mixed histogram: 1 ms rejection responses are not successful work and must not make the controller raise its limit. Record offered, admitted, rejected, useful completed, failed, late, and detached work separately by class and tenant. Drive any later adaptive adjustment from admitted-work latency, database pool wait and occupancy, query errors, aged in-flight work, queue age, and useful completion rate. Include rejected demand and ready pod capacity in autoscaling; completed latency alone hides demand during widespread rejection. Scaling pods must still obey the 96-connection fleet ceiling.

If adaptive control is introduced, let it adjust only the 16 flexible slots within a measured 0–16 range. On sustained database distress, stop new flexible grants and let existing queries settle; do not count a reduced limit as reclaimed capacity. When signals are stale, hold or reduce grants and use a fixed-limit fallback. Reopen with small probes, then raise admission gradually only while database occupancy, useful latency, error rate, and oldest accepted-job age improve. Drain the durable backlog at a controlled rate before reopening full intake. Existing callers’ three immediate 503 retries can multiply offered load by four; clients should honor jittered retry hints and a finite attempt and deadline budget, while ingress must still withstand clients that do not.

### Evidence required before rollout

| Skill check | Status and acceptance check |
| --- | --- |
| Broker contract | **Unresolved.** The brief names no broker or version. The policy does not rely on broker delivery fairness. If one is used, verify its grouping identity, ordering, duplicate and redelivery behavior, and actual fairness inputs before claiming any receive or completion guarantee. |
| Allocation and waiting | **Proposed.** Measure the slot, byte, age, retry, and per-tenant bounds above at four pods and after scale changes. Confirm the global sum never exceeds 32 running reports or 96 held database connections, including prefetched or blocked work if those states are introduced. |
| Actual release | **Proposed.** Disconnect during a long query, signal cancellation, and verify its permits remain held until the query and cleanup really end. Then verify a fresh report can use the released capacity. |
| Discriminating checks | **Proposed.** Compare baseline and policy under A at 1,000/s and B at 10/s, then with longer exports, database slowdown, uneven routing, fabricated or split caller group labels, worker interruption after 202, and recovery. Use canonical authenticated tenant IDs. Measure B’s useful 100 ms completions and rejections, each tenant’s resource-held time and eventual progress, durable-job age, downstream attempts, and actual held connections over the same observation windows. If a broker is added, measure receipt separately from useful start and finish. |

No policy was executed or measured here, and no project files were changed.
