# Go layout and ownership

Record toolchain, architecture, runtime concurrency, limits and workload before
comparing containers. Modern Go maps have a Swiss Table implementation introduced
in 1.24; internal group/growth constants are implementation details, not public
latency guarantees. Compare the actual map against the proposed indexed storage
using key distribution, reads/updates/misses, growth and concurrent ownership.
Select sync.Map only when its documented workload fits.

For slices or SoA, validate lengths and numeric behavior at the trusted boundary.
Preallocation can reduce growth but can also retain excessive capacity. Measure
allocated bytes, live reachable heap and GC costs separately. When popping a
pointer-bearing ring element, clear it before publishing its slot as reusable if
release is part of the contract; a consumed slot can otherwise retain objects
until overwritten. Preserve the returned value and publication ordering.

Go atomics are sequentially consistent, while ordinary payload accesses still
require a happens-before argument. For SPSC, prove payload write before head
publication and payload read/clear before tail publication enables producer reuse.
Check wrap/capacity/index invariants. Supporting additional writers/readers is a
different concurrency contract, not a change certified by the existing atomics.

False sharing requires a shared cache line and relevant writers. Inspect field
offsets, allocation/array stride and access ownership against target topology.
Distinguish independently owned fields from true sharing of one value. x/sys
CacheLinePad uses architecture-defined constants rather than runtime host
detection. Padding increases space/cache/TLB costs and cannot remove required
communication; require attribution and before/after whole-workload evidence.

Keep compiler/runtime-specific transformations conditional. A modulo-to-mask
rewrite requires valid power-of-two and index/sign semantics, plus evidence that
the existing generated code is a material cost. Unsafe/native prefetch work needs
a demonstrated constraint and explicit portability/ownership costs.
