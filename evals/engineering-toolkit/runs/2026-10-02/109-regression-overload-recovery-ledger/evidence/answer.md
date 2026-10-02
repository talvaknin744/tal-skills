## Overload-control policy for `service.md`

This is a **proposed design**, not an implemented or tested policy. The current four pod caps permit 160 reports to execute at once. At three database connections per report, that can demand **480 connections** from a service allocation of 100. The unlimited FIFO queue, equal request-count tokens, and release-on-disconnect rule do not protect B’s 100 ms metadata objective or the database.

### Admission and budgets

After authentication identifies the tenant and before any report query starts, use one fleet-wide admission decision. Atomically reserve all three connections a report can use; never let a report hold one connection while waiting for the other two. Enforce the same budget for synchronous reports and asynchronous export workers, regardless of pod or scale-out. Keep a local bound on active handlers and waiting requests as well.

| Provisional fleet budget | Connections | Maximum simultaneous reports |
| --- | ---: | ---: |
| Tenant A reports and exports | 69 | 23 |
| Tenant B metadata | 12 | 4 |
| Tenant B exports | 6 | 2 |
| Persistence and recovery operations | 3 | Depends on actual connection use |
| **Admission ceiling** | **90** | **29 reports plus recovery work** |

The remaining 10 connections are headroom within the stated 100-connection allocation. These are initial review limits, not measured production capacities. Do not borrow B’s metadata reserve for A exports: a 500 ms query started just before B arrives cannot be reclaimed within B’s 100 ms objective. A retains its own allocation and eventual progress. The existing per-pod cap is only a local safeguard; it cannot establish a fleet-wide database cap.

Replace the shared FIFO with bounded queues by authenticated tenant and work class. As provisional limits, allow at most 24 waiting A reports, 8 B metadata requests, and 4 B exports fleet-wide; allow at most 10 transient waiters per pod. Bound queued request state to 64 KiB per item and 4 MiB fleet-wide, with no unbounded proxy or pool wait hidden ahead of these queues. Give B metadata at most **20 ms of admission wait**, then recheck its deadline before dispatch. Its remaining 80 ms must cover execution and response; the stated 5 ms lookup time alone does not prove that objective under bursts or database slowdown. Within A’s allocation, schedule metadata and exports fairly so continuing exports cannot indefinitely pass waiting metadata.

Reject an unaccepted request **before dispatch or effects** when its queue, cost, or deadline budget is exhausted. Distinguish tenant quota (`429`), temporary capacity (`503`), and expired deadline in the response. Replace immediate threefold `503` retries with jittered, bounded retries that fit the original deadline; protect the admission endpoint from clients that have not adopted that behavior. Calibrate any arrival-rate limiter from measured CPU and rejection cost. Equal request-count tokens cannot price a 5 ms lookup and a 500 ms export alike.

### Ownership of accepted work

A report owns its execution slot and three connection permits until **all issued queries have actually stopped or settled and their connections have returned or closed**. A caller disconnect removes an undispatched transient waiter. For an executing report it may close the HTTP response, but it does not release execution or database capacity. One lifecycle owner records detached work, completion, failures, and exactly-once permit release. A cancellation signal or timeout response is not proof of resource release.

For durable exports, enforce provisional intake bounds of **1,000 persisted jobs and 256 MiB of retained payload** *before* sending `202`. If there is no room to persist and recover a new job, reject it before acceptance. After persistence, retain its payload, authenticated tenant, job identity, progress, and effect evidence until completion or an explicitly authorized terminal disposition; never delete an old job simply to relieve overload. Alert when the oldest accepted job exceeds one hour, but treat that age as an escalation threshold, not permission to discard it.

Use bounded worker fetch: at most one newly fetched job per free execution slot. A worker lease can start at 30 seconds, extend every 10 seconds, and reach a provisional five-minute attempt limit. After at most five automatic retries with bounded backoff, move the job to a durable **paused-for-reconciliation** state. Neither lease expiry nor pause permits a replacement attempt while the original query may still run. The recovery owner must establish actual database-session release and reconcile any export effect before capacity-gated readmission. Whether the service has the effect ledger, fencing, and database visibility needed to do that is **unresolved in `service.md`**; without them, eventual completion and safe replay cannot yet be claimed.

### Feedback and recovery

Start with the fixed limits above and measure offered demand, accepted work, useful completions, deadline misses, rejections by reason, queue count/bytes/age, connection occupancy, detached executions, and downstream attempts. Measure latency from admission to completion **only for admitted work**. The current histogram includes 1 ms rejections, so its falling median can falsely tell the controller to raise the limit. Completed-only latency also misses stalled work. If an adaptive limit is later enabled, keep it below the fleet connection ceiling, use admitted-work latency and occupancy with explicit sampling and damping, and fall back to the fixed limit when samples or coordination are stale.

Autoscaling should consider offered and rejected demand alongside useful throughput and ready capacity, while keeping the **same 90-connection fleet ceiling** as pods change. On database slowdown or lost capacity, reduce new admission and durable fetch, retain accepted jobs, and avoid synchronized retries. Restore admission in measured steps after connections are genuinely available, queue age falls, B’s admitted metadata meets its objective, and useful completion remains stable. A controller state change alone is not recovery.

### Required checks before adopting the policy

All checks below are **proposed and unexecuted**; `service.md` reports that no recovery test has run.

| Check | Expected result |
| --- | --- |
| A sends 1,000 reports/s, first as 5 ms lookups and then as 500 ms exports, while B sends 10 metadata requests/s | Equal request counts produce very different connection occupancy. A is shed within its allocation; B’s reserve remains usable. Record B admission, start, finish, and deadline misses separately. |
| Split A’s traffic across fabricated caller group IDs and uneven pod routing | Every item is charged to authenticated tenant A. Group IDs and routing do not enlarge A’s 69-connection allocation. |
| Fill A’s allocation, signal cancellation or disconnect, then immediately offer another A report | Signaled queries retain their permits until actual stop. The new report waits or is rejected; fleet occupancy stays at or below 90, rather than briefly rising above it. Record work repeated or lost if interruption is ever introduced. |
| Accept an export, interrupt its worker near query completion or effect recording, and let its lease expire | The job remains durable. An uncertain original attempt becomes suspect or paused; no second attempt executes until resource release and effects are reconciled. Repeated work and replay cost remain unknown until measured. |
| Slow the database, lose a pod, then restore capacity | New admission falls without a retry surge; accepted jobs remain accounted for; limits ramp up only as useful throughput, queue age, and B deadlines recover. |

For every tenant and resource, use the same named **60-second observation window** and record `sum(held units × acquisition-to-actual-release time overlapping the window)`, including signaled work. For database connections, compare A with **4,140 connection-seconds**, B metadata with **720**, B exports with **360**, and recovery work with **180**; also assert instantaneous occupancy never exceeds **90**. Record queued byte-seconds and execution-slot seconds on that window, plus actual start and finish times. These observations are currently unavailable.

No broker or broker version is specified, so **broker delivery fairness, ordering, redelivery, and visibility guarantees are unverified and are not part of this policy**. If a broker is used, verify its provider/version and actual fairness inputs and lease behavior before relying on it. A fair delivery opportunity would still need the execution, connection, and durable ownership controls above.
