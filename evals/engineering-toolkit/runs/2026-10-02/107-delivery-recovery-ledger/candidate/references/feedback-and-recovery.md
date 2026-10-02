# Adaptive feedback and recovery

Start adaptive control from a measured fixed-budget baseline. Declare which work
the controller governs, where other callers enter, and which resource remains
shared. A proxy cannot claim control of total concurrency when significant work
bypasses it. The algorithm and configuration belong to the deployed implementation.

Specify admitted sample population, timing boundary, aggregation window, baseline
measurement, response delay, minimum/maximum bounds and damping. Separate local
rejections from accepted execution latency. Completed-only samples can respond
late when work stalls; inspect occupancy, queue age and missing/stale samples.
Workload mix shifts can change latency without congestion. Record limits,
baseline, admitted/rejected counts and mechanism signals together.

For baseline probes, define admission reduction, jitter, low-traffic behavior and
the effect on useful work. Envoy's minRTT probe has specific assumptions and can
produce 503s; its suggested alternate-host retry is conditional. Keep retry
ownership, repeatability, remaining deadline and aggregate attempts bounded.
Retrying another replica that shares the saturated dependency adds work.

Draw signal flow through admission, load balancing and autoscaling. Fast errors
can make a saturated target appear cheap or healthy, redirect traffic toward it
or suppress needed scaling. Include offered/rejected demand where it informs
capacity, and keep ready/warm capacity separate from provisioned count. Maintain
dependency budgets through maximum scale and define behavior when signals fail.

Recovery needs usable current capacity, cold-cache/dependency costs, probes,
backlog drain and gradual restored admission. Define close/reopen conditions and
a reversible fixed-limit or other operational fallback. Test the time to stable
useful service rather than declaring recovery from a controller state change.

**Verify:** step changes in demand and dependency latency, mixed cost, low traffic,
stalled work, synchronized probes, bypass traffic, capacity loss and recovery as
applicable. Compare with the fixed baseline for oscillation, overshoot, starvation,
useful throughput, deadlines, resource bounds and downstream attempts.
