# Partition selection and shard movement

Use this branch when the topology decision includes a durable partition key, distributed table/index partition layout, or relocation of stateful shards. Produce a workload comparison and a transition contract. A shard manager can decide placement; the application still supplies the data-transfer, readiness, and write-authority semantics.

| Dimension | Decision to make |
| --- | --- |
| Trigger | Choose a partition layout or change placement while the service retains state. |
| Problem | Even data placement, query locality, initial parallelism, and inexpensive resizing can conflict. Placement changes also consume serving resources. |
| Mechanism | Compare supported layouts against the query/write mix; separate placement intent from application lifecycle transitions and define readiness before routing changes. |
| Limits | Hash placement can distribute sufficiently varied keys under its hash/mapping assumptions; range placement preserves order, and replication supplies copies only under its actual contract. One hot key, replica lag, and transfer cost need separate treatment. |
| Counterexample | More nodes need not spread an initially single tablet or one hot key; a new routing map does not demonstrate that durable data or exclusive write authority has moved. |
| Verification | Compare normal and skewed workloads at equal resources, then exercise movement while observing query work, accepted writes, readiness, resource cost, and the declared availability contract. |

## Select the layout from the workload

Record representative point reads, bounded ranges, inserts, updates, and cross-partition transactions. Separate bytes per partition, requests per partition, and requests for one key. Include monotonic keys, large tenants, and the largest individual object; a uniform synthetic keyset can hide the limiting case.

Compare the simplest supported choices:

- Modulo placement offers direct routing but can move much of the keyspace when the modulus changes.
- Hash placement usually spreads distinct keys; a range over hashed columns can require additional partitions or a separately maintained index.
- Range placement preserves locality for ranges over its ordering key; monotonic writes or an uneven key range can concentrate load.
- A supported hash-prefix/range-suffix layout can preserve order within a distributed prefix. Check the actual routes for queries that omit that prefix.

Choose table and secondary-index layouts separately when the platform permits it. Account for added write, storage, backfill, and compatibility cost. Verify target-engine capabilities, initial partition count, split thresholds, colocation restrictions, replica/leader placement, and the cost of splitting or rebalancing. Consistent hashing reduces routing reassignment under its assumptions; it supplies neither data transfer nor ownership enforcement.

**Done:** each representative query has a routing/completeness rule, and the selected layout meets query and write-distribution objectives at startup and after growth, or has a named validation gap.

## Define the movement contract

Draw the actual states and their completion evidence: for example, assigned, copying, caught up, ready, serving, draining, and retired. These are candidate states, not a universal protocol. Identify the controller, application callbacks, routing generation, replica membership authority, and resource that accepts writes. Callback success must name what has completed: allocating a host, creating a copy, or establishing an eligible serving replica are different conditions.

Choose whether movement permits a serving gap or overlapping copies. Dropping the old assignment before adding a new one can introduce downtime. An overlap requires a supported replication/catch-up mechanism, compatible routing, and an explicit write-authority transition. The application must validate consensus membership where applicable. For exclusive mutations, use the enforcement procedure in [ownership.md](ownership.md); a delayed session-expiration notification can leave an obsolete process running.

Name the watermark or equivalent barrier that establishes catch-up. Record acknowledged mutations spanning copying/cutover and verify them through the eligible destination under the selected freshness contract, including updates and deletes. Define how writes during copying reach the destination, how versions and deletes survive catch-up, and what a stale router or restarted former owner may do. Retire the old copy only after the transfer and authority rules make remaining old requests safe. Establish what continues serving if placement control becomes unavailable, and bound copying, compaction, and catch-up against the serving resource budget.

**Done:** each transition has an owner, precondition, observable completion, interruption outcome, and valid next action; routing eligibility and write authority are demonstrated separately.

## Verify the decision

Replay the point/range mix, monotonic inserts, skewed tenants, and repeated traffic to one key. At equal replication and resources, record partitions contacted, rows scanned, per-partition bytes/work, useful throughput, and latency. Compare initial and grown layouts; record split/rebalance time and CPU, disk, memory, and network consumption.

During movement, delay or duplicate lifecycle completions, route through an old map, interrupt copying/catch-up, and restart a former owner. Pause an owner across authority loss and resume it after takeover. Observe resource-side accepted/rejected mutations, time without an eligible ready replica, retained versions/deletes, and serving latency under transfer load. Accept only the declared data, exclusivity, completeness, availability, and resource-budget contracts. Report proposed checks as unexecuted until evidence exists; a local state model does not establish production consensus safety.

The publisher accounts and current engine/dependency crosschecks are attributed in [sources.md](sources.md).
