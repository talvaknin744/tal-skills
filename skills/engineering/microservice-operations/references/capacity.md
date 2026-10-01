# Capacity, caches, and scaling

Use this reference when the task concerns overload, scaling, partitioning, or caching across services.

Find the measured bottleneck before choosing a scaling mechanism. Describe the workload, request mix, data volume, latency percentiles, error rate, throughput, and constrained resource. Include downstream limits: more application replicas can increase database contention or exhaust a provider quota. Distinguish capacity growth from redundancy; many replicas sharing one failure domain can still fail together.

Compare the smallest viable options. More resources may relieve a local CPU, memory, or I/O constraint. Replicas require effective work distribution and appropriate state handling. Data partitioning needs a key, distribution evidence, hot-key behavior, rebalancing, and a plan for cross-partition queries or transactions. Functional decomposition earns its cost when a separable workload needs independent scaling; traffic alone does not require creating more services.

For autoscaling, relate the scaling signal to useful capacity, then account for detection delay, instance startup, warmup, maximum capacity, and safe scale-in. With queues, include backlog age and processing time rather than treating queue length alone as sufficient. State the behavior while capacity catches up or cannot increase.

For an availability claim during a zone or control-plane impairment, measure the
useful capacity of ready survivors under the failed topology. Include
traffic redistribution and downstream placement. Provision capacity for the
declared workload and failure domain before loss; count only instances able to
serve with their required dependencies. If survivor capacity is insufficient,
choose bounded admission or degradation consistent with the objective. Recovery that
needs replacement instances also depends on provisioning, startup, discovery,
and configuration delivery.

Separate ongoing serving from creating or reconfiguring resources. Identify
retained routing and configuration state, its maximum safe age, and required
update paths. Verify that credentials remain valid or can be refreshed through
the claimed impairment interval. An operation requiring current authorization
or revocation state needs its own safe outcome when updates are unavailable;
retaining configuration does not establish that authority. Define rejection or
validated degradation when the safe interval ends, and how updates resume.

In an authorized rehearsal, remove the whole declared domain and deny the
relevant provisioning or configuration calls. Observe useful-operation
completion, latency, survivor saturation, and actual control-plane calls;
exercise state or credential expiry where it limits the claim. Completion
requires the scoped objective and safe fallback to hold through the declared
interval, followed by successful update recovery. Record unexecuted cases as
proposals. [AWS's static-stability article](https://d1.awsstatic.com/builderslibrary/pdfs/static-stability-using-availability-zones.pdf)
and [current guidance](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/static-stability.html)
motivate prepared capacity; the application-specific validity and rehearsal
conditions require project evidence.

For caches, name the authoritative data source, allowed staleness for the operation, cache location, and invalidation mechanism. Follow the entire path when multiple caches can compound staleness. Check cold starts, origin failure, a mass miss, and recovery; the origin must survive cache loss or admission must be bounded. For buffered writes, identify what is durable before acknowledging success and how pending data is recovered.

When designing cache placement, write buffering, read freshness, eviction, or
sharding, read [Cache design](cache-design.md) for conditional choices and their
failure checks, including Redis-specific command boundaries.

For synchronized expiry, hot-key refresh, repeated absent-key lookups, membership
filters, or Redis keyspace maintenance, read [Cache load protection](cache-load-protection.md).

## Resource admission and useful completion

Use when heterogeneous or multi-stage work saturates shared resources. Name each
resource’s cost and lifetime before choosing a limiter: active-work slots,
byte/rate credits, memory reservations and connection limits constrain different
things. A worker finishing can leave dirty buffers or downstream work consuming
capacity. Release or replenish budgets at the actual resource boundary.

Bound queued work, waiting time and admitted work separately. Discard or reject
work that can no longer meet its deadline according to the operation’s contract;
retain a safe completion path for already admitted transactions holding locks or
other resources. Coordinate priority across stages so each stage’s locally favored
work does not strand the rest of the operation. Define fairness, starvation
bounds, tenant isolation and the overload result. A node-local admission policy
alone does not establish those fleet-wide properties.

Verify a mix of cheap and expensive operations, expired queued requests and
resource-holding work under saturation. Measure useful completions, queue age,
tail latency, per-tenant progress and released resources, then recover load.
[CockroachDB’s design account](https://www.cockroachlabs.com/blog/admission-control-in-cockroachdb/)
motivates resource-specific budgets and coordinated progress; its queue discipline
and historical settings are workload-specific. Check the actual platform’s
[current admission scope](https://docs.cockroachlabs.com/docs/stable/admission-control)
before assigning it connection, rejection or fairness guarantees.

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
