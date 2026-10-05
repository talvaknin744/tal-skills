# Load testing

## What it does

Builds or assesses backend load tests so delivered demand, workload shape, and outcomes can support a bounded performance or capacity claim. It makes generator limits and incomplete work visible rather than treating configured rate as proof of traffic.

## When to reach for it

Use [load-testing](../../skills/performance/load-testing/SKILL.md) for representative workload design, saturation, overload, recovery, generator limits, or misleading throughput and percentile claims. Ordinary unit-test assertions stay on their existing route; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to locate an unexplained bottleneck and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) to model a capacity envelope.

Invocation: automatic

## It's working if

- The experiment states its claim, useful operation, latency boundary, objective, workload classes, baseline, and execution limits.
- Arrival model, dataset, workload phases, retries, and connection behavior are reproducible, with omissions identified.
- Scheduled, started, dropped, failed, interrupted, and unfinished work are reconciled with actual demand and generator ceilings.
- Matched runs report correctness, useful throughput, outcome-specific latency, queue or resource bounds, variability, and recovery where relevant.
- The conclusion gives the observed operating range, evidence paths, limits, and next unresolved check.

## Where it fits

This skill establishes the evidence quality of an experiment. Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to identify what to measure, [overload-control](../../skills/performance/overload-control/SKILL.md) to compare containment policies, and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) to apply measured results to growth or failure scenarios. The [reading path](../reading-paths.md#workload-and-benchmark-evidence) points to k6 arrival and metric contracts and Prometheus distribution guidance.

## Sources

- k6 latest documentation, identified v2.3.x: [open/closed models](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/open-vs-closed/),
  [dropped iterations](https://grafana.com/docs/k6/latest/using-k6/scenarios/concepts/dropped-iterations/)
  and [metric definitions](https://grafana.com/docs/k6/latest/using-k6/metrics/reference/).
  These establish executor/metric boundaries; another tool needs its own contract.
- [Prometheus histograms](https://prometheus.io/docs/practices/histograms/):
  bucketing, aggregation and quantile error; client compatibility was not tested.
- [Gregg active benchmarking](https://www.brendangregg.com/activebenchmarking.html):
  inspect both generator and target during an experiment.
- [SRE cascading failures](https://sre.google/sre-book/addressing-cascading-failures/):
  capacity, warmup, resource limits and failure tests, selected sections of the
  2016 book. Actual test safety and outcome oracles remain project-specific.
