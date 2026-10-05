---
name: data-layout-performance
description: Optimize measured Go/Python hot paths affected by layout, locality, allocation, or false sharing. Use for AoS/SoA, hot/cold splits, or bounded rings; ordinary backend changes and dependency waits use existing routes.
license: MIT
---

# Data-layout performance

Choose a representation from its measured access pattern and required semantics.
A worthwhile outcome may be retaining the existing structure when the expected
service benefit does not justify its cost.
Layout choice follows workload semantics and measured cost.

## 1. Establish criticality

Read the affected operation, profiles/benchmarks, objective, deployed runtime and
limits. Record the path's contribution to CPU, allocation/retention, contention
or the affected latency cohort. Identify working-set size, fields touched,
scan/lookup pattern, update frequency and read/write ownership. Include ingestion,
conversion and synchronization paid by production.

**Done:** a material contribution or explicit experimental question justifies the
layout investigation; otherwise explain the stronger constraint and stop at that
bounded assessment. A mean profile alone cannot rule out a rare tail-critical path.
Example: compare allocation profiles with the affected request cohort before changing a shared buffer.

## 2. Specify semantics before layout

Read [layout and bounded structures](references/layout-and-bounds.md) for AoS/SoA,
hot/cold splitting, rings, eviction and retained history. Define numeric types,
column lengths, ordering, full/empty behavior, exactness and publication/reuse
ownership. Honor read-only review; implement only the requested scoped change.

**Done:** an independent correctness oracle and required invariants distinguish
a faster equivalent implementation from changed or lost work.
Example: specify ring overwrite behavior and compare every retained value with a simple reference queue.

## 3. Select the justified branch

- For Go maps, atomics, pointer retention and padding, read
  [Go layout](references/go.md).
- For Python objects, NumPy/Cython buffers or shared memory, read
  [Python buffers](references/python.md).
- For hardware attribution and comparison, read
  [measurement](references/measurement.md).

Compare the smallest alternatives against locality, allocation, sharing,
conversion, extra memory and maintenance. Syntax-based lint suggestions require
hot-path/ownership evidence before becoming a refactor.

**Done:** each chosen transformation has a mechanism, correctness preconditions,
cost boundary and expected observation; universal speedups remain unsupported.
Example: split cold fields only if the hot scan avoids their cache lines without raising conversion cost past the measured gain.

## 4. Validate correctness and useful benefit

Check the implicated shapes/ranges, retained-history boundaries, collisions,
numeric equivalence and concurrency/cleanup before performance comparison. Use
matched representative sizes and access/concurrency patterns with repeated runs.
Include production-paid preparation and assess the operation/service outcome as
well as kernel timing. Report tool/hardware limitations and variability.

**Done:** the change preserves its contract and provides a worthwhile measured
improvement, or the recommendation states why it is unjustified or what remains
unverified. Microbenchmark improvement alone supplies no endpoint p99/capacity
guarantee. [Sources](references/sources.md) records primary reading scope.
Example: compare repeated runs at the production-sized working set and include buffer construction in the timed service path.
