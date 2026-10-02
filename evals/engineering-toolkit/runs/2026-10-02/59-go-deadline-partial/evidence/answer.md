## Assessment

The rollout does **not** enforce the quote’s two-second useful lifetime or an earlier parent deadline. The gateway creates a deadline, then uses its JSON-decoded copy for decisions; that round trip loses Go’s local monotonic clock information. Each attempt also gets a fresh two-second context rooted in `context.Background()`, so it ignores `parent` and can run past the original deadline. A second attempt can start before expiry and finish late even with stable clocks. See [gateway.go](../final-project/gateway.go) and the objective in [contract.json](../final-project/contract.json).

The synthetic [clock samples](../final-project/clock-samples.jsonl) illustrate the failure: gateway attempt 1 returns at monotonic 102.6, **2.6 seconds** after receipt, yet the backward wall-clock adjustment leaves the decoded deadline apparently 5.4 seconds away, allowing attempt 2. Worker B computes four seconds from its own wall clock when it receives attempt 1. The samples do not establish cross-host elapsed time or clock skew, and they do not show worker completion.

Supported failure paths are:

- Gateway retries every `client.Quote` error, including cancellation and permanent errors, while its parent may already have expired. The loop limits gateway calls to two; total dispatched work in other layers is unknown.
- The worker derives its timeout from a UTC instant without a clock synchronization or handoff bound. A slow or skewed handoff can give it too much time or expire useful work early. An already expired timeout still reaches `Lookup`. See [worker.go](../final-project/worker.go).
- A returned timeout and `cancel()` do not join worker work. The contract says `Lookup` holds a connection until it returns and the adapter reports no completion to the gateway. Attempt 2 may therefore overlap attempt 1; connection release and recovery time are unproven. This is a read-only quote, so the supported concern is duplicate load and resource occupancy, not a duplicated write.

## Bounded correction

Create one gateway operation context at ingress with `context.WithTimeout(parent, 2*time.Second)`. Keep its original local deadline for all gateway decisions. Charge serialization, acquisition, attempts, retries, and cancellation waiting to that same allowance. Give each attempt only a slice of the **remaining** time; stop on operation cancellation, permanent errors, or insufficient time. Start a retry only after the prior attempt has a completion or safe-disposal acknowledgement.

For the handoff, replace the epoch deadline as the worker’s time authority with a remaining duration calculated immediately before dispatch. Establish and enforce a finite maximum handoff delay **H**; the worker caps its local allowance at `max(0, receivedRemaining−H)` and also honors its parent. A transport that exceeds H must drop the request. The current contract supplies no H, so an end-to-end worker deadline cannot yet be claimed.

Add a completion acknowledgement and retain each connection or capacity permit until `Lookup` has finished or safe disposal is confirmed. Limit caller cancellation/join waiting to a reserved portion of the two seconds; if acknowledgement misses that limit, return by the caller deadline, suppress the retry, and keep the work under capped cleanup ownership. A finite resource recovery bound additionally requires a verified maximum stop or disposal time; the supplied adapter provides none.

## Acceptance observations to collect

With controlled backward and forward wall changes, earlier parent expiry, and delayed handoff, observe a caller response within two seconds of ingress, no dispatch after its local deadline, and a worker allowance no longer than the propagated remaining budget. Test expiry before connection acquisition and cancellation before dispatch: neither should start a lookup. After dispatch, observe cancellation **and actual completion**, exactly one connection release, no overlapping retry, and a subsequent useful quote succeeding after cleanup. Count dispatched attempts separately from logical requests; confirm at most two and no retry for cancellation or permanent errors.

**Completion record:** Current waits are fresh two-second gateway attempt contexts and a worker timeout reconstructed from the wire instant; current cancellation signals do not join work, and neither caller blocking nor cleanup has a proven bound. The proposed caller allowance is one parent-capped two-second context, with finite attempt and join slices inside it. Safe reuse occurs only on worker completion or verified safe disposal. No fixture was executed, no external service was contacted, and all files remain unchanged.
