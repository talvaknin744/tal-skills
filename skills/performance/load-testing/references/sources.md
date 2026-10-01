# Primary grounding

Inspected 2026-10-01. The workflow derives application checks from these sections;
fixture numbers are authored inputs, not executed benchmarks.

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
