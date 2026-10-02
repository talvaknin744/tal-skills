## Review of [queue.md](../final-project/queue.md)

**The draft deadline claim fails in the supplied trace.** B1 is delivered at time 1, but Alpha holds all six dependency permits through time 8. B1 runs its one-second dependency operation on `[8,9)`, finishing at 9 against a deadline of 3: **six seconds late**. Low broker dwell describes delivery, not useful completion. The supplied fair-delivery contract changes future delivery opportunities; it gives no execution slot, permit, FIFO or per-tenant rate guarantee. Its detector considers approximate in-flight and recent processing-time shares. Standard delivery can also duplicate during visibility.

The grouping is wrong for the intended tenant accounting. A1 and A2 belong to authenticated customer Alpha, yet the client chooses `g1` and `g2`. A two-received-job cap per client-chosen group can therefore admit more than two Alpha jobs; four fabricated groups could fill all four worker slots. Set `MessageGroupId` from the server’s `authenticated_customer` recorded with the job ID. Keep that identity distinct from data-read authorization.

| Supplied trace, window `[0,9)` | Alpha | Beta |
| --- | ---: | ---: |
| Dependency occupancy, `Σ(held permits × time to actual release)` | `2 × 3 × 8 = 48` permit-seconds | `1 × 1 = 1` permit-second |
| Worker occupancy, same oracle | At least `2 × 8 = 16` slot-seconds | `1 × 8 = 8` slot-seconds |

Alpha’s worker total could exceed 16 if settling continues after time 8; its worker release time is not supplied. The actual dependency peak is six permits. The claimed simultaneous allocation of **six to Alpha plus two to quiet work requires eight physical permits, but only six exist**. Four worker slots do not cure that shortage.

### Smallest supported correction

For this **four-worker, six-permit shared dependency**, use one fleet-wide admission ledger keyed by authenticated customer and job ID. Charge worker slots from dispatch through actual job cleanup, including blocked, retry-waiting and settling time. Charge each dependency operation, or its advance reservation, until that operation actually ends. Reserve all permits required for a job’s parallel fan-out before giving it a worker; leave a job waiting for permits outside the worker pool.

A provisional allocation sufficient for the supplied B1 trace is **one worker and one permit kept available for one eligible quiet job**, and **at most three concurrent Alpha permits**—one of the supplied three-operation Alpha jobs. The remaining two permits can serve other costed work while neither reservation is consumed. Do not lend a reserved worker or permit to noninterruptible work when it cannot be reclaimed within the protected job’s wait budget. This protects B1 *given its stated delivery at time 1*: A1 uses three permits, B1 can use one on `[1,2)` and finish at 2, and A2 waits for Alpha capacity. Dependency use peaks at four in that schedule. A2 can start when the three Alpha permits are actually released, at time 8 in the supplied operation trace, provided its receipt is ready and a worker is available. Its useful completion and acknowledgement still depend on unsupplied settlement timing.

This is a **trace-level review allocation**, not an established production SLO or a deadline guarantee for every quiet customer. Eligibility for the protected share, other dependency consumers, multi-tenant arbitration and timely broker delivery need a defined contract and measurement. Rotate ready authenticated customers through available shares so a sustained quiet workload does not indefinitely postpone accepted Alpha work.

Keep accepted A2 recoverable while deferred. A concrete review bound is one locally deferred receipt for at most 10 seconds, received one message at a time, with a fleet-wide bound on additional nonexecuting receipts. Count those receipts and their payload bytes separately from worker slots. If capacity is still unavailable, do not start or delete the job: let a bounded visibility lease expire for redelivery, then re-admit it only through the same cost gate. For an executing receipt, a provisional 10-second lease with at most one extension and at most three *execution* attempts is a checkable starting policy, not a verified provider setting. At attempt exhaustion, transfer the payload, authenticated customer, job ID and effect status to a durable recovery owner before deleting any broker copy. The actual payload-retention, quarantine and settlement contracts are **unresolved**; without them, recoverability after broker retention cannot be claimed. Reject new intake before durable acceptance when its declared capacity or retention bound cannot be met.

### Release and recovery checks

A cancellation signal or Alpha visibility extension at time 1 releases **zero** dependency permits in this fixture. Alpha still holds six permits until time 8 and at least two workers while its jobs execute. Over `[1,8)`, those signaled operations account for another `6 × 7 = 42` permit-seconds. Refunding them locally and issuing two quiet permits would record eight simultaneous claims against six physical permits; B1 still cannot begin a real dependency operation. The execution owner must observe operation termination, then release each permit exactly once. Worker release follows actual job cleanup. Visibility extension postpones an ordinary redelivery opportunity; it neither checkpoints Alpha nor reclaims its work. No authorized interruption exists here, so interruption-based useful-work loss or replay cost is unknown.

These checks are **proposed and unexecuted**:

| Check | Expected result |
| --- | --- |
| Repeat the supplied trace with the cost gate | B1 receives at 1 and finishes at 2; actual permits peak at 4, below 6. A2 stays accounted for and gets an Alpha turn after actual permit release. Measure its useful finish and acknowledgement separately. |
| Change one Alpha job to require six simultaneous operations | A job-count cap would admit it and block B1. The corrected gate must defer or reject dispatch, or use a validated lower-fan-out execution. If six-at-once is mandatory, the proposed Alpha allocation cannot promise that job useful completion; its accepted-work disposition needs resolution. |
| Split Alpha submissions across `g1` through `g4` | Client-group caps could occupy all four workers. Server grouping still charges every job to Alpha; excess accepted receipts remain bounded and recoverable, leaving B1’s protected worker and permit available. |
| Signal Alpha at time 1, before actual stop | Record six Alpha permits through time 8, not zero after the signal; no new operation starts against a falsely refunded permit. Assert every observed peak is at most six permits and four workers. |
| Extend a receipt’s visibility near its proposed expiry | The original retains its worker and any live operation permits until actual release. The extension changes only the planned lease expiry; a standard-queue duplicate remains possible. |
| Let a lease expire while an original attempt still runs—for example, a slowed operation lasting to time 12 with expiry at 10 | A redelivered receipt at 10 does not itself own an execution permit. The job-ID recovery owner must prevent overlapping execution or charge both actual attempts against the physical gate, reconcile effects, and acknowledge only after an authoritative outcome. |

For each run, record fair receipt time, useful start and finish, rejection or deferral, held worker and permit intervals, downstream attempts, and the per-customer occupancy oracle over a named window. A recovery run should also interrupt after acceptance and around effect/acknowledgement, then show that accepted jobs remain traceable, Alpha eventually makes useful progress, and re-admission never exceeds physical capacity. None of those production checks has been executed here.

`queue.md` was left unchanged.
