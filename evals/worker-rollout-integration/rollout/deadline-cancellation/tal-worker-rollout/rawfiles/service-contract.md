# Archive worker

All artifacts are authored synthetic planning facts, not captured runtime or
platform evidence. The source excerpt has unavailable adapters and is read-only.

The supervisor grants 75 seconds from termination start, including a 15-second
preStop hook. SIGTERM therefore reaches the application with 60 seconds remaining.
One original deadline governs handler completion, checkpoint/release operations,
ledger recording and process exit. The platform does not restart this allowance
for each operation. The local monotonic clock is used for elapsed budget; the
queue server owns durable lease expiry. The timeline also contains a local wall
adjustment. No assertion about a real runtime clock has been tested here.

The native compression call lasts 70–140 seconds and observes cooperative stop
only after returning. Its stable temporary object ID is recorded before entry.
It can finish after the application signals cancellation. Published objects have
durable operation IDs; they may remain visible while cleanup is pending.

Each logical export has a stable `(tenant_id, export_id)` key, ownership epoch,
durable cursor, final-result receipt and product state. Progress/publish/finish
operations must atomically validate the current epoch at the protected store.
Release compares the same epoch, so a late old release cannot clear a new owner.
The application cannot use local cancellation or a pre-operation lease read as
proof that an in-flight protected operation stopped.

`checkpoint(key, epoch, operation_id, cursor)` and `release(key, epoch)` are
independent RPCs. A timeout may mean committed, pending or absent. `inspect(key,
operation_id)` is the authoritative reconciliation read when connectivity returns.
`ack(delivery)` removes a delivery; completion ACK requires the final receipt.
The product must not represent an unfinished or uncertain export as completed.

Deployment replacement preserves resumption eligibility. A user's cancellation
request records durable intent in the separately reachable operations ledger;
the successor checks that intent before resuming or publishing. Requested
cancellation is not terminal cancelled while an old producer can still publish.
Terminal cancellation needs stopped/fenced production and a recorded cleanup
outcome or accountable pending cleanup. Already published artifacts need an
explicit cleanup disposition rather than an assumed rollback.

The operations ledger remains reachable from the retiring process while its queue
coordinator connection is unavailable. It accepts stable job/operation IDs,
last confirmed cursor, attempted cursor, object IDs, product intent, unresolved
outcome and a reconciliation/cleanup assignment. Another host can reach the
coordinator and claim after lease expiry. A process exit has no implicit successor
or cleanup assignment. This assignment authorizes no live shutdown, provider
change or object deletion.
