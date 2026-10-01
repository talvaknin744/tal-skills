# Resource demand, queues and cost

For workload class i, measure arrival rate λi and resource demand Di per useful
operation. CPU demand Σ λiDi has units CPU-seconds/second when λ is operations/s
and D is CPU-seconds/operation. Use similar dimensional accounting for bytes,
I/O and dependency work; memory also depends on residency and retained state.
Include failed/retried attempts and background work in actual resource demand.
Class changes and key skew can invalidate a single QPS capacity figure.

At a stable boundary, Little's Law relates mean population L, admitted arrival
rate λ and mean residence time W: L = λW. Queue-only W measures waiting; a whole
stage includes service. Keep scope, units and populations consistent. Growing
backlogs and finite windows need explicit arrival/departure and outstanding-work
accounting. This mean relation supplies neither p99 nor an optimal concurrency
limit. Validate concurrency against observed throughput/latency and downstream
budgets.

For constant arrival λ and completion μ with μ > λ, backlog B drains in
B / (μ - λ), using the net drain rate while arrivals continue. Add bootstrap time
and its backlog growth, and include changing rates piecewise. When μ ≤ λ, the
model has no finite sustained drain time. Account for job costs, bytes and age as
well as count. Accepted-work contracts determine whether expiry/rejection can
change λ or disposition; silent loss cannot satisfy a recovery objective.

Fleet budgets sum actual participants: local limit × active instances × work
fan-out, adjusted for measured overlap and other resource consumers. Resource
capacity and latency-compliant useful capacity are different quantities. Uniform
scaling depends on work distribution, state, dependency ceilings and coordination
costs. Test the bottleneck rather than extrapolating indefinitely.

Compare cost per correct, on-time operation over a specified window. State which
fixed/idle, storage, network, maintenance and failure-reserve costs are included.
Low utilization can purchase a required failure margin; demonstrate the promised
scenario before calling that reserve waste.
