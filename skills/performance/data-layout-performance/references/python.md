# Python and native numeric buffers

Inspect the actual interpreter/build, libraries and workload. Dense numeric
buffers may avoid object traversal, while conversion and packaging can dominate
a short or I/O-bound path. NumPy/native operations, Python execution and external
waits are distinct costs. Verify GIL/free-threading and extension behavior rather
than inferring it from the language name.

Record shape, dtype/range, strides, alignment, read-only policy and aliases.
Structured-array field access can be strided. Basic slicing may share storage;
advanced-index gathers copy. ascontiguousarray may return an alias or allocate
and cast. Contiguity establishes neither zero-copy conversion nor exclusive
ownership. Include index-array, gather, cast and temporary allocation in the
production cost boundary. Dense integer reductions can overflow; changed dtype
or reduction order needs an explicit numeric-equivalence contract.

Before unchecked Cython/native loops, validate non-None compatible buffers,
dimensions, equal required lengths, index ranges and representation. A shorter
column can turn disabled bounds checks into native out-of-bounds access. Prefer
checked boundaries around the kernel; read-only views and nogil do not prevent
concurrent mutation through another alias. Fixed-width interfaces need a compatible
native type rather than an assumed C int width.

For threads and shared memory, specify who writes each region, publishes complete
rows, reads snapshots and authorizes slot reuse. Native operations may release
the GIL; optional free-threaded execution and container locks still need compound
operation synchronization. A shared buffer supplies storage, not an atomic queue.
Assign close/unlink ownership and inspect process/resource-tracker lifecycles.
Budget native/BLAS thread counts to avoid oversubscription.

**Verify:** unequal/empty columns, supported numeric extremes, wrapped/oversized
history, zero denominator, aliases and concurrent access as applicable. Compare
with an independent exact or tolerance-defined reference. Then measure full
preparation plus kernel work and any separate amortized reuse scenario.
