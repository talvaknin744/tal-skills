# Primary grounding and supplied-note limits

Inspected 2026-10-01. The supplied Go/Python performance note motivated the
questions; its speedups and examples were not accepted as benchmark evidence.
These instructions are original application requirements derived from the
following selected contracts, not validated optimization recipes.

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
