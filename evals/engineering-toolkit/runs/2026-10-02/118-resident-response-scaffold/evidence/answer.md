## Broker contract

**Verdict:** Neither the current execution-only limit nor the draft’s cancellation-based borrowing protects B/C’s deadline. Receiving A3/A4 occupies the last two slots even while they use no CPU. A fair *next delivery* cannot place B/C into a pool with no free slot. The draft then starts all four A jobs; cancelling borrowed A3/A4 at time 1 does not release their slots before time 8. B/C finish at 9, past their deadline of 3. These conclusions follow from the supplied [worker contract](../final-project/worker.md).

The broker is fictional: provider, version, detector inputs, ordering, delivery rate, duplicate and redelivery guarantees are unspecified. The file supplies recoverable payload and stable identity until effect settlement and acknowledgement, but no broker fairness or completion guarantee. A production policy must use a trusted tenant identity; the labels A/B/C alone do not establish how that identity is authenticated.

## Allocation

Four slots exist, and each received job costs one slot through actual release. B and C need two slot-seconds in `[1,3)`. **One continuously usable slot is the mathematical minimum**: run B1 on `[1,2)` and C1 on `[2,3)`. This meets C’s deadline exactly, with no time for handoff or settlement overhead.

| Schedule | A execution | B/C execution | Useful finishes |
| --- | --- | --- | --- |
| Supplied current | A1/A2 `[0,8)`; A3/A4 `[8,16)` | Both `[8,9)` | All A by 16; B/C late at 9 |
| Draft borrowing, with actual release | A1–A4 hold slots through 8 | Earliest `[8,9)` | B/C late; useful A3/A4 completion after cancellation is unproven |
| **Minimal feasible reserve** | A1–A3 `[0,8)`; A4 `[8,16)` | B `[1,2)`; C `[2,3)` | B at 2, C at 3, all A by 16 |

For the minimal schedule, keep **one slot physically unborrowed while a future B/C arrival is covered by the deadline promise**. A may execute in the other three slots; A4 stays at the broker. This changes A’s execution ceiling from two to three and counts *all* A execution, including any borrowed work. It needs no cancellation or reclaim at B/C arrival. If the A execution ceiling must remain two, A1/A2 still run `[0,8)` and A3/A4 `[8,16)`; B/C still meet the deadline on the reserved slot.

Two unborrowed slots let B and C run together on `[1,2)`, giving one second of timing slack. Use that stronger reserve if measured receipt, dispatch, execution or settlement time makes the one-slot handoff miss time 3. Lending both slots at time 0 is infeasible: the eight-second A jobs cannot be reclaimed by time 1.

## Residency and waiting

For this trace, the proposed bounds are **four resident jobs across the entire pool, at most three resident A jobs, one guaranteed usable B/C slot, and zero prefetched or locally deferred jobs**. Acquire a slot before receipt; leave A4 and, until time 2, C1 in the durable broker backlog. Charge executing, blocked, retry-waiting and settling jobs until actual release. The peak is four held slots on `[1,3)`; it never exceeds physical capacity.

These are fleet bounds for the four-slot fictional pool, not independent per-worker quotas. Broker backlog peaks at two jobs in this schedule; A4 waits eight seconds to start and C1 waits one. Payload byte sizes are absent, so a byte bound cannot be validated from the file. A real intake cap and retention bound require payload sizes and the broker’s acceptance contract.

## Expiry and recovery

Leave work durably accepted at the broker until a slot is available. A job received but not started may be returned only after its local state is released; acknowledge only after successful effect settlement. An expired accepted job needs a declared terminal business outcome rather than silent loss. The trace specifies no failures, so no retry is needed for its schedule.

A provisional recovery rule is **one active attempt per stable job identity, no local retry waiting, and capacity-gated redelivery after confirmed release**. A failed attempt would remain durably pending, with a bounded broker delay before another attempt; the delay, attempt budget, lease or visibility extension, retention period, and effect/ack reconciliation cannot be finalized without a provider contract. In particular, a visibility extension would preserve delivery ownership; it would not reclaim a worker slot.

## Actual release

