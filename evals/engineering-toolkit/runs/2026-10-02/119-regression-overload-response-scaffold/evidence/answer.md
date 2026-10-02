## Broker contract

[Supplied service description](../final-project/service.md): four pods can each admit 40 reports; each report can hold three database connections; the service has 100 connections. The current limits can therefore issue **480 concurrent queries**, far above the database allocation.

- **Provider/version and contract source:** No broker or delivery contract is specified. The durable store and its retention, claim, and acknowledgement semantics are unresolved; inspect those contracts before implementing recovery.
- **Trusted group identity:** Use the tenant ID from verified authentication context, including for durable jobs. Clients must not choose their own fairness group.
- **Detector inputs:** Broker fairness detection is N/A because no broker is identified. The service’s own scheduler should use tenant, work class, resident count, and actual resource occupancy.
- **Ordering, rate, duplicates, redelivery:** Durable ordering and duplicate guarantees are unknown. Do not infer them from the current HTTP FIFO queue. Test duplicate claims and effect reconciliation before relying on redelivery.
- **Delivery versus completion:** A persisted job and HTTP 202 establish an obligation to finish its documented effects. A claim, lease, or delivery alone does not establish available execution capacity or completion.

## Allocation

**Proposed fixed baseline:** Allow at most four *admitting* pods, including during rollout. Give each pod seven report slots. Because each report can issue three concurrent queries, the fleet can hold at most **4 × 7 × 3 = 84 connections**, leaving 16 of the allocated 100 as headroom. A fifth pod must not admit reports until these budgets are redistributed or a verified fleet-wide allocator replaces them.

| Per-pod slots | Allocation and arbitration |
| --- | --- |
| 2 | B metadata only; never borrowed. This protects its 100 ms objective from A’s long, noninterruptible work. |
| 3 | Synchronous reports; tenant-aware round-robin at dispatch. A may use idle capacity, but stops receiving borrowed slots when B is waiting. B waits for actual slot release. |
| 2 | Durable exports; one opportunity per tenant when both have ready work. A may borrow an idle B opportunity, but an arriving B job waits for actual release. |

These are **concurrency budgets, not a proof of B’s deadline**. B can still miss 100 ms during a database slowdown, a burst beyond its reserved slots, or excessive ingress overhead. Measure those cases. The existing equal-request token bucket should not serve as the fairness rule: a 500 ms export can occupy a connection roughly 100 times longer than a 5 ms lookup. Keep any ingress rate limiter separate and measure its CPU, authentication, and rejection costs.

Place the synchronous gate after trusted authentication and before queueing or dispatching database work. Place the durable intake gate before persistence and 202; place a second execution gate before a worker claims or queries. Return 429 for a tenant intake quota, 503 with a retry hint for temporary capacity exhaustion before effects, and a deadline-specific timeout for expired transient work. Replace immediate threefold 503 retries with jittered, finite retries constrained by the caller’s deadline; a retry to another pod still consumes the same database allocation.

## Residency and waiting

**Proposed provisional bounds:** Limit each pod to eight waiting B metadata requests for at most 20 ms, and twelve other waiting synchronous requests for at most 50 ms. With a 64 KiB request-envelope limit, that is at most 20 waiters and 1.25 MiB per pod, or 80 waiters and 5 MiB across four pods. Recheck the remaining deadline before dispatch; remove abandoned waiters. B’s 20 ms wait leaves 80 ms for execution and service overhead, whose measured split remains unresolved.

For durable work, atomically limit **unfinished accepted jobs** to 200 per tenant and 400 fleet-wide, with a proposed 1 MiB persisted-envelope limit: at most 400 MiB of envelopes, excluding storage overhead and export results. Reject new intake *before* 202 when that limit is full. A 60-second oldest-job age is an alert and intake-stop trigger, **not** permission to delete accepted work. Actual payload and result-size limits need inspection.

Claim only when an export slot is free: at most two claimed jobs per pod and eight fleet-wide, with **zero nonexecuting prefetch**. Keep deferred and retry-wait jobs in durable storage. Count blocked and settling claims against their slot until custody has been transferred or settled. A stalled database query remains charged for its connections even if its HTTP caller has gone away.

## Expiry and recovery

Unaccepted work can be rejected; transient waiting work can expire without dispatch. An accepted export must instead remain durably identifiable and recoverable until its documented effect is complete or an authorized terminal disposition is recorded. The current proposal to delete old queued exports violates that boundary.

**Proposed worker protocol:** Persist identity, payload reference, attempt, progress, and effect state before 202. Use one claim per free export slot, a 30-second lease renewed every 5 seconds, and a 2-minute per-attempt execution deadline as provisional review bounds. On timeout, request cancellation and enter a **quarantined** state; do not reassign merely because the lease or HTTP deadline expired. Reassign only after the former query and effect owner are proved stopped or fenced. Retry at most five times in a recovery episode with jittered delays of 1, 2, 4, 8, and 16 seconds; then park the job and recheck it every 30 seconds when capacity is available. These limits bound active retry pressure, while accepted jobs remain retained until completion. A proposed seven-day retention *after terminal settlement* needs agreement with the documented effects contract.

The durable store’s lease, fencing, effect reconciliation, and retention guarantees are **unresolved**. In particular, the service description says a disconnect does not stop an issued query. Verify how a dead worker’s database session and any partially applied effects are proved settled; without that proof, eventual completion and safe redelivery cannot yet be claimed.

