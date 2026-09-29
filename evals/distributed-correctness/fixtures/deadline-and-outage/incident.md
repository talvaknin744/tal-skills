# Forced termination during export shutdown

`archive-531` is an 18-hour export handled by a generic queue worker. The host
supervisor allows 90 seconds after SIGTERM, then destroys the process. The
queue coordinator owns delivery leases and durable progress; `checkpoint`
and `release` are separate RPCs with independently committed results. A
client timeout does not establish whether either RPC committed. During the
incident the worker cannot reach that coordinator for four minutes, although
other hosts can. Lease expiry can therefore make the delivery available to
another worker. The independent operations ledger remains reachable.

The export has ordinary 20-second checkpointable batches followed occasionally
by a native compression call lasting 70–140 seconds. That call cannot emit a
checkpoint or observe application cancellation before returning. Killing the
process during it leaves an incomplete temporary object; a replacement can
recompute it from the previous durable cursor. Final objects are published
only after compression returns. The temporary object name is recorded before
the call begins.

Timeline:

```text
14:00:00 compression starts from durable cursor=840
14:00:05 deployment SIGTERM arrives; supervisor deadline=14:01:35
14:00:06 coordinator connectivity fails
14:01:10 compression returns; local cursor=860; checkpoint RPC starts
14:01:20 checkpoint(cursor=860) times out; release RPC starts
14:01:30 release(delivery) times out; ACK RPC starts
14:01:35 supervisor destroys process; no ACK result recorded
```

The proposed handler is attached to both deployment SIGTERM and a user's
“Cancel export” action. Product contract: deployment replacement leaves the
logical export eligible to resume. User cancellation requests a terminal
cancelled outcome and cleanup tracking, while already published objects may
remain until cleanup finishes. Status must not claim that an unresponsive
native call stopped immediately. Jobs with uncertain checkpoint, release, or
completion outcomes must appear in the operations ledger for reconciliation;
shutdown must never silently acknowledge unfinished work as completed. The
ledger accepts an export ID, attempted operation, last confirmed cursor,
temporary object name, and an unresolved reason.