The worker owns a slot until execution and cleanup have actually ended. Under the draft, A1–A4 still hold **four** slots after the cancellation signal at time 1. Starting B1/C1 then would require **six** held slots, against a physical limit of four. Observe release and effect settlement, not the cancellation response, before readmission. No dependency permits are specified in this trace; tests with blocked operations must count any permits they actually retain.

## Interruption cost

The proposed cancellation gains no capacity before time 8. A3/A4 together consume 16 slot-seconds through that point, including 14 after the time-1 signal. If their effects still settle, that work may complete usefully at 8; if cancellation invalidates it, up to 16 slot-seconds must be repeated, with additional cleanup or replay cost unknown. The supplied contract does not justify promising useful A completion from interrupted work. The feasible reserve schedule avoids that uncertainty and finishes every A job by 16, ahead of 20.

## Fair useful outcomes

Use the **same `[0,16)` window** for every policy. The capacity oracle is the sum, for every job, of `held slots × overlap of acquisition-to-actual-release with [0,16)`. The completion oracle records each job’s successful effect settlement against its own deadline.

| Schedule | A held slot-seconds | B/C held slot-seconds | Execution busy fraction | On-time jobs |
| --- | ---: | ---: | ---: | ---: |
| Current, including prefetched A3/A4 | 48 | 2 | 34/64 = 53.1% | 4/6 |
| Minimal reserve, no prefetch | 32 | 2 | 34/64 = 53.1% | 6/6 |
| FIFO, all A first | 32 | 2 | 34/64 = 53.1% | 4/6 |

The draft’s FIFO fraction at horizon 9 is `34/(4×9) = 94.4%`; a policy measured through horizon 16 has a different denominator. That comparison cannot establish superior utilization. On the common `[0,16)` window, each once-only execution schedule does the same 34 slot-seconds of work. The current policy additionally *holds* 16 slot-seconds in prefetched, nonexecuting A jobs; calling those slots “busy” would reward capacity that cannot serve B/C. The useful distinction is that the reserve meets both protected deadlines while finishing A by 16.

For this **fully known six-job trace only**, once B/C have settled at time 3 and it is known no more B/C jobs will arrive, A4 can start on `[3,11)`. All A then finish by 11. An empty B/C queue alone is insufficient grounds for this loan when future protected arrivals remain possible.

## Verification matrix

No worker or broker experiment was run. The supplied timings support the current schedule; the proposed schedules and checks below are analytical or unexecuted.

| Schedule and transition | Expected ownership, capacity and completion oracle | Status |
| --- | --- | --- |
| Current prefetch at 0; B/C arrive at 1 | Four A slots held until 8; B/C start 8, finish 9 | Supplied trace |
| Proposed receipt and broker deferral | No local prefetch; A resident ≤3; C remains broker-owned until 2; peak held ≤4; B finishes 2, C finishes 3, A by 16 | Analytical; execute in a controlled test |
| Blocked A, local retry wait or effect settlement | Each retains its slot until proven released; if it occupies the hard reserve or extends a protected handoff, the deadline oracle fails | Unexecuted; inject each state |
| Protected arrival immediately after borrowing begins | With one hard reserve, B/C use that slot; with both reserves lent at 0, no slot releases before 8 | Analytical; test at time 1 |
| Cancellation signal before actual stop | Permit remains held through time 8; never admit work that raises held slots above four | Contract-supported; instrument release timestamps |
| Changed job cost or dispatch overhead | Recompute required reserved slot-time; one serial lane fails if C completes after 3 | Unexecuted; sweep duration and handoff delay |
| Fragmented or forged group identity | Allocation follows authenticated A/B/C identity; group splitting cannot enlarge A’s three-slot allowance | Unexecuted; identity source unknown |
| Visibility extension, expiry and redelivery | No second active attempt for an identity; combined original and redelivered occupancy ≤4; accepted payload remains recoverable | Unexecuted; broker semantics unknown |
| Failure and recovery | Re-admit only after actual release and a free permit; retain accepted work and measure eventual useful completion | Unexecuted; retry and retention contract unknown |

**Coverage audit:** The four-slot capacity and trace deadlines are supported; no file was changed and no worker or broker operation was performed. Production broker semantics, trusted identity, payload sizes, handoff and settlement overhead, lease/retention limits, dependency permits, and recovery behavior remain unresolved and require the indicated contract checks and controlled measurements.