## Actual release

The request or job owner acquires its report slot before dispatch and releases it exactly once **after all three queries have actually stopped and cleanup is complete**. A disconnect or cancellation signal detaches the caller; it does not free a query permit. Settling work retains its job claim until its effect record is durable. A redelivery cannot displace an original operation that is still running.

Under the proposed four-pod gate, original and redelivered operations together may hold at most **84 database connections**. This bound depends on counting still-running originals, preventing an expired lease from creating a second uncharged owner, and keeping rollout pods within the four-pod admission budget. Connection/session closure and job-state settlement—not a returned HTTP response or cancellation acknowledgement—are the release evidence.

## Interruption cost

**Proposed policy:** Do not preempt queries to reclaim B’s metadata reserve; keep that reserve available. A disconnected synchronous export may waste its remaining computation, but its capacity remains charged until actual stop. For a nominal 500 ms export, that could be up to 500 ms of repeated or unused work and up to 1.5 connection-seconds across three queries; slowdown makes the upper bound unknown.

**Hypothetical reclaim of borrowed work:** Interrupting an A export could lose progress, repeat queries, and require effect reconciliation before B can use the slot. The service supplies no checkpoint or reliable cancellation guarantee, so reclaim time, cleanup cost, and duplicate-effect risk remain unknown. Test them before considering preemption.

## Fair useful outcomes

Use a **five-minute observation window**, with one-minute slices and per-request checks for B’s 100 ms metadata objective. For each tenant and work class, record offered, rejected, accepted, started, useful completed, failed, expired, and still-resident work. The resource oracle is the sum of **held connections × acquisition-to-actual-release interval overlapping the window**, including work whose caller disconnected.

Compare B’s reserved-slot availability, wait, and end-to-end metadata latency with its 100 ms objective; compare A and B’s shared-slot starts and useful completions under sustained A load. For durable jobs, compare each tenant’s oldest unfinished age and eventual completion, not just fair receipt or claim counts. No outcome measurements or overload recovery test were supplied, so the proposed allocations are unverified.

For feedback, start with the fixed seven-slot baseline. Exclude 1 ms rejections from *admitted-work* latency. Record admitted execution latency by class, B’s end-to-end latency, actual connection occupancy and pool wait, queue age, offered and rejected demand, useful completions, and stale or missing samples together. The adaptive controller may later vary only the three shared synchronous slots per pod, within **one to three**, using 30-second windows and one-slot changes; it must never raise the 84-connection fleet ceiling. Hold or reduce admission on pool wait, stalled work, or B deadline misses, and require three healthy windows before a gradual increase. Autoscaling must use offered and rejected demand, backlog age, and *ready* pod capacity alongside completed latency. Its current completed-latency-only signal can be fooled by fast rejections.

## Verification matrix

All schedules below are **proposed, unexecuted checks**; the service description reports no recovery test.

| Schedule and transition | Expected ownership/resource/useful-work oracle | Supplied/observed outcome or explicit unexecuted status |
| --- | --- | --- |
| Receive or prefetch while slots are full | No claim; zero nonexecuting prefetch; durable job remains stored | Unexecuted: flood intake and inspect claims, memory, and job age |
| Deferred accepted export | Retained payload and identity; no query permit; later capacity-gated claim | Unexecuted: pause workers, restore them, verify eventual finish |
| Blocked database query | Claim and all held connections remain charged until actual stop | Unexecuted: stall the database and inspect sessions versus permits |
| Retry-wait job | Durable parked state, no immediate requeue storm; bounded active attempts | Unexecuted: fail and restore the database, count attempts |
| Effect settling or acknowledgement delay | Claim retained; effect state reconciled before another owner acts | Unexecuted: interrupt at effect/ack boundaries and check duplicates |
| B arrives just after A borrows a shared or export slot | B metadata uses its unborrowed reserve; other B work waits for actual release and gets the next fair opportunity | Unexecuted: start longest A work immediately before B arrival |
| Work cost changes from 5 ms to 500 ms | Request-count fairness may diverge; connection-seconds and B outcomes expose it | Unexecuted: vary mix at equal request rates |
| Tenant group fragmentation | Authenticated B remains one accounting group across pods and retries | Unexecuted: vary routing and retry identities; reject fabricated groups |
| Disconnect or cancel before query stops | Caller detaches; original remains charged; fresh work uses only genuinely free slots | Unexecuted: race disconnect, cancellation, and completion |
| Lease extension, expiry, and redelivery | No second active owner until former execution/effects are proved settled; aggregate peak ≤84 connections | Unexecuted: kill workers and expire leases during queries |
| Pod loss, replacement, and scale-out | At most four pods admit concurrently; per-pod reserve and fleet ceiling hold | Unexecuted: roll pods with uneven B routing |
| Dependency recovery | Capacity reopens gradually; useful completions and B latency stabilize without retry surge | Unexecuted: compare a demand burst and database slowdown against the fixed baseline |

**Coverage audit:** The policy specifies provisional admission, tenant, waiting, retry, and resource bounds. Broker/store semantics, payload and result sizes, actual cancellation/fencing proof, effect reconciliation, production latency distributions, and every measured recovery outcome remain unresolved and require the checks above. No project files were changed.
