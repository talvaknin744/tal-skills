# Export delivery replay and ownership traces

Queue deliveries contain a stable `export_id`. Delivery is at least once.
`ack` can succeed at the coordinator even if its response is lost; if the
request did not arrive, the delivery becomes visible after its lease expires.
A handler cannot distinguish those outcomes from the timeout alone.

Progress and exported rows live in one SQL database. `exports` contains
`export_id`, `state`, `next_offset`, `owner`, `generation`, and `lease_until`.
An atomic claim of an expired lease changes the owner and increments the
monotonic generation. The storage API can compare the current owner/generation
and lease validity within the same transaction as progress or row writes,
rejecting the entire transaction on mismatch. Its default `write_rows` and
`save_progress` methods perform unconditional writes. Rows are appended with
new row IDs. The input manifest is immutable and row offsets are stable.

Trace 1, network fault after finalization:

```text
08:04:09 A commits rows 990–999 and next_offset=1000
08:04:10 A commits the summary row and state=completed
08:04:11 A sends queue ACK; client reports timeout
08:04:56 queue redelivers export ex-27 to B
08:04:57 B claims expired lease, generation=18; state still completed
08:04:58 B starts finalization, appending a second export summary row
```

Trace 2, worker suspension:

```text
09:10:00 A owns ex-28 at generation=4, next_offset=40, lease_until=09:10:30
09:10:12 A pauses after computing rows 40–49
09:10:31 B claims generation=5 and commits through next_offset=70
09:10:44 A resumes and appends rows 40–49; saves next_offset=50
```

Process suspension does not cancel in-flight handlers. Heartbeat failures are
logged, but the client has no mechanism that revokes database access. The
patch under review adds a progress read before processing and retries ACK
three times. It retains the unconditional storage calls shown below. Export
consumers require one logical row per input offset and a single final summary.
