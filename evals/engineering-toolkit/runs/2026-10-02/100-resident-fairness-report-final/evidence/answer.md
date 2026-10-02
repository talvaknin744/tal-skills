## Verdict

**Neither the current execution-only limit nor the draft borrowing rule protects B/C.** A slot is held from receipt through actual release, including prefetch and cleanup. A cancellation request at time 1 does not free an executing A slot before time 8. Fair next-delivery order and the `active_A` dashboard value cannot create capacity. [worker.md](../final-project/worker.md)

| Schedule | A execution | B/C execution | Deadline result |
| --- | --- | --- | --- |
| Current | A1/A2 [0,8); A3/A4 [8,16) | Both [8,9) | Both B/C miss 3 |
| Draft borrowing; separate FIFO comparison | All four A [0,8), despite cancellation signals at 1 | Both [8,9) | Both B/C miss 3 |
| **One-slot reserve, exact trace** | A1/A2/A3 [0,8); A4 [8,16) | B1 [1,2); C1 [2,3) | All six meet deadlines |
| Two-slot reserve | A1/A2 [0,8); A3/A4 [8,16) | Both [1,2) | All six meet deadlines |

The one-slot schedule explicitly allows A3 as a third executing A job; it must be counted as such. If A’s execution limit must remain two, leave A3/A4 at the broker until time 8. They still finish at 16.

## Smallest feasible contract

In the supplied zero-turnaround timeline, **one physically usable slot is the minimum reserve**: B and C require two slot-seconds between arrival at 1 and deadline 3, and one slot provides exactly two. Cap A residency at three, leave A4 at the durable broker, and give ready B/C jobs the protected slot in turn. Do not lend that last slot to an eight-second A execution while a B/C arrival remains possible. Receive only when a job can run; keep local prefetch, blocked waiting, and retry waiting at zero for this trace. A cancellation signal does not release a permit.

This one-slot result has **no timing slack**. B must start at 1, finish and release its slot at 2, and C must start at 2. Cleanup or dispatch delay breaks the guarantee. A borrowed slot holding *nonexecuting* A state could be reclaimed only after that state is actually released, with the entire reclaim and dispatch path proven to fit the same timing budget; `worker.md` supplies no such bound. For an operational promise, keep **two slots physically available for B/C** until measurements establish a safe smaller bound. With two slots, each B/C job may start as late as 2, provided broker delivery and dispatch have a verified bound. Without a delivery bound, neither reserve alone proves a deadline.

For the proposed one-slot trace, broker waiting is finite: A4 waits from 0 to 8 and C1 from 1 to 2, with at most two jobs waiting at once. A broader intake contract still needs a count and byte limit before durable acceptance. Already accepted jobs must retain their identity in recoverable broker or paused state; expired jobs need an owned reconciliation disposition rather than an immediate retry loop.

## Utilization

Compare **executing slot-seconds over the same horizon**, not FIFO at 9 against reservation at 16:

| Schedule | Through time 9 | Through time 16 | On-time completions by 16 |
| --- | ---: | ---: | ---: |
| Current | 20/36 = 55.6% | 34/64 = 53.1% | 4/6 |
| Draft / FIFO | 34/36 = 94.4% | 34/64 = 53.1% | 4/6 |
| One-slot reserve with A3 executing early | 27/36 = 75.0% | 34/64 = 53.1% | **6/6** |
| Two-slot reserve | 20/36 = 55.6% | 34/64 = 53.1% | **6/6** |

The current worker’s prefetched A3/A4 make slots *resident* while CPU is idle; that occupancy is not useful execution. The draft’s high early busy fraction comes with late B/C results. By time 16, every schedule has executed the same 34 slot-seconds, so the claimed superior utilization does not follow.

## Verification plan and evidence status

- **Capacity oracle — proposed:** At every event, count every job from receipt until actual local release, including prefetched, blocked, retrying, cleaning up, and cancellation-signaled work. Assert total resident slots ≤4. For the one-slot schedule, assert A residency ≤3 and a usable protected slot when B/C need it. Record delivery, start, useful finish, settlement, acknowledgement, and release separately.
- **Completion oracle — proposed:** Assert B1 and C1 useful finish ≤3 and every A useful finish ≤20. For the exact one-slot schedule, expect B1 at 2, C1 at 3, A1–A3 at 8, and A4 at 16. Assert each accepted identity remains recoverable until successful settlement and acknowledgement.
- **Discriminating runs — proposed, not executed:** Replay current, draft, and both reserves under identical arrivals through time 16. Signal cancellation to borrowed A at time 1; expect its slot still held until 8 and B/C to finish at 9 if all four A jobs are executing. Add any positive B-to-C cleanup delay: the one-slot deadline then fails. Increase each B/C duration to 1.1 seconds: serial completion reaches 3.2, while two parallel slots finish at 2.1. Give A1–A4 fabricated distinct broker groups; the trusted tenant identity must still charge all four to A.
- **Broker contract — unresolved:** The file specifies recoverable payload and identity for this fictional trace, but no provider/version, trusted tenant mapping, fairness detector inputs, delivery-order or rate guarantee, or general duplicate/redelivery behavior. Fair receipt must be measured separately from useful start and finish. No broker, worker, or cancellation experiment has been run.

The file was left unchanged; no worker or broker operations were performed.
