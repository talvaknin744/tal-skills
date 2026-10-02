## Proposed overload policy

[service.md](../final-project/service.md) currently permits 4 × 40 = 160 simultaneous reports. At three concurrent database connections per report, they could demand 480 connections from a service allocation of 100. The per-pod cap therefore cannot serve as a database cap or a fairness guarantee.

### Admission and budgets

Authenticate first, then apply fleet-wide admission **before database dispatch**. Reserve three connection credits atomically for each report’s query fan-out. Use a hard database pool ceiling of 90 connections, leaving 10 connections of headroom. These are proposed starting limits:

| Fleet budget | Connection credits | Report slots | Eligible work |
| --- | ---: | ---: | --- |
| Protected | 6 | 2 | Tenant B metadata lookups only |
| Durable export progress | 12 | 4 | Previously accepted asynchronous exports |
| Shared | 72 | 24 | Other synchronous reports and additional eligible work |

A’s 500 ms exports cannot borrow B’s two protected slots: a newly arriving B lookup could otherwise wait longer than its 100 ms objective. B’s larger reports use the shared budget. Schedule shared work fairly by **verified tenant identity**, charging estimated connection occupancy rather than equal request counts; a 500 ms, three-query export has roughly 100 times the connection-time cost of a 5 ms lookup. Reconcile estimates against measured occupancy. The fleet gate must remain valid across routing and pod-count changes; if its state is unavailable, stop new database dispatch while retaining already accepted jobs.

Bound transient waiting as initial configuration: B metadata at 16 requests, 1 MiB, and 20 ms; shared work at 48 requests, 16 MiB, and 50 ms, with a per-tenant share of that queue. Remove disconnected waiters and recheck the request deadline before dispatch. Reject overflow before query execution: use 429 for tenant quota and 503 with retry guidance for temporary capacity loss. B’s 100 ms objective still needs a defined measurement percentile and a database-latency test; reserved connections cannot make a slowed database finish in 100 ms.

For asynchronous exports, check a **durable backlog** limit before persistence and send 202 only after the job and its ownership are committed. Proposed intake high-water marks are 1,000 jobs, 256 MiB, or a 10-minute oldest-job age; any exceeded mark stops new acceptance. The age mark pauses intake—it does not authorize deletion of accepted jobs. Apply per-tenant backlog limits and fair worker scheduling. Validate these numeric queue and backlog limits against real payload sizes and drain rates before rollout.

### Ownership, feedback, and recovery

A disconnect releases a *waiting* request, but it does not release credits for queries already issued. The execution owner holds all relevant credits until each query actually stops or settles and cleanup finishes. A cancel acknowledgement alone is insufficient. An accepted export stays durably pending through worker failure and retries until its documented effects complete; record its job ID, attempts, effect state, and acknowledgement. Verify the persistence system’s redelivery and effect-reconciliation behavior before claiming duplicate-safe completion.

Replace immediate triple retries with a bounded, jittered retry policy for failures known to occur **before** execution or acceptance, subject to the caller’s remaining deadline. A 202 response gives the caller a job ID to track, not a reason to submit the export again.

Start with the fixed budgets above. Any adaptive controller should sample **admitted work by cost class**, including queue wait, execution latency, occupancy, and stalled or stale completions. Keep the 1 ms rejection responses out of its latency signal. Record offered, admitted, rejected, useful completed, and late work separately. Autoscaling should consider offered and rejected demand, queue age, and ready pods; more pods must never raise the 90-connection fleet ceiling. Reduce admission on sustained occupancy or latency deterioration, and restore it gradually only after several healthy windows while the accepted-job backlog drains. Keep a fixed-limit fallback.

### Evidence needed before adoption

| Required row | Status and check |
| --- | --- |
| Broker contract | **Unresolved.** The service document names no broker or version. Verify its ordering, duplicate, redelivery, and acknowledgement behavior. Do not infer execution fairness from delivery fairness. |
| Allocation and waiting | **Proposed.** Test the 6/12/72-credit allocation, finite queues, overflow responses, and backlog high-water marks under A’s offered 1,000 reports/s and B’s 10 reports/s. Measure connection-held time and useful completion per tenant. |
| Actual release | **Proposed.** Disconnect A just after a 500 ms query starts. Its credits must remain held until actual query completion, while a B metadata lookup can use protected credits. Confirm the pool never exceeds 90. |
| Discriminating checks | **Proposed, not run.** At the same request count, switch A from 5 ms lookups to 500 ms exports; A must consume more budget without starving B. Give A jobs fabricated group IDs; they must still charge authenticated tenant A. Repeat with database slowdown, uneven routing, worker restart after 202, capacity loss, and recovery. In the same observation windows, compare tenant resource-held time, B deadlines, accepted-job progress, useful throughput, and downstream attempts against the current policy. |

This is a read-only design; no policy or recovery test has been executed.
