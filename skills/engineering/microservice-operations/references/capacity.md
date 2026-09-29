# Capacity, caches, and scaling

Use this reference when the task concerns overload, scaling, partitioning, or caching across services.

Find the measured bottleneck before choosing a scaling mechanism. Describe the workload, request mix, data volume, latency percentiles, error rate, throughput, and constrained resource. Include downstream limits: more application replicas can increase database contention or exhaust a provider quota. Distinguish capacity growth from redundancy; many replicas sharing one failure domain can still fail together.

Compare the smallest viable options. More resources may relieve a local CPU, memory, or I/O constraint. Replicas require effective work distribution and appropriate state handling. Data partitioning needs a key, distribution evidence, hot-key behavior, rebalancing, and a plan for cross-partition queries or transactions. Functional decomposition earns its cost when a separable workload needs independent scaling; traffic alone does not require creating more services.

For autoscaling, relate the scaling signal to useful capacity, then account for detection delay, instance startup, warmup, maximum capacity, and safe scale-in. With queues, include backlog age and processing time rather than treating queue length alone as sufficient. State the behavior while capacity catches up or cannot increase.

For caches, name the authoritative data source, allowed staleness for the operation, cache location, and invalidation mechanism. Follow the entire path when multiple caches can compound staleness. Check cold starts, origin failure, a mass miss, and recovery; the origin must survive cache loss or admission must be bounded. For buffered writes, identify what is durable before acknowledging success and how pending data is recovered.

Verify against a representative workload and baseline in an authorized environment. Record which production conditions the test reproduces and which it omits. Completion means the measured constraint improved without violating correctness, freshness, cost, or downstream limits; an untested replica count is a capacity proposal, not demonstrated capacity.
