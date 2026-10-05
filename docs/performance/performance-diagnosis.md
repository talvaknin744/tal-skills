# Performance diagnosis

## What it does

Finds the constraint on useful backend work and checks whether a scoped intervention changes it. It connects latency or throughput symptoms to execution, waiting, workload, and resource limits, while keeping sustainable fleet capacity claims within evidence.

## When to reach for it

Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) for unexplained backend slowness, throughput plateaus, resource saturation, profiling, pool waits, container throttling, or distributed critical paths. Formatting-only requests use the normal formatting workflow. Capacity forecasts and workload construction have separate workflows; use [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) or [load-testing](../../skills/performance/load-testing/SKILL.md) when those are the task.

Invocation: automatic

## It's working if

- The symptom, baseline window, workload, target, and missing evidence are explicit.
- The delay is localized as far as evidence allows, with a concrete observation that could disprove the leading cause.
- The smallest proposed change has a causal rationale, expected signal, tradeoff, and stop condition.
- A matched comparison reports useful throughput, outcome-specific latency, resource waits, downstream work, and correctness.
- The conclusion distinguishes a supported cause and observed effect from recommendations and untested conditions.

## Where it fits

This skill is the diagnostic entry point for backend performance questions. Use [load-testing](../../skills/performance/load-testing/SKILL.md) to build or assess the workload, [database-performance](../../skills/performance/database-performance/SKILL.md) when database work or waiting is implicated, and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) when the decision concerns headroom or growth. The [reading path](../reading-paths.md#backend-bottleneck-diagnosis) identifies USE/off-CPU methods and runtime contracts.

## Sources

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
