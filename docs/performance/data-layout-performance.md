# Data-layout performance

## What it does

Assesses or optimizes measured Go and Python hot paths where data layout, CPU-cache locality, allocation, or shared-line contention may matter. It chooses a representation from the access pattern and semantics, and may conclude that the existing structure is the right choice.

## When to reach for it

Use [data-layout-performance](../../skills/performance/data-layout-performance/SKILL.md) for evidence-backed AoS/SoA, hot/cold splitting, false sharing, or bounded ring/cache proposals. Ordinary backend changes and dependency waiting keep their existing route; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to establish the bottleneck and [database-performance](../../skills/performance/database-performance/SKILL.md) for database work or waits.

## It's working if

- Profiles or an explicit experiment establish that the path matters to CPU, allocation, retention, contention, or a latency cohort.
- Required numeric, ordering, exactness, full/empty, and ownership semantics have an independent correctness oracle.
- Each proposed transformation names its mechanism, preconditions, cost boundary, and expected observation.
- Representative repeated comparisons include production-paid preparation and operation or service outcomes, alongside kernel timing.
- The result shows preserved behavior and worthwhile measured benefit, or explains why the change is unjustified or still unverified.

## Where it fits

This specialist skill addresses representation and memory behavior after a hot path has evidence behind it. Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to establish criticality, [load-testing](../../skills/performance/load-testing/SKILL.md) to assess service-level effects, and [capacity-planning](../../skills/performance/capacity-planning/SKILL.md) when the outcome affects fleet headroom. The [reading path](../reading-paths.md#cpu-cache-sensitive-go-and-python-paths) points to Go, NumPy, Cython, and Linux primary contracts.

## Sources

- [Linux false sharing](https://docs.kernel.org/kernel-hacking/false-sharing.html),
  main diagnosis/mitigation sections; [cache sysfs ABI](https://www.kernel.org/doc/Documentation/ABI/testing/sysfs-devices-system-cpu)
  and [NUMA policy](https://docs.kernel.org/admin-guide/mm/numa_memory_policy.html),
  locality/placement sections. Host line size and actual writer layout govern.
- [perf stat](https://man7.org/linux/man-pages/man1/perf-stat.1.html) and
  [perf c2c](https://man7.org/linux/man-pages/man1/perf-c2c.1.html), event/scope and
  contention sections; [Intel exploration](https://www.intel.com/content/www/us/en/docs/vtune-profiler/user-guide/2026-0/general-exploration-analysis.html),
  selected attribution guidance, conditional on supported hardware.
- Go [Swiss maps](https://go.dev/blog/swisstable), [memory model](https://go.dev/ref/mem),
  [atomic documentation](https://pkg.go.dev/sync/atomic), [GC guide](https://go.dev/doc/gc-guide)
  and [testing](https://pkg.go.dev/testing): selected representation, synchronization,
  reachability and benchmark contracts. Package docs observed at Go 1.27.1; target
  versions govern. [x/sys padding](https://raw.githubusercontent.com/golang/sys/v0.48.0/cpu/cpu.go)
  is architecture-defined. [benchstat](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat)
  supplies repeated-sample comparison, not a production-benefit guarantee.
- NumPy 2.5 docs: [copies/views](https://numpy.org/doc/stable/user/basics.copies.html),
  [structured arrays](https://numpy.org/doc/stable/user/basics.rec.html),
  [contiguous conversion](https://numpy.org/doc/stable/reference/generated/numpy.ascontiguousarray.html),
  [sum](https://numpy.org/doc/stable/reference/generated/numpy.sum.html) and
  [thread safety](https://numpy.org/doc/stable/reference/thread_safety.html).
- Cython 3.3.0 docs: [memoryviews](https://docs.cython.org/en/stable/src/userguide/memoryviews.html)
  and [directives](https://docs.cython.org/en/latest/src/userguide/source_files_and_compilation.html),
  shape/representation, contiguity, GIL and bounds-check sections.
- Python 3.14.8 docs: [free threading](https://docs.python.org/3/howto/free-threading-python.html)
  and [shared memory](https://docs.python.org/3/library/multiprocessing.shared_memory.html),
  execution and lifecycle sections; [pyperf](https://pyperf.readthedocs.io/en/latest/system.html),
  system/affinity guidance. Source versions are not target-environment claims.
