## Proposed overload policy for [service.md](../final-project/service.md)

The current four-pod limit can admit **480 concurrent database queries** (4 × 40 reports × 3 queries), while the database allocates 100 connections to the service. A per-pod report cap is therefore neither a fleet database cap nor a fairness guarantee. The limits below are **provisional design bounds**, not measured production capacity.

### Admission and budgets

| Path | Admission decision and provisional bound |
| --- | --- |
| Synchronous reports | After authentication identifies the tenant, but before expensive parsing, local waiting, or database dispatch, check a bounded class queue and the request’s remaining deadline. Acquire three database connection permits atomically before issuing the three queries. Reject before dispatch if the request cannot finish usefully. |
| Durable exports | Check the fleet backlog **before persistence and HTTP 202**: at most 1,000 accepted jobs and 1 GiB of retained payload, with a provisional per-tenant ceiling of 500 jobs and 512 MiB. If full, decline intake; a job already acknowledged with 202 stays in recoverable storage. An oldest-job age of 15 minutes stops new intake and triggers investigation; it does not delete accepted jobs. |
| Database | Start with **18 connections per pod, 72 across four pods**, leaving 28 below the service’s 100-connection allocation. Partition each pod’s 18 into 3 for A’s interactive work, 6 exclusively for B metadata, 3 for accepted exports, and 6 shared. Count every connection held by issued queries, including work whose caller has gone away. Include any other service database users in the same cap. |
| Transient waiting | Per pod, allow at most eight A and eight B waiters, each with a 64 KiB admitted payload ceiling: at most 16 waiters and 1 MiB per pod, or 64 waiters and 4 MiB across four pods. Cap B’s admission wait at 20 ms and A’s at 50 ms; recheck the deadline immediately before dispatch. Bound proxy and connection-pool waiting as well so they cannot become hidden unlimited queues. |

These partitions guarantee available slots for B and accepted exports even when A continuously offers 1,000 reports/s. The shared six connections per pod are scheduled across verified tenants and work classes by measured connection time, with ready tenants taking turns; unused shared capacity can go to any ready class. The B reserve remains unborrowed because a 500 ms export cannot reliably yield it within B’s 100 ms objective. Cost accounting should charge actual connection occupancy. If the stated 5 ms and 500 ms durations approximate connection holding time, three parallel queries make the classes roughly **15 versus 1,500 connection-ms** per report; equal request-count tokens obscure that difference.

B can start up to two reserved reports per pod. The 20 ms waiting budget leaves 80 ms for execution and response, but the supplied average offer of 10/s does not establish burst size, routing balance, or a deadline guarantee. Measure those before treating the 100 ms objective as met. Route B toward pods with free reserved slots; verify skewed routing explicitly.

Use a quota response for a tenant cost budget and a temporary overload response for unavailable capacity. A `503` must carry a bounded retry hint; clients should make **at most one jittered retry within the original deadline**, rather than three immediate retries. B should fail promptly when no retry can finish within 100 ms.

### Ownership of accepted and executing work

A permit belongs to the issued query until the database operation actually stops and releases its connection. A caller disconnect removes an unstarted waiter; after dispatch, it detaches the response but **does not release permits**. If cancellation is supported, release follows confirmation that the query stopped, including completion and cancellation races. Track detached queries and their eventual outcomes.

For exports, persistence of the job payload, verified tenant, effect identity, and recovery state precedes `202`. A worker claims work only when an execution slot is available; keep at most one claimed but not executing job per pod and no speculative prefetch. Blocked and retry-waiting jobs stay in durable storage without holding local execution slots. After effects settle, write a durable completion record **before** acknowledging or removing the job. On a crash or uncertain effect, reconcile against that record and the effect’s idempotency key before replay. The draft’s deletion of old accepted exports violates the stated eventual-completion promise.

A provisional worker lease is 30 seconds, renewed every 10 seconds, with at most two minutes of extensions per attempt. An expired attempt returns to a durable paused state only after its prior execution and effects are known to have stopped or have been reconciled. Retry cycles may recur after capacity returns; accepted work has no overload-based terminal deletion. Storage retention and the documented effect contract are unspecified, so their ability to support indefinite recovery remains unresolved.

The 72-connection bound also applies during rollout. Count old and new pods together; do not ready a replacement or fifth pod with fresh permits until the retiring pod’s database work has actually released capacity, or redistribute the fleet budget first.

### Feedback and recovery

Run the fixed 72-connection policy as the baseline before enabling adaptation. Record offered, admitted, rejected, expired, and usefully completed work separately by tenant and class. Measure connection occupancy, permit wait, active-operation age, query latency from issue to actual settlement, durable backlog count/bytes/age, and B requests exceeding 100 ms. **Exclude 1 ms rejection responses** from execution-latency feedback. Detect stalls from occupancy and operation age even when no requests complete.

If adaptation is needed, vary only the shared allocation from zero to six connections per pod, in steps of three. A provisional decrease requires two consecutive 10-second windows with rising permit wait or query latency *and* falling useful completions or rising deadline misses. Increase by at most three per pod after three stable 10-second windows with usable database capacity and a declining backlog. A lower limit blocks new dispatch; it never assumes running work has stopped. Freeze the limit on missing signals. Autoscaling must consider offered and rejected demand as well as completions, and must preserve the fleet connection cap when pod count changes.

Reopen admission gradually after database latency, active-operation age, and errors stabilize; drain accepted exports under their reserved share. Recovery succeeds when useful completions and B deadline outcomes stay stable while backlog age falls—not when a controller merely raises its limit.

### Checks before adoption

Compare the current policy and this design under A at 1,000/s, B at 10/s, mixed 5 ms and 500 ms work, a dependency slowdown, pod loss, and recovery. The acceptance oracles are: no more than 72 service database connections held; B’s observed 100 ms misses and 20 ms gate waits; useful completions and per-tenant progress; bounded transient occupancy; and no accepted export missing a durable state or completion record.

| Transition to exercise | Expected observation |
| --- | --- |
| A fills shared slots; B arrives, including skewed routing | B uses its unborrowed reserve; measure actual wait and deadline outcome. |
| A disconnects before and after query issue | Waiting work disappears; issued queries retain permits until actual release. A cancellation signal alone changes no occupancy count. |
| Export is claimed, blocked, retry-waiting, settling, or interrupted near its effect and completion record | Every accepted job remains recoverable; no local prefetch or retry surge bypasses the connection cap; replay is reconciled with effects. |
| Pod restarts or a replacement overlaps it | Old and new database work together remain within the fleet budget. |
| Slowdown ends | Accepted backlog drains, each ready tenant makes useful progress, and raising admission does not restart overload. |

For fairness review, use a 60-second window and charge each tenant the sum of **held connections × time from acquisition to actual release overlapping that window**, including detached work. Compare that occupancy with promised slots, dispatch opportunities, useful finishes, and B deadline misses. The cost of interrupted export progress, repeated queries, and effect cleanup is unknown and must be measured. No broker or broker delivery contract is described in `service.md`; the durable-store lease and retention semantics still need verification. No recovery test has been run, so these are proposed checks, not observed results.

The project was left unchanged.
