# Layout and bounded-structure contracts

Compare bytes and fields touched by the actual hot operation. AoS keeps records
together; SoA separates columns and may suit scans touching a few fields.
Full-record access, random point lookup, tiny working sets or dominant conversion
cost can favor the existing form. Hot/cold splitting trades a smaller common
working set for cold-path indirection and consistency/ownership work. Measure the
ingestion/update path as well as the scan.

Record representation precision, ranges, alignment/stride, column lengths and
ownership. Preserve row identity and coherent updates across columns. Establish
floating-point tolerance/reduction semantics, empty input, zero denominators and
exceptional values as applicable. A datatype cast or parallel reduction may
change a result even when the new buffer is faster to traverse.

A work queue, overwriting history and evicting cache have different obligations.
For a ring, define capacity units, valid constructor range, ordering, full/empty
behavior, admission/backpressure, overwrite accounting and reader/writer topology.
Bounded storage establishes neither bounded operation time nor accepted-work
durability. For a cache, specify key verification, collision disposition,
freshness/exactness and authoritative fallback; hash indexing alone is no exact map.

For retained-history queries, derive the available window from observations seen
and capacity. Define whether a request beyond it is rejected or explicitly
clamped. Wrapping an index cannot recover overwritten history. Test requests
smaller than, equal to and greater than capacity, including a nonmultiple window;
repeating every retained value equally can accidentally preserve an average
while counting the wrong observations. Bound per-query work and temporary memory.

Publication and reuse need a happens-before/ownership argument for the entire
row, not just an atomic index. State SPSC/MPSC/MPMC requirements and use the
simplest structure satisfying them. A zero-allocation or lock-free claim needs
its own evidence; padding and atomics do not establish progress guarantees.
