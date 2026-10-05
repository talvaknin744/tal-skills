---
name: distributed-system-patterns
description: Choose distributed topologies for measured serving, partitioning, ownership or batch constraints. Use when scale or completion requirements drive the design; exclude broad readiness reviews and isolated retry changes.
license: MIT
---

# Distributed system patterns

Choose a topology from the constraint it must satisfy, then make the interfaces and coordination rules concrete. Here, topology means the placement and communication structure of components. Pattern names describe component relationships; they do not establish reliability by themselves.

## 1. Identify the limiting constraint

Read the relevant request or job path, data placement, deployment shape, and measurements. State what limits the requested outcome: per-instance capability, throughput, dataset size, latency, exclusive ownership, or dependencies between batch stages. Separate measured limits from estimates. Record required completeness, permitted staleness, and recovery expectations where they affect the choice.

Honor task mode: review produces evidence and recommendations, design produces a topology and contracts, and implementation changes only the requested components. Use the existing platform unless a constraint makes it unsuitable.

**Done:** the decision has a concrete constraint, an observable success condition, evidence locations, and assumptions that could change the choice.

Example: A measured 95th-percentile latency bound can reject scatter/gather if fan-out exceeds the request budget.

## 2. Select the applicable pattern branches

Compare the simplest adequate arrangement with the proposed topology and its component placement. Load only references needed for the decision:

- For colocated extension, connection brokering, or interface normalization, read [single-node.md](references/single-node.md).
- For interchangeable replicas, data partitioning, or parallel request execution, read [serving.md](references/serving.md). When choosing a durable partition key or distributed table/index partition layout or moving stateful shards, also read [partitioning-and-movement.md](references/partitioning-and-movement.md).
- For one active owner across independent processes, read [ownership.md](references/ownership.md).
- For independent jobs, branching stages, or aggregate completion, read [batch.md](references/batch.md).

A composition can use several branches, but each added layer needs a separate reason. Broad observability and deployment readiness belong to an operational review; duplicate-safe effects need their own operation-level contract when relevant.

**Done:** each selected pattern addresses a stated constraint, and at least one simpler alternative is accepted or rejected for a concrete reason.

Example: A sharded query with range scans needs partitioning evidence as well as serving-replica evidence.

## 3. Draw the composition and contracts

Show components, placement boundaries, state locations, and directed request or work flow. Mark whether an edge sends to one replica, a selected shard, every required shard, or every downstream consumer. Distinguish instance count from shard count and from concurrent work.

For each changed edge, define input/output identity, routing or partition rule, readiness or completion signal, and failure outcome. Where components share a host, name the local resources that form their interface. Where ownership changes, identify the authority that decides and the resource that enforces it.

**Done:** one representative request or job can be traced end to end, including its result-completeness condition, with no unexplained routing or ownership transition.

Example: Trace one customer request through router, shard, and aggregator, marking which shards are required.

## 4. Challenge the selected topology

Use the relevant branch's failure checks to walk through a slow participant, a lost participant, and the topology change that matters here: helper restart, replica replacement, shard movement, owner takeover, or batch completion. Calculate fan-out, working-set size, or queue drain time when supplied measurements support it. State the assumptions behind any estimate.

Turn each material weakness into a bounded correction or unresolved design choice. Keep availability, data correctness, and latency claims separate.

**Done:** each claimed benefit has a corresponding failure or scale check, with expected evidence and an acceptance condition.

Example: Simulate one unavailable shard and record whether the contract permits partial results.

## 5. Verify and report

In implementation mode, run the relevant local or authorized sandbox checks. Verify version-specific platform behavior using current primary documentation when needed; derive configuration from the target environment. The book's historical commands are not deployment templates.

Report the chosen topology, rejected alternative, contracts, remaining limits, and checks actually executed. For design or review, give concrete validation steps without claiming they ran. Consult [sources.md](references/sources.md) for attribution.

**Done:** the recommendation is reviewable, each success condition is demonstrated or explicitly unverified, and each material gap has a next check.

Example: Report the selected topology and name the unrun load test explicitly.
