# Bounded failure and recovery

Use this reference when changing behavior around an unreliable dependency or shared resource.

Start with the caller's useful lifetime. Allocate the end-to-end deadline across queue or pool acquisition, connection establishment, response waiting, and any retries. Propagate remaining budget where supported. Check what cancellation actually stops: abandoning a response may leave server work or a committed write behind. A timeout after dispatch can leave the result unknown. A first attempt proven to time out before dispatch has no effect; a later attempt's pool timeout cannot erase an earlier attempt's uncertain outcome.

Retry only failures for which another attempt can be useful and the operation can safely repeat or reconcile. Identify every retrying layer, including SDKs, proxies, brokers, and callers. Bound attempts and cumulative elapsed time; use delay and jitter appropriate to the workload to avoid synchronized load. Stop when the deadline or retry budget is exhausted. Preserve a logical operation identity for duplicate-sensitive effects and define how an uncertain outcome is resolved.

Use bulkheads to prevent one dependency from occupying resources needed by unrelated work. Choose limits against actual worker, connection, and queue capacity. Define rejection or backpressure behavior. A queue buffers work but does not create unlimited capacity: account for maximum age, backlog growth, expiry, redelivery, and recovery throughput.

When a circuit breaker serves the failure model, define the failures it counts, opening threshold, fail-fast outcome, recovery probes, and close condition. Distinguish it from a timeout or concurrency limit. Assess whether a degraded response is safe; stale display data and stale authorization decisions carry different consequences.

Verify a slow dependency, complete failure, and recovery using controlled fault injection in scope. Observe completion time, resource release, retry volume, unaffected work, and user-visible outcomes. For asynchronous work, also inspect durable state and backlog recovery. Completion means failure stays within the claimed boundary and normal service resumes without an uncontrolled surge or silently lost work.
