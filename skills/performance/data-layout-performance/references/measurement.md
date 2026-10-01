# Criticality and layout measurement

Tie the measured kernel to an objective and cohort. Under a serial model with
unchanged remainder, optimizing fraction f by factor s bounds total speedup at
1 / ((1 - f) + f/s). Identify whether f measures wall time, CPU or another budget;
use the formula only for that scope. A tiny average contribution can still matter
to a separately demonstrated latency tail or memory limit. State the worthwhile
benefit and added complexity/memory cost before choosing a transformation.

Record architecture, effective CPU limits, allowed CPUs, cache sharing, NUMA
placement, runtime/compiler versions and concurrency. Guest topology and host
topology can differ. Match working-set sizes, access/update patterns, warm/cold
state and production-paid preparation. Shared test hosts and placement changes
need explicit uncertainty rather than silent comparison.

Use repeated, preferably interleaved language benchmarks with an observable
result and recorded variation. Go timer/allocation APIs and benchstat can support
comparisons; Python timing tools need equivalent numeric/ownership semantics.
Count the allocations and retained memory relevant to the objective. Report
isolated kernel and end-to-end operation costs separately.

For PMU evidence, inspect supported events, scope, enabled/running time and
multiplexing. Low IPC or generic cache misses alone cannot identify memory stalls.
Analyze competing instruction, branch, memory and scheduling mechanisms at the
hotspot. Contended cache lines require offset/writer ownership analysis before
calling them false sharing. perf/c2c availability varies by architecture and
permissions; an unavailable tool leaves that attribution unverified.

Running perf over go test can count compilation, startup and harness work outside
the benchmark's timed loop. Isolate the measured phase or label the wider scope.
Record instrumentation overhead. Statistical significance and kernel ns/op are
evidence for the tested operation; service usefulness, p99 and capacity need
corresponding workload observations.
