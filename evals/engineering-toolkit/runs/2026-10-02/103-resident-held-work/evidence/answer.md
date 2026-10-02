## Verdict

The current execution-only limit and the draft borrowing rule **do not protect B1/C1’s time-3 deadline**. A slot is occupied from receipt through actual release, including prefetch and cleanup. `active_A <= 2` therefore says too little about available slots. A cancellation response at time 1 also cannot reclaim an executing A job that runs until time 8. Fair delivery order cannot supply the missing capacity. These conclusions follow from the stated worker lifecycle in [worker.md](../final-project/worker.md).

| Schedule | Slot use | Useful finishes |
| --- | --- | --- |
| Current | A1/A2 execute `[0,8)`; A3/A4 hold the other slots while waiting. At 8, A3/A4 and B1/C1 start. | B1/C1 at **9**, late; A jobs at 8 and 16. |
| Draft borrowing | All four A jobs execute `[0,8)`. Cancellation at 1 returns immediately, but all four slots remain held until 8; B1/C1 run `[8,9)`. | B1/C1 at **9**, late; all A jobs at 8. |
| Feasible two-slot protection | A1/A2 execute `[0,8)`; A3/A4 stay at the broker. B1/C1 run `[1,2)`. A3/A4 run `[8,16)`. | B1/C1 at **2**; all A jobs by **16**, within their time-20 deadline. |

## Smallest feasible contract

For this trace, charge **every received A job** against a resident-work limit, whether executing, prefetched, blocked, retry-waiting, or cleaning up. A reliable two-slot B/C contract permits at most **two resident A jobs** while their deadline needs protection. Receive A3/A4 only when slots are available. The equivalent reclaim path is to release *unexecuted* A3/A4’s local state and return them to the durable broker before receiving B/C; that path needs a proven release-and-dispatch bound. Never count an executing borrower as reclaimed on a cancellation signal.

Two slots are a defensible reserve for simultaneous B/C arrivals: both can start at 1 and finish at 2, leaving one second of start-time slack before their latest start at 2. The arithmetic minimum in the idealized trace is **one** slot: B1 could run `[1,2)` and C1 `[2,3)`. That finishes exactly at the deadline and requires instantaneous handoff, no extra settlement or cleanup time, and a verified receive order. Those bounds are not supplied, so one slot cannot support the draft’s deadline promise. Borrowing a protected slot for an eight-second, noninterruptible A job at time 0 is infeasible under either reserve size.

Keep local waiting and retry-wait occupancy at zero for this trace: A3/A4 can wait durably at the broker until 8. If a protected job cannot start by 2, preserve its identity and payload in a recoverable state and report the missed on-time guarantee; do not silently discard an accepted job. A production retry and broker-backlog bound still needs the actual broker contract.

## Utilization

The six jobs require **34 slot-seconds of execution**: \(4×8+2×1\). Compare schedules over the *same* horizon and denominator of four slots. At time 16, both FIFO and the two-slot policy have used \(34/(4×16)=53.125\%\) of available execution capacity. At time 9, FIFO has used \(34/36=94.4\%\), while the protected schedule has used \(20/36=55.6\%\) and still has A3/A4 running. Mixing FIFO’s time-9 fraction with a reserved policy’s time-16 fraction establishes no utilization advantage. FIFO’s earlier completion of A comes with late B/C work; the protected schedule meets every stated deadline. The current worker also shows why *resident occupancy* is a different metric from useful execution: A3/A4 consume two slots throughout `[0,8)` without executing.

## Verification plan and evidence status

No worker or broker experiment has been run; the following checks are **proposed, unexecuted**.

| Required evidence | Oracle |
| --- | --- |
| **Broker contract — unresolved** | Identify provider/version, trusted tenant identity, delivery ordering, fairness inputs and guarantees, lease/visibility, duplicate and redelivery behavior. The file supplies durable recovery through acknowledgement and no duplicate effects **in this trace**; it supplies no real broker deadline guarantee. Measure fair receive separately from useful start and finish. |
| **Allocation and waiting — proposed** | Instrument every acquired slot from receipt to actual release. At every instant, held slots ≤ **4**; under the two-slot contract, resident A ≤ **2** while B/C protection applies. Count prefetch, blocked work, retry waits, and cleanup. A3/A4 remain recoverable at the broker through time 8; no local waiting item consumes their slots. |
| **Actual release — supplied rule; check proposed** | At time 1, signal cancellation of borrowed A3/A4 and inspect actual ownership. Expected: four A slots still held until 8, zero available for B/C. An acknowledgement at 1 must not decrement occupancy. Check release only after execution, settlement, and cleanup; record any lost or repeated useful work if an implementation adds real interruption. |
| **Discriminating checks — proposed** | Run current, draft, and protected schedules with identical arrivals. Assert B1/C1 useful finish ≤ **3**, every A finish ≤ **20**, peak held slots ≤ **4**, and each accepted job remains accounted for. Increase B/C duration or handoff time: the one-slot serial schedule must expose its zero slack, while a two-slot schedule passes only if each job still starts and settles by its deadline. Split A into fabricated broker groups: trusted tenant accounting must still charge all A work to A. For a broker with leases, test extension before expiry and expiry/redelivery during `[0,8)`; neither path may create a fifth held slot or a duplicate successful effect. Record original and redelivered attempt ownership separately. |

The file was left unchanged; no worker or broker operations were performed.
