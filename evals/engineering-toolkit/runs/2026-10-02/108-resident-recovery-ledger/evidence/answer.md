## Review

The current execution-only limit does **not** protect B/C’s deadline. At time 0, A1/A2 execute while prefetched A3/A4 hold the other two slots. `active_A = 2` hides the fact that all four slots are resident. B1/C1 cannot start until time 8 and finish at 9, after their deadline of 3. Fair delivery order cannot free a slot already held by a worker. [worker.md](../final-project/worker.md)

The draft’s two-slot loan also fails. If A3/A4 execute on `[0,8)`, cancellation at time 1 returns a signal, but both jobs keep their slots until at least time 8. Counting those slots as free would admit six resident jobs to a four-slot pool; waiting for actual release makes B/C finish at 9. The A work can still finish usefully at 8, but the promised B/C deadline is impossible under that loan. [worker.md](../final-project/worker.md)

### Smallest feasible policy for the stated trace

**One protected slot is enough under the file’s exact one-second durations and zero-overhead schedule.** B and C can use it consecutively over `[1,3)`. One is the minimum: if all four slots start noninterruptible A work at time 0, none is available before time 8.

| Work | Proposed execution | Useful finish |
| --- | --- | ---: |
| A1/A2 and borrowed A3 | `[0,8)` | 8 |
| B1, then C1, on the protected slot | `[1,2)`, `[2,3)` | 2, 3 |
| A4, once protected demand is finished | `[3,11)` | 11 |

Cap **all resident A work at three slots** while this B/C demand can arrive. That count includes prefetch, dispatch waits, dependency blocks, retries, execution, and cleanup. Keep A4 at the durable broker until admission; if it has already been prefetched, count its slot as occupied until local state is actually released and it is safely returned. Count A3 as borrowed execution in the A and total-residency metrics, even if a separate “regular A” counter remains two. Admit B/C into the fourth slot one at a time, and give ready B/C work precedence over another A loan.

Starting A4 at 3 assumes the stated trace contains no later protected arrival. If B/C may continue arriving, keep the slot protected and start A4 on an A slot freed at 8; it then finishes at 16, still before A’s deadline of 20. A continuing deadline guarantee needs an arrival and service-time bound. The one-slot schedule also has **no slack**: any time between B’s finish and the slot’s actual release, or any dispatch delay before C, can make C late. Two genuinely free slots allow B/C to run together on `[1,2)` and provide more margin, but are not the mathematical minimum for this trace.

The capacity oracle is `held_A(t) + held_B(t) + held_C(t) ≤ 4`, using acquisition through **actual release**, including work that has received a cancellation signal. For the one-slot trace, A holds at most three slots before C releases; B/C together hold at most one. In the named window `[0,3)`, the oracle `Σ(held slots × overlapping held time)` is **A = 9, B = 1, C = 1 slot-seconds**, total 11 of 12 available slot-seconds, with a peak of four slots. Completion oracles are B ≤ 3, C ≤ 3, and every A ≤ 20.

### Utilization

Use the same demand and horizon. FIFO executes all A on `[0,8)` and B/C on `[8,9)`: 34 execution slot-seconds. The one-slot policy also executes 34 slot-seconds. Over `[0,16)`, **both are 34/64 = 53.125% busy**. FIFO finishes B/C late; the protected schedule finishes both on time. At horizon 9, FIFO is 34/36 = 94.4% busy while the trace-specific protected schedule is 32/36 = 88.9% busy. Comparing FIFO at 9 with a reserve policy at 16 cannot establish superior utilization.

Residency tells a different story from CPU busyness. Under the current policy, prefetched A3/A4 consume 16 slot-seconds on `[0,8)` without executing. Its residency over `[0,16)` is 50/64 = 78.125%, despite B/C missing their deadline. Busy fraction alone is therefore not the success measure; timely useful completions and actual held capacity are.

### Verification plan — unexecuted

No worker or broker experiment has been run. The file supplies durable payload and stable identity until successful settlement and acknowledgement, but no provider/version, delivery ordering guarantee, fairness detector, lease rule, or duplicate/redelivery contract. Those remain unresolved; “fair next delivery” is not a completion guarantee.

| Check | Expected result and oracle |
| --- | --- |
| Current limit and draft loan | At time 1, measure four held A slots. After a draft cancellation signal, borrowed A remains held until at least 8. A B/C start before release must trip the four-slot capacity oracle; waiting makes both finish at 9. |
| Proposed one-slot schedule | Observe actual B release by 2, C start at 2 and useful finish by 3; A4 stays nonresident until admitted. Record held-time integrals and the four-slot peak, not just handler counts. |
| Changed cost or cleanup | Make B’s release take positive time after 2, or make either B/C execution exceed one second. One slot then misses C’s deadline; test whether two free slots meet it with measured overhead. |
| Tenant identity and delivery | Split A into fabricated broker groups and vary delivery order. Enforce the A residency cap using trusted tenant identity; measure fair receipt, useful start, and finish separately. Broker grouping must not bypass the cap. |
| Lease extension and expiry | Hypothetically expire B’s lease at 1.5 while its original attempt holds the slot through 2. A redelivery must not acquire a fifth slot or repeat an effect. Test extension before expiry separately: extension must not be counted as release. Actual broker behavior and duplicate protection require provider-specific verification. |

For this trace, provisional waiting bounds are **C: at most one second before start; A4: at most three seconds if the reserve is released after C, or eight seconds if maintained**. Use no retry within the deadline calculation. If accepted work expires or an attempt fails, keep its stable identity and payload under durable authority for recovery; do not acknowledge it merely to clear capacity. The recovery owner, retention period, lease bounds, and business disposition for late accepted work need a verified broker contract before this becomes a production deadline promise.
