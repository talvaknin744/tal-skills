# Distributed latency and work amplification

Measure logical operations separately from leaf attempts. Trace the directed
critical path, queue/pool wait and remaining deadline at each stage. Sequential
stage durations can explain a trace; independently computed stage percentiles
cannot be added to obtain an endpoint percentile.

## Trace evidence and the causal path

For a trace based diagnosis, establish the root operation, outcome and workload
cohort, then check context propagation, instrumentation and collection coverage.
A missing span leaves work unresolved until code, client timings or other evidence
shows whether it happened. Inspect upstream sampling, exporter drops and collector
loss before interpreting the trace as complete. A downstream sampling rule cannot
recover spans an upstream stage never recorded or exported. For an OpenTelemetry
tail sampler, verify the installed processor's buffering, decision cache and late
span behavior, including eviction observations.

Reconstruct required dependencies and joins from correlated request evidence.
Separate parent inclusive duration from its own work, and required parallel work
from detached work that does not gate the response. Use local durations and
caller send/return observations to resolve ordering. Cross host wall clocks can
make serial calls appear to overlap or children appear outside their parents.
State clock uncertainty instead of turning a display correction into proof of
causality. A candidate speeds the endpoint only while it shortens the limiting
path. Recompute the path after the change because another branch may become
limiting.

Record the selection policy and observation window. Latency or error selected
traces describe the retained cohort, so its p99 is not automatically the endpoint
population p99. Use endpoint metrics recorded before trace sampling, or a
documented statistically valid estimator, for population claims. Compare slow,
timeout and successful request cohorts with the same timing boundary. A complete
single trace explains that request, with its workload limits still explicit.

## Distributed interventions

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
