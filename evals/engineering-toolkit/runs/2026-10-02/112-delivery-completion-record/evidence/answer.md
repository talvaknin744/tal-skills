## Review of [queue.md](../final-project/queue.md)

**The delivery-based deadline claim is unsupported.** `MessageGroupId` is a fairness grouping key, but the client can split one authenticated customer across `g1` and `g2`. A cap of two received jobs *per group* therefore admits both Alpha jobs. The supplied contract changes future delivery opportunities; it supplies no ordering, consumption-rate limit, worker reservation, permit reservation, or completion deadline. Low Beta queue dwell says only that B1 was delivered promptly.

**The supplied B1 outcome is late by six seconds.** A1 and A2 hold all six permits on `[0,8)`. B1 arrives at time 1, waits seven seconds for a permit, runs on `[8,9)`, and finishes at 9 against a deadline of 3. To finish by 3 with its one-second operation, it would need a permit by time 2. Over `[0,9)`, Alpha holds **48 permit-seconds** and Beta holds **1**. The proposed simultaneous guarantees require **8 permits on a physical pool of 6**. Extending visibility changes redelivery timing; releasing permits in a local counter at time 1 changes no operation. The six permits remain physically held until time 8. A cancellation signal has the same limitation here.

## Smallest supported correction

Use the stored `authenticated_customer` and job identity for admission accounting, and derive a stable `MessageGroupId` from that trusted customer at the producer. Never authorize a data read from the group string. For this four-slot, six-permit fixture, a **provisional** feasible allocation is:

| Resource | Fleetwide allocation and ownership |
| --- | --- |
| Dependency permits | Six actual permits total: three protected for one Alpha job, one protected for quiet work, and two shared. Reserve all three for an Alpha job before its parallel operations start. Count every original or redelivered operation until it actually terminates; release exactly once. A second three-operation Alpha job cannot start while A1 holds its three. |
| Worker slots and receipts | Four total local receipts, including prefetched, deferred, blocked, retry-waiting, executing and settling jobs. Keep one slot available to quiet work; Alpha may occupy at most three. Count a slot until execution and cleanup actually end. |

The protected one-permit, one-slot quiet share is sufficient for **B1 in the stipulated trace**, where no other quiet job occupies it. With A2 held out of dependency execution, B1 can start at time 1 and finish at time 2. If A2 becomes eligible when A1 releases at time 8, A2 then finishes at time 16. Neither that redelivery time nor a general quiet-customer deadline follows from the supplied provider contract.

Treat a received A2 that lacks capacity as accepted, deferred work, not as a completed or discarded job. A concrete provisional local bound is **one deferred Alpha receipt for at most one second**, with **no speculative visibility extensions or local retries**; after that, preserve its durable broker/job identity for redelivery without acknowledging completion. The visibility, retention, retry and terminal-disposition settings needed to prove eventual recovery are **unresolved**. Do not turn this provisional bound into a production SLO claim.

## Checks before claiming the correction works

- **Useful outcome:** Replay the same A1/A2/B1 demand. Record delivery, useful start, finish, deadline result, rejected or deferred work, and actual permit occupancy. B1 must finish by 3 in the controlled trace; Alpha work must subsequently complete rather than disappear. Compare each tenant’s held-resource time as `sum(held permits × overlap from actual acquisition to actual release)`.
- **Ownership and capacity:** Exercise prefetch, blocked work, retry waits, settling, a changed job cost, and a protected arrival just after shared capacity is borrowed. Assert at most six physical permits and four resident slots, with the quiet reserve usable on arrival. A timeout or cancel acknowledgement must not free either count while the operation continues.
- **Recovery:** Exercise visibility expiry and duplicate delivery, interruption after acceptance, and restart around operation completion and acknowledgement. Use job identity to prevent duplicate useful effects, retain recoverable payload and progress, and resume admission only after actual owners and capacity are reconciled. The cost of interrupting or replaying Alpha work is unknown; at time 1, the existing six operations alone still require **42 permit-seconds** through time 8.

These are proposed checks, not executed results. The file was left unchanged.
