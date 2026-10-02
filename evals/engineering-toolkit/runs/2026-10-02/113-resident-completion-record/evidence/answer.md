## Review

**Neither the current execution-only limit nor the draft borrowing policy protects B1/C1’s deadline.** A slot is occupied from receipt through actual release, including prefetch and waiting. In the current trace, A1–A4 occupy all four slots at time 0 even though `active_A` reports only two executing handlers. B1/C1 therefore run on `[8,9)` and finish at 9, after their deadline of 3. Under the draft, A3/A4 execute on `[0,8)`; cancellation at time 1 returns immediately but does not release either slot. B1/C1 still cannot run before 8. Counting those slots as free and dispatching B/C at time 1 would produce **six held jobs on four physical slots**. Fair next-delivery order cannot release an occupied slot. These conclusions follow from the residency and cancellation rules in [worker.md](../final-project/worker.md).

| Schedule | A execution | B/C execution | B/C useful finish | Last A useful finish |
| --- | --- | --- | ---: | ---: |
| Current | A1/A2 `[0,8)`; A3/A4 `[8,16)` | Both `[8,9)` | 9 | 16 |
| Draft borrowing | All four `[0,8)`; cancellation at 1 does not stop them | Both `[8,9)` | 9 | 8 |
| Smallest feasible reserve for this trace | A1–A3 `[0,8)`; A4 `[3,11)` | B1 `[1,2)`; C1 `[2,3)` | 2, 3 | 11 |

The feasible schedule uses **one pooled B/C slot**: their two one-second jobs can run sequentially in `[1,3)`. It gives A one execution slot beyond its regular limit of two, so total executing A is three until time 8 and must be reported as three. A4 remains at the broker until the protected work finishes; no executing A needs to be reclaimed.

## Minimum allocation contract

These are **proposed trace bounds**, not measured production guarantees:

- **Allocation and residency:** Gate *before receipt*. Through B/C completion, at most three A jobs may be resident across the single four-slot pool, and one slot must remain usable for B/C. Count executing, prefetched, deferred, blocked, retry-waiting, and settling jobs until actual release. For the displayed schedule, local nonexecuting receipts are capped at zero; A4 stays in the durable broker backlog. At time 1, C1 also waits there for one second. Peak local and fleet residency is four.
- **Reserve and borrowing:** A may execute on one of the three A slots as an explicit exception to its regular execution limit. It cannot borrow the final protected slot for an eight-second, noninterruptible job while a B/C arrival with this deadline remains possible. In this *closed trace*, after C1 finishes and releases its slot at 3, A4 may take it and finish at 11. If future protected arrivals remain possible, keep that slot reserved; start A4 on an A slot at 8 and finish at 16, still before its deadline of 20.
- **Reclaim and recovery:** A cancellation signal changes no capacity accounting. Return an unstarted receipt only after its local state is released; retain its broker payload and stable identity for capacity-gated rereceipt. The trace requires no worker-held deferral, lease extension, retry, or interruption. Provider-specific redelivery, retry limits, payload byte bounds, and cleanup time are unspecified and need measurement before an operational guarantee.

One reserved slot is the mathematical minimum **only with the trace’s immediate dispatch and stated useful finish times**: C1 finishes exactly at 3, leaving zero slack. If the team needs room for dispatch or settlement delay, two usable slots let B1/C1 run together on `[1,2)`, leaving one second of slack. That slack is a bound to verify, not an inferred guarantee. If A’s execution limit of two is immutable, keep A3/A4 at the broker, run B/C in parallel on `[1,2)`, then run A3/A4 on `[8,16)`.

The broker in [worker.md](../final-project/worker.md) supplies recoverable payload and identity until settlement and acknowledgement. Its provider, ordering, fairness detector, redelivery behavior, and real recovery timing are unresolved. No broker delivery rule alone establishes slot availability or useful completion.

## Capacity, completion, and utilization oracles

For any window \(W\), measure each tenant’s held-slot time as **Σ(slot units × overlap of acquisition-to-actual-release with \(W\))**, including work signaled for cancellation. The physical assertion is `held slots ≤ 4` at every instant. For the one-slot schedule on `[1,3)`, A holds **6 slot-seconds**, B holds **1**, and C holds **1**; all 8 available slot-seconds are accounted for. Current and draft schedules give A all **8** and B/C **0** in that deadline window.

The useful-completion assertions are `B1 ≤ 3`, `C1 ≤ 3`, and each `Ai ≤ 20`, after the successful effect. The proposed trace meets all six; current, draft, and FIFO each meet the four A deadlines but miss both B/C deadlines. No worker or broker experiment has verified these assertions.

The FIFO comparison uses 34 useful execution slot-seconds and reports `34/(4×9) = 94.4%` at time 9. The one-slot protected schedule has `32/(4×9) = 88.9%` then, and `34/(4×16) = 53.1%` by time 16. FIFO is **also** `34/(4×16) = 53.1%` at time 16. Different horizons cannot support the draft’s utilization claim. Nor should occupied prefetch slots be counted as useful execution: the current worker accumulates 50 resident slot-seconds by time 16 but only 34 useful execution slot-seconds. The protected schedule trades some early utilization for two on-time B/C finishes.

## Verification plan — unexecuted

| Scenario | Capacity and useful-work assertion |
| --- | --- |
| Receipt and protected arrival just after A borrowing starts | At time 0, exactly three A slots held and A4 broker-resident; at time 1, B starts, C remains at the broker; B releases at 2, C at 3; peak held slots ≤4 and both finishes ≤3. |
| Prefetched, deferred, dependency-blocked, retry-waiting, or settling A | Each state remains charged to A until actual release. No such A may capture the protected fourth slot. Delay cleanup deliberately and verify that a counter does not release early. |
| Draft cancellation at time 1 | A3/A4 remain held until 8. Either B/C wait and finish at 9, or dispatching them exposes a physical peak of six, which must fail the capacity assertion. |
| Cost or identity changes | Recalculate the reserve in **slot units** if a job needs more than one slot; one slot no longer suffices for a two-slot B or C. Verify trusted tenant identity so splitting A into apparent groups cannot evade the residency cap. |
| Visibility expiry, redelivery, and recovery | Preserve accepted payload and identity; gate any rereceipt while an original still holds capacity; check effect settlement and acknowledgement before terminal removal. Measure replay, cleanup, and recovery delay against remaining deadlines. |

There is **no interrupted or repeated work in the supplied trace**. The draft’s cancellation loses no A progress precisely because it does not stop A3/A4—and therefore frees no capacity. A hypothetical hard interruption at time 1 would discard their two combined slot-seconds of partial execution and require up to 16 slot-seconds to rerun both from the start; that operation is unsupported by the stated worker contract. Cleanup and real broker replay costs remain unknown.
