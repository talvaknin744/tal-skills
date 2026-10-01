# Application work and connection ownership

Trace generated SQL, actual parameters, loading during result consumption,
serialization and pagination. Count queries for a representative operation to
expose N+1 behavior; a compiled SQL snapshot covers only its own shape. Compare
round trips and bytes as well as execution time. Validate tenant filters,
null/empty cases, ordering and the affected business invariant after a rewrite.

Measure acquisition wait and connection hold time at each application/pooler
boundary. Include transaction scope and unrelated dependency work while a
connection is borrowed. Shorten unnecessary ownership while retaining required
consistency/atomicity; a concurrency optimization must preserve the enforcing
boundary for dependent reads and mutations.

Inventory fleet participants, per-instance pools, pooler modes and database
reservations. Increasing the application pool can move waiting into database
locks, I/O or memory pressure. Compare useful throughput and latency under the
proposed concurrency. A pool limit cannot exceed the shared budget merely because
one application is idle or its standalone query is fast.

If PgBouncer is present, inspect its actual version/mode and client waiting,
server assignment, query and transaction observations. Assignment wait counters
and completed averages do not represent every client still queued. Keep those
boundaries separate from driver acquisition and server execution.

For cancellation, determine which query/transaction actually stops, what effect
remains uncertain, and when the connection becomes reusable. Validate cleanup and
a fresh operation through the same bounded pool. Evidence of a caller timeout
alone establishes neither rollback nor freed database capacity.
