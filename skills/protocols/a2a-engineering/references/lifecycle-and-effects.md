# Lifecycle, effects, and ownership

Use this when work can outlive a request, receive duplicate delivery, or move
between workers. Define each guarantee at the boundary that enforces it.

| Trigger and failure | Mechanism and conditions | Counterexample and verification |
| --- | --- | --- |
| Duplicate initial message executes an effect twice | Application operation key bound to verified scope and request meaning; retain outcome through the replay horizon | Message-ID deduplication is optional. Re-send the same message and race equal keys; a memory-only sequential map does not prove crash or concurrent safety. |
| Caller loses the stream and dispatches new work | Preserve task identity; retrieve authoritative state and artifacts, or subscribe while nonterminal | Reconnection is not automatic replay. Disconnect one observer while another remains; assert work and the second observer continue. |
| Cancellation races effect commit | Define the commit boundary; cancel before it, reconcile the receipt after it, and expose unknown outcomes | A canceled task is not a rollback. Gate each side of commit; assert the effect count, receipt, final task state, and cleanup. |
| A late worker acts after another node cancels the task | Ownership epoch or provider-supported fencing at the resource; stop and await local work before transfer where sufficient | Checking task state before an external call cannot fence a pause after the check. Release the old worker after cancellation and observe the protected resource. |
| Persisted Task survives but progress does not | Separate task store, execution checkpoint, ownership, and event routing contracts | Saving status does not preserve an in-memory stack. Restart the executor process at each declared recovery boundary and reconcile effect state. |
| Terminal work is silently restarted | Reject continuation with a terminal task ID; use a deliberately new initial message for new work | `INPUT_REQUIRED` may accept continuation. Test the interrupted and terminal paths independently. |

The operation key's retention and payload fingerprint belong to the business
contract. One request may create multiple tasks while sharing a single operation;
a task may contain multiple distinct effects. Pick identities accordingly.
[Idempotency contract](https://a2a-protocol.org/v1.0.1/specification/#331-idempotency)

Cancellation is idempotent in effect; repeated responses can differ. In the local
Python probes, a parked interrupted task returned canceled again while an active
worker path returned `TASK_NOT_CANCELABLE` after cancellation. Reconcile with
`GetTask`; do not require a universal repeat-response shape or treat rejection as
proof that the effect failed.
[CancelTask](https://a2a-protocol.org/v1.0.1/specification/#315-cancel-task)

A local Go fixture shared one task store between two handlers. One acknowledged
cancellation while the other's executor remained live; releasing the old worker
allowed an intentionally unfenced counter effect. The stored task stayed
canceled. This illustrates an application ownership gap, not an SDK promise to
undo external work. It was one process and a simulated effect.

Keep deterministic cancellation-first and completion-first cases even when
running a race stress loop. Thirty simultaneously released research races all
completed first; that count alone did not cover the other ordering. Use bounded
barriers, inspect the final task and effect independently, and collect cleanup
observations. Performance or long-duration claims need separate workload tests.

Streaming observers and executing workers have different lifetimes. The Python
V2 registry and Go default stores are local; adding task persistence alone leaves
cross-replica routing and executor recovery unresolved. For deployment, identify
successor eligibility, checkpoint compatibility, and how an old owner loses the
right to act before declaring the handoff complete.
[Python handler](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/request_handlers/default_request_handler_v2.py),
[Go handler](https://github.com/a2aproject/a2a-go/blob/v2.6.0/a2asrv/handler.go)
