# Capacity, caches, and scaling

Use this reference when the task concerns overload, scaling, partitioning, or caching across services.

Find the measured bottleneck before choosing a scaling mechanism. Describe the workload, request mix, data volume, latency percentiles, error rate, throughput, and constrained resource. Include downstream limits: more application replicas can increase database contention or exhaust a provider quota. Distinguish capacity growth from redundancy; many replicas sharing one failure domain can still fail together.

Compare the smallest viable options. More resources may relieve a local CPU, memory, or I/O constraint. Replicas require effective work distribution and appropriate state handling. Data partitioning needs a key, distribution evidence, hot-key behavior, rebalancing, and a plan for cross-partition queries or transactions. Functional decomposition earns its cost when a separable workload needs independent scaling; traffic alone does not require creating more services.

For autoscaling, relate the scaling signal to useful capacity, then account for detection delay, instance startup, warmup, maximum capacity, and safe scale-in. With queues, include backlog age and processing time rather than treating queue length alone as sufficient. State the behavior while capacity catches up or cannot increase.

For caches, name the authoritative data source, allowed staleness for the operation, cache location, and invalidation mechanism. Follow the entire path when multiple caches can compound staleness. Check cold starts, origin failure, a mass miss, and recovery; the origin must survive cache loss or admission must be bounded. For buffered writes, identify what is durable before acknowledging success and how pending data is recovered.

When designing cache placement, write buffering, read freshness, eviction, or
sharding, read [Cache design](cache-design.md) for conditional choices and their
failure checks, including Redis-specific command boundaries.

For synchronized expiry, hot-key refresh, repeated absent-key lookups, membership
filters, or Redis keyspace maintenance, read [Cache load protection](cache-load-protection.md).

## Hot keys and shared reads

Use when request concentration or cache misses overload a shared origin. Measure
per-key request/concurrency skew separately from partition size; an aggregate
capacity figure can hide one saturated owner. Routing affinity can improve local
coalescing, but owner changes can create concurrent origin calls on different
instances.

Separate the routing key from the coalescing key. Share only equivalent reads:
account for tenant, query/filter/page parameters, visibility and freshness, or
enforce the relevant authorization and version requirement per waiter before
delivery. A reader requiring an acknowledged write must not receive an older
in-flight result merely because its entity key matches. Coalescing suppresses
overlapping work; it establishes neither cache freshness nor durable effect
deduplication.

Bound active origin work, waiting callers, and tracked keys. Use per-key and
aggregate limits where the workload needs both; high-cardinality misses can
defeat coalescing. Give the shared operation its own bounded lifetime, define
whether it continues when all waiters leave, and detach one cancelled waiter
without unintentionally cancelling the others. Release permits, waiter state
and key entries on success, error and cancellation.

Verify a hot key alongside unrelated traffic, a distinct-key surge, first/all
waiter cancellation, and routing-owner replacement. Pause a read before a newer
write commits, then attach a strict reader; also test callers with different
visibility. Observe origin calls, bounded waiting, resource cleanup and each
caller's result contract. [Discord's account](https://discord.com/blog/how-discord-stores-trillions-of-messages)
motivates this failure model; the sharing and lifecycle checks are application
requirements to verify, not guarantees supplied by its historical architecture.

Verify against a representative workload and baseline in an authorized environment. Record which production conditions the test reproduces and which it omits. Completion means the measured constraint improved without violating correctness, freshness, cost, or downstream limits; an untested replica count is a capacity proposal, not demonstrated capacity.
