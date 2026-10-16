# Primary grounding

Inspected 2026-10-01. These original instructions derive diagnostic checks from
the sources below; no local profiling or complete book reading is claimed.

- Gregg: [USE method](https://www.brendangregg.com/usemethod.html), main method,
  software resources and cloud constraints; [off-CPU analysis](https://www.brendangregg.com/offcpuanalysis.html),
  overhead and attribution caveats; [active benchmarking](https://www.brendangregg.com/activebenchmarking.html),
  method and client/target checklist. Author material, not a universal diagnosis.
- [Kubernetes resources](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
  and [Linux cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html): CPU,
  memory and effective enforcement. Verify the deployed kernel/runtime.
- [Go diagnostics](https://go.dev/doc/diagnostics) and [GC guide](https://go.dev/doc/gc-guide):
  profiling/tracing, allocation and soft memory-limit branches.
- [Node event-loop measurement](https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions)
  and [Python profiling](https://docs.python.org/3.14/library/profile.html): API
  units/settings and profiling versus benchmark timing; use installed versions.
- [SRE monitoring](https://sre.google/sre-book/monitoring-distributed-systems/):
  user impact and separate error latency. Distributed-path verification is an
  application requirement, not a guarantee from a topology or profiling tool.

Trace evidence additions inspected 2026-10-14:

- [OpenTelemetry sampling](https://opentelemetry.io/docs/concepts/sampling/),
  Head Sampling and Tail Sampling: decision timing, outcome selection and
  collector capacity. Missing evidence and population percentile checks are
  derived diagnostic requirements, not a claim that every sampler loses spans.
- [OpenTelemetry tail sampling processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md),
  Monitoring and Tuning and Late Arriving Spans: finite buffering and decision
  retention. This mutable implementation reference requires deployed version
  verification. No collector runtime or current defaults were tested.
- Uber: [CRISP critical path analysis](https://www.uber.com/us/en/blog/crisp-critical-path-analysis-for-microservice-architectures/),
  2021-11-18, computational DAGs, inclusive/exclusive time and clock skew:
  required dependencies, path shifts and uncertain wall clock ordering. Its
  historical trace correction heuristics are not portable causal guarantees.
- [Grafana tail sampling](https://grafana.com/docs/opentelemetry/collector/sampling/tail/),
  metrics before sampling: population measurements and selected trace cohorts.
  Apply the target telemetry pipeline's actual collection boundary.
