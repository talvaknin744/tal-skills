## Assessment

The rollout does **not** establish the stated two second useful lifetime, capped by an earlier parent cancellation or deadline. The gateway creates a local deadline, then makes decisions from its JSON decoded copy and gives each attempt a fresh two second context rooted at `context.Background()` ([gateway.go](../final-project/gateway.go)). That loses both the original monotonic budget and the parent’s cancellation.

The supplied snapshots make the difference concrete ([clock-samples.jsonl](../final-project/clock-samples.jsonl)):

| Point | Original gateway budget | Decoded epoch allowance | Context created |
|---|---:|---:|---|
| JSON round trip, gateway monotonic 100.2 | 1.8 s | 1.8 s | — |
| Before attempt 1, after a six second backward wall adjustment | 1.4 s | 7.4 s | Fresh 2 s |
| Attempt 1 timeout and start of attempt 2 | Expired by 0.6 s | 5.4 s | Another fresh 2 s |
| Worker receipt, worker wall time 998.0 | Unknown across hosts | 4.0 s | Up to 4 s, subject to its parent |

The first timeout snapshot is already 2.6 seconds after receipt. If attempt 2 then uses its full timeout, the gateway could reach 4.6 seconds; the snapshot does **not** show that second attempt completing. Nor is 4.6 seconds a hard upper bound if `Client.Quote` fails to return on cancellation. The worker’s four second calculation cannot be reconciled with the gateway’s original allowance: host clock skew and handoff delay have no bounds in [contract.json](../final-project/contract.json), and the hosts’ monotonic readings are incomparable.

## Supported failure paths

- An earlier parent cancellation is ignored by gateway attempts. The worker caps its timer by its *own* parent, but the files do not establish that this parent carries the gateway cancellation ([worker.go](../final-project/worker.go)).
- A backward wall adjustment after JSON conversion permits late attempts; a forward adjustment can reject useful work early. The worker converts the received epoch to a duration **once** on receipt. A later wall adjustment does not establish that its already created timer changes.
- The gateway retries every error, including potentially permanent errors, without checking whether the original budget remains. It can also return success from an attempt that finishes after the useful lifetime.
- Cancellation is a signal, not proof that `Lookup` has finished. The contract says it retains a connection until return and the adapter supplies no completion report. `worker_completion_seen:false` shows missing confirmation, **not** proof that the worker is still running. An expired message still reaches `Lookup`, even if its context is already canceled.

The operation is specified as read only, so these files do not support a committed write or data loss claim. Repeated or lingering lookups can still consume connections and duplicate load.

## Bounded correction

1. Start one operation context at request receipt, with deadline `min(receipt + 2s, parent deadline)`. Retain that original local monotonic deadline for gateway decisions. Include acquisition, attempts, retries, and any caller wait for cleanup inside it. Pass the parent through; cap each attempt by the *remaining* operation budget. Return on operation cancellation even if the adapter has yet to finish, while keeping that unfinished work accounted for.
2. Make the handoff contract explicit. Send a remaining duration reduced by an **enforced maximum handoff age**; on receipt the worker caps its local timer by that duration and its parent and rejects zero allowance before `Lookup`. A duration alone renews the budget by transit time. If a maximum handoff age and cancellation propagation cannot be established, claim only a bounded gateway response, not a two second worker lifetime. Treat the serialized epoch as diagnostic until a clock skew policy exists.
3. Retry at most once, only for a classified retryable failure while time remains and the prior attempt’s completion or safe termination is known. Give the adapter a completion acknowledgement. The worker retains its connection and permit until `Lookup` returns or disposal is confirmed. The caller waits for acknowledgement only within its remaining deadline; a supervisor owns later cleanup, escalates after a proposed 100 ms grace, and applies a finite unresolved-work limit with backpressure. That grace bounds escalation, **not** termination: a recovery-time bound still needs an adapter stop or disposal guarantee.

## Acceptance observations to collect

These are proposed checks; no fixture was run.

- With backward and forward wall steps both before and after serialization, record the original and reconstructed allowances at conversion and dispatch. In this sample, dispatch must use **1.4 s or less**, and there must be no second attempt at monotonic 102.6.
- With host skew and handoff delay varied independently, observe worker admission and its initial timer. A message older than the enforced handoff limit must be rejected; admitted work must expire within the sender’s remaining budget. Record the bound used, since the supplied worker snapshot alone cannot prove this.
- Cancel or expire the parent early, during connection acquisition, before dispatch, and during `Lookup`. Observe the caller outcome by the earlier deadline, zero dispatch when expiry precedes dispatch, and no retry after an unresolved attempt.
- For cancellation after dispatch, observe actual `Lookup` termination or confirmed disposal, exactly one connection release, the unresolved-work limit and escalation, then a subsequent useful quote completing. A returned permit or healthy pool count alone is insufficient evidence of recovery.

All four project files remain unchanged. I used inspection commands only.
