# Admission and resource ownership

Rate budgets constrain arrivals; in-flight limits constrain work holding a
resource. At unchanged request rate, slower dependencies can raise concurrency.
Choose signals for the measured constraint: CPU, memory, queue/pool wait,
connection occupancy or remaining deadline. Derive thresholds and sampling from
the workload and target instead of treating one metric as universal.

Budget the entire protected scope, including parallel leaves and retries that
retain resources. A per-pod request cap multiplies across pods and may admit
several downstream operations per request. State local/fleet/dependency scope,
other consumers, topology changes and bypass traffic. Nested permits need a
consistent acquisition order and cleanup on partial acquisition to avoid deadlock
or stranded capacity. A global cap protects a resource; fairness needs its own
allocation contract.

Admit before expensive work where identity and protocol allow. Include the cost
of authentication, parsing, TLS, logging and rejection itself. Preserve trusted
caller/priority context; a caller-chosen priority cannot enforce allocation.
Recheck remaining useful lifetime after waiting and before dispatch.

Each permit/waiter/task has one lifecycle owner. A caller disconnect can detach
waiting without stopping an issued operation. Hold execution capacity until the
protected operation actually settles/stops, then release exactly once. Track
remaining detached work and its failures. Shared work may retain other waiters;
cancelling one waiter must honor shared ownership. Cancellation leaves mutation
outcomes subject to their existing reconciliation contract.

Define rejection before effects or explicitly account for ambiguous effects.
Preserve actual HTTP/RPC semantics and client behavior: quota limiting, temporary
resource overload and deadline expiry are different reasons. Retry hints need a
finite deadline/attempt budget and jitter or other coordination as appropriate.
Safe degradation must still satisfy the promised result, freshness and authority.

**Verify:** reject before dispatch, cancel before acquisition, cancel queued and
executing work, race cancellation/completion and admit a fresh operation after
cleanup. Inspect actual protected work and permits, not only returned responses.
