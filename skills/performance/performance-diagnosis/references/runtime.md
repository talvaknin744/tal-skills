# Attribute runtime and host constraints

Use the deployed runtime and effective resource hierarchy to select measurements.
Align request traces, profiles and counters over the affected interval. A profile
of idle background threads or another traffic class can conceal the actual path.

For CPU, inspect per-core and burst behavior, runnable delay and container
bandwidth. A node average can hide a process cap or a saturated single thread.
On Linux, inspect supported cgroup counters and ancestor limits; compare counter
deltas with the request interval. Kubernetes requests describe scheduling demand;
CPU limits can throttle execution. Record memory pressure, allocation failures,
OOM events and non-runtime memory alongside application heap.

CPU samples attribute executing work. Use blocked/waiting and scheduler evidence
when latency grows without corresponding CPU demand. Separate lock wait, I/O,
pool wait and runnable delay where possible. Sampling and tracing overhead need
an explicit bound; an instrumented measurement can alter the bottleneck.

Choose the runtime branch that changes the diagnosis:

- **Go:** CPU, heap, allocation, block and mutex profiles answer different
  questions. Relate GC work to allocation rate and live heap. A soft runtime
  memory limit leaves other process/container memory to budget; aggressive
  collection can reduce useful progress.
- **Node:** correlate event-loop delay/utilization with synchronous work,
  serialization and worker-pool or dependency waits. Verify the deployed API,
  units and sampling settings before comparing delay histograms.
- **Python:** use profiling for attribution and independent timing for the
  performance comparison. Check the actual interpreter/build, blocking calls and
  concurrency model before assuming threads or more async tasks add CPU capacity.

For pools and locks, measure time held as well as time waiting. Moving unrelated
network work outside connection ownership may release capacity, but required
invariants must retain an enforcing boundary. Observe actual completion after
cancellation: released caller state alone cannot establish resource cleanup.

**Verify:** reproduce the relevant workload and vary the hypothesized constraint
alone when feasible. Confirm its mechanism signal and user outcome move together;
record alternate explanations and unmeasured resources.
