## Outage assessment

Gateway can make three Checkout attempts, and each Checkout attempt can make three Inventory attempts. That is **9 Inventory calls per client request**: at 200 client requests per second, up to **1,800 Inventory attempts per second**, a **9× amplification** and 1,600 extra calls per second. With each attempt occupying one second, that implies roughly 1,800 client-side Inventory calls in flight at steady state, before queueing. Client retries could raise the total further. ([incident.md](../final-project/incident.md), [load assumptions](../final-project/incident.md))

The main propagation risks are immediate retries against an already slow Inventory service, growth in active requests and queues across all three services, and work continuing after a caller gives up. Nine seconds is possible if all attempts run serially, but the actual response time cannot be calculated: the Gateway-to-Checkout timeout is unspecified, so Checkout attempts may overlap.

## Bounded correction

For this availability-check path, make **one Checkout attempt and one Inventory attempt** on a timeout. Set a **1.8-second deadline from Gateway ingress**, propagate its remaining budget to Checkout, cap Inventory acquisition to 100 ms and its full call to at most one second, and return temporary unavailability before two seconds when the check cannot finish. Limit Inventory-bound concurrency to a value measured against healthy capacity; reject excess work instead of building an open-ended queue.

On expiry or disconnect, signal cancellation downstream. Keep a connection and capacity slot accounted for until work actually completes or an abort is confirmed. A supervisor should alert after five seconds of unfinished cleanup and quarantine the slot; five seconds is an escalation point, **not evidence that reuse is safe**.

| Completion record | Current | Proposed |
|---|---|---|
| Wait | One second per Inventory attempt; no stated overall deadline | 1.8-second request budget, including acquisition and response; one Inventory call of at most one second |
| Cancellation and join | No cancellation after caller abandonment; join and cleanup bounds unspecified | Request-scoped cancellation; caller does not wait past its response budget; supervisor observes completion and escalates after five seconds |
| Safe reuse | No stated completion condition | Actual completion or confirmed abort; otherwise retain capacity accounting |

Validate with sustained **200 requests per second** and one-second Inventory timeouts: no more than **200 Inventory dispatches per second** from those requests, every test response within two seconds, active calls at or below the configured cap, and queue waits at or below 100 ms. Then restore Inventory and verify successful checks resume without a retry surge or stranded work. Record attempts per logical request, end-to-end latency, active work, queue wait, cancellation completion, and temporary-unavailability responses. These are proposed checks; the supplied project contains incident evidence only, so no change or runtime test was performed.
