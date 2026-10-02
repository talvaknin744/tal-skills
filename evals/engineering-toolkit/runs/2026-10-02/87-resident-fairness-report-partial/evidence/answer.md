**Neither the current execution-only limit nor the draft borrowing protects B1/C1’s deadline.** A worker slot is held from receipt through actual release, including prefetch and cleanup ([worker.md](../final-project/worker.md)). Fair delivery cannot make an occupied slot usable, and a cancellation request does not stop an executing A job.

| Schedule | A execution | B1/C1 execution | Result |
| --- | --- | --- | --- |
| Current | A1/A2 `[0,8)`; A3/A4 prefetched, then execute `[8,16)` | Both `[8,9)` | A meets 20; B/C miss 3. |
| Draft borrowing | All four A jobs `[0,8)`; cancellation requested at 1 but slots remain held | Both `[8,9)` | A meets 20; B/C miss 3. Counting the borrowed executions outside `active_A` hides two occupied slots. |
| Smallest feasible reserve for this trace | A1–A3 `[0,8)`; A4 `[8,16)` | B1 `[1,2)`, C1 `[2,3)` on one slot | All six meet their deadlines, with C finishing exactly at 3. |

**Minimal allocation contract for the stated durations:** cap *resident* A work at three of the four slots across this pool; leave A4 at the durable broker until a slot can execute it. One slot must be usable by B/C at time 1. Dispatch B1 then C1 without a gap, retain the current recoverable broker identity and payload, and release a slot only when execution and cleanup have actually ended. Raising A’s execution limit from two to three gives the A schedule above; keeping it at two also works for B/C, but A3/A4 would run `[8,16)`. Fair next-delivery order is useful for choosing ready work, but is not the capacity guarantee.

One slot is the mathematical minimum: B/C need two slot-seconds during `[1,3)`. It has **zero scheduling or cleanup slack**. If those delays are positive or not bounded tightly enough, reserve two slots and run B1/C1 in parallel `[1,2)`; A1/A2 run `[0,8)` and A3/A4 `[8,16)`. An idle reserve may be lent to *waiting* A work only with a proven timely release of local state. Executing an eight-second A job on it at time 0 cannot be reclaimed for the time-1 arrivals. Once no more protected arrivals can occur, releasing the reserve can advance A3/A4; that assumption is absent for an ongoing service.

**Verification plan and oracles** (proposed checks; none have been executed):

| Check | Capacity and completion oracle |
| --- | --- |
| Reproduce the three schedules | At every instant, count every received job through actual release: total held ≤4 and, under the one-slot policy, A held ≤3. Observe B/C useful finishes ≤3 and all four A finishes ≤20; count settled effects and acknowledgements separately from handler completion. |
| Signal before stop | Request cancellation of borrowed A at 1. Its slot must remain held until 8; B/C cannot be reported admitted into it at 1. Verify any unexecuted returned job releases local state before return while its stable identity remains recoverable. |
| Changed cost | Make B1 take two seconds and C1 one. A single reserve necessarily misses one deadline; two reserves allow B1 `[1,3)` and C1 `[1,2)`. |
| Fabricated groups | Give the four A jobs distinct broker group labels. The trusted tenant identity must still charge all four to A; A occupancy remains ≤3 and B/C complete by 3. If labels bypass that cap, the policy fails. |

Also bound local waiting to the running protected job and leave the other at the durable broker; check its age before dispatch. Intake beyond the demonstrated two-job demand cannot inherit this deadline promise without another capacity calculation. Already accepted jobs need a defined durable expiry or recovery disposition, not silent deletion. The broker provider/version, trusted grouping, delivery ordering, duplicate and redelivery behavior, and fairness detector are unspecified in `worker.md`, so none is a verified completion guarantee.

**Utilization:** FIFO executes 34 slot-seconds by time 9, or `34/(4×9) = 94.4%`, but B/C finish late. Over the *same* `[0,16)` window, FIFO and the feasible one-reserve schedule each execute 34 slot-seconds: `34/(4×16) = 53.1%`. At time 9, the one-reserve schedule has executed 27 slot-seconds (`75%`) while meeting B/C’s deadline. Comparing FIFO through 9 with a reserved schedule through 16 changes the denominator and proves no utilization advantage. The current worker’s prefetched A jobs raise **slot occupancy** without doing useful execution; that is why idle CPU and `active_A = 2` do not establish available capacity.
