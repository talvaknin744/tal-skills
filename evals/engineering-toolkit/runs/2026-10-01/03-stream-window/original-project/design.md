# Device window proposal

Review only. This is a continuously running operator, not a completed batch.
The source and sink are fixed; no engine is installed in this fixture.

Required output is one immutable, append-only `(device, window_start,
window_end, sum, count)` row for each nonempty five-minute event-time window.
Windows are half-open. The example is device A in `[12:00, 12:05)` on
2026-10-01 UTC.

Both partitions p0 and p1 are required. A window becomes final when the
watermark of every required partition reaches its end. Until then, the
application must admit any source change targeting that unfinalized window,
even when its event timestamp is behind an observed watermark. After finality,
new/corrected input for that window is dropped with a durable audit reason;
the finalized row cannot change. Quiet partitions remain required unless an
explicit completeness policy is changed. Upstream watermarks are policy/progress
signals and are not a promise that older events physically cannot arrive.

Each logical measurement has `event_id`, `revision`, device, event timestamp,
and amount. Revisions are authoritative complete replacements for that same
measurement, never extra measurements. Its device and timestamp stay fixed in
this scenario. The source can resend a version under a new transport delivery
ID. Same event ID/revision must have identical payload; a conflict is rejected
with an audit while the accepted contribution remains intact. A newer revision
replaces the prior accepted contribution. Recovery can replay deliveries for
two hours while input progress remains stalled.

| Arrival UTC | Delivery | Partition | Event ID | Revision | Event UTC | Amount |
|---|---|---|---|---:|---|---:|
| 12:03:00 | d1 | p0 | e2 | 1 | 12:03:00 | 5 |
| 12:04:00 | d2 | p1 | e1 | 1 | 12:01:00 | 10 |
| 12:06:00 | d3 | p1 | e1 | 1 | 12:01:00 | 10 |
| 12:06:30 | d4 | p0 | e2 | 2 | 12:03:00 | 8 |
| 12:07:00 | d5 | p1 | e3 | 1 | 12:02:00 | 7 |
| 12:07:30 | d6 | p0 | e2 | 1 | 12:03:00 | 5 |
| 12:07:40 | d7 | p1 | e1 | 1 | 12:01:00 | 11 |
| 12:09:00 | d8 | p1 | e4 | 1 | 12:04:00 | 4 |

Initial watermarks are 12:00 on each partition. At wall-clock 12:05, p0's
watermark reaches 12:05 and p1's reaches 12:03. A checkpoint barrier is also
completed then. At 12:08, p1's watermark reaches 12:05. No other watermark
change occurs in the schedule.

Proposed operator:

```text
on_delivery(row):
    if transport_delivery_id was seen in the last 60 processing seconds:
        return
    mark transport_delivery_id seen with 60-second TTL
    sum[device, event_window] += row.amount
    count[device, event_window] += 1

on_wall_clock_tick():
    append every window whose end <= wall_clock_now
    delete its sum/count and mark it closed
```

The engineer says the checkpoint at 12:05 proves the window complete and that
the 60-second TTL bounds all necessary state. The append-only sink already
preserves each supplied output identity; this review does not need to redesign
broker acknowledgements or external notification effects.
