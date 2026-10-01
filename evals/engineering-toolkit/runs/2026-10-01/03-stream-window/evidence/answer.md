The proposal is incorrect: it closes the window too early and counts deliveries instead of logical measurements. The required final result is **sum 25, count 3**, eligible for append at **12:08 UTC**. All files remain unchanged.

In [design.md](<trial>/workspace/project/design.md:45), the wall-clock rule would attempt to append `(15, 2)` at 12:05. The checkpoint does not establish completeness: p1’s watermark is still 12:03. Delivery-ID deduplication also misses resends under new IDs, treats revisions as extra measurements, and provides no conflict handling. The delivery handler never checks the recorded closure.

The smallest corrected contract is:

- **Window membership:** use source event time in UTC, with five-minute half-open windows. Arrival time determines processing order, not membership. An event at 12:05 belongs to the next window.
- **Admission and finality:** maintain recoverable, monotone progress for both required partitions. Let `F = min(watermark[p0], watermark[p1])`. A window remains open while `F < window_end`; admit valid changes targeting it even behind either watermark. Quiet partitions remain required. Once finalized, reject new measurements and corrections with a durable audit and preserve the immutable result.
- **Logical contributions:** key measurements by `event_id`, across transport deliveries. An identical version contributes once. A newer authoritative revision atomically replaces the previous amount: `sum += new_amount − old_amount`, with unchanged count. An older revision cannot undo the current contribution. A conflicting payload for a known event/revision is rejected and audited without changing the accepted contribution.
- **Output:** keep intermediate aggregates internal. Once `F >= window_end`, append one row for each nonempty window, using `(device, window_start, window_end)` as its stable output identity. Serialize delivery processing and finalization so the row includes every accepted change preceding the finalization decision.
- **Recovery:** recover contribution, revision, progress, and finalization decisions consistently. A checkpoint provides recovery evidence; it does not substitute for the watermark condition. Engine logical time must implement that ordering and recovery cut, rather than being equated with event time or wall time.

The independently expected trace follows. All times are UTC on 2026-10-01; sum/count refer to device A’s `[12:00, 12:05)` window.

| Arrival or progress | Required disposition | Sum | Count | External output |
|---|---|---:|---:|---|
| 12:03 d1: e2 v1 = 5 | Insert e2 | 5 | 1 | None |
| 12:04 d2: e1 v1 = 10 | Insert e1 | 15 | 2 | None |
| 12:05 watermarks/checkpoint | p0 = 12:05, p1 = 12:03; `F = 12:03`, still open | 15 | 2 | None |
| 12:06 d3: e1 v1 = 10 | Identical repeat despite new delivery ID | 15 | 2 | None |
| 12:06:30 d4: e2 v2 = 8 | Replace 5 with 8; delta +3 | 18 | 2 | None |
| 12:07 d5: e3 v1 = 7 | Admit despite event time 12:02 being behind `F` | 25 | 3 | None |
| 12:07:30 d6: e2 v1 = 5 | Stale replay; preserve v2 | 25 | 3 | None |
| 12:07:40 d7: e1 v1 = 11 | Conflict with accepted v1 = 10; audit rejection | 25 | 3 | None |
| 12:08 p1 watermark = 12:05 | `F = 12:05`; finalize | 25 | 3 | Append final row |
| 12:09 d8: e4 v1 = 4 | Finalized window; drop with durable audit | 25 | 3 | Existing row unchanged |

The surviving measurements are `e1 = 10`, `e2 = 8`, and `e3 = 7`, independently giving `10 + 8 + 7 = 25` and three measurements. The sole row is:

```text
(A, 2026-10-01T12:00:00Z, 2026-10-01T12:05:00Z, 25, 3)
```

State retirement follows finality and recoverability:

- **While open:** retain the aggregate, latest accepted revision/contribution per event, and sufficient payload evidence to detect conflicts with previously accepted versions. Retain this through stalled progress and recovery replay. Neither 60 seconds nor two hours permits expiry while the window remains open; two hours describes replay capability, not a completeness deadline.
- **After finalization:** retire window aggregate and event/version detail once the output and closure decision are durable or consistently reconstructible. At 12:08 this becomes eligible, but immediate deletion requires that recovery condition.
- **After detail retirement:** retain durable progress or compact closure evidence that independently prevents any replay from reopening the window. Retain the immutable output and required audits under their retention policies.

A 60-second transport cache can be optional acceleration. It cannot bound correctness state. With stalled required progress and continuing distinct measurements or revisions, the supplied contract establishes no fixed memory bound.

**Evidence:** I inspected the document and ran an in-memory arithmetic oracle that recomputed totals from accepted logical measurements. No engine is installed, so no engine output, restart behavior, cleanup, or memory bound was observed.

**Proposed engine checks:** assert this complete trace and both audits; replay duplicates, old revisions, and conflicting versions after 60 seconds and during a two-hour stall; test half-open timestamp boundaries and equality at finalization; restart around final append and state retirement, verifying one stable output row and that post-retirement replay cannot recreate state. These checks remain unexecuted.
