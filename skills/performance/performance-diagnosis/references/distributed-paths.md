# Distributed latency and work amplification

Measure logical operations separately from leaf attempts. Trace the directed
critical path, queue/pool wait and remaining deadline at each stage. Sequential
stage durations can explain a trace; independently computed stage percentiles
cannot be added to obtain an endpoint percentile.

For required parallel leaves, inspect the slowest required contribution and
aggregation work. Include coordinator saturation, tenant/key skew, correlated
dependencies and remote work continuing after the root stops waiting. Correlate
leaf distributions with the same root cohort. A successful-leaf histogram can
omit precisely the calls causing timeouts.

Batching may save round trips while increasing batch-fill wait, memory and
head-of-line blocking. Record bytes, batch age, concurrency and result semantics.
For transport, distinguish DNS, connection/TLS setup, connection reuse, send,
server execution and receive/serialization; use the actual client's timing
definitions. More application replicas can multiply downstream connections.

Hedging and retries spend capacity to improve selected outcomes. Establish
operation repeatability, total attempts, cancellation behavior and the shared
resource budget before proposing them. Use a measured slow-request cohort;
correlated stalls can make extra attempts worsen the bottleneck. Preserve effect
identity and reconciliation for ambiguous mutations.

**Verify:** compare root useful completions/deadlines with leaf attempt volume,
resource occupancy and cancellation cleanup. Include one delayed required leaf,
skewed demand and the applicable dependency-capacity limit. Local speedups earn
an endpoint claim only when the endpoint evidence supports it.
