---
name: database-performance
description: Diagnose database workload latency or throughput and validate query, index, transaction-lifetime, pool, or maintenance improvements. Use for expensive queries, plan regressions, contention, and database saturation; duplicate-effect or isolation correctness alone has its existing route.
license: MIT
---

# Database performance

Connect application impact to the database work and waiting that cause it, then
validate the smallest justified intervention on the actual engine.

## 1. Establish the workload and timing boundary

Read the affected path, emitted queries and binds, engine/driver/pool versions,
data distribution, objective and incident evidence. Identify latency-sensitive
classes and aggregate resource cost. Separate application/pool acquisition,
network, server execution, lock waits and result consumption. Honor review scope;
use the authorized target for requested execution.

**Done:** the affected workload, baseline interval, timing boundary, invariant
and evidence gaps are explicit.

## 2. Locate the constraint

Read [application and pool boundaries](references/application-and-pools.md) when
ORM loading, resource ownership or connection queues matter. For PostgreSQL plans,
waits, statistics, memory or maintenance, read
[PostgreSQL diagnosis](references/postgresql.md). On another engine, verify its
corresponding primary contracts and obtain equivalent observations.

**Done:** the leading mechanism is supported by aligned path/wait/workload
evidence, with a measurement that could reject it. A fast isolated plan remains
separate from end-to-end performance.

## 3. Choose and budget the intervention

Compare query/work removal, access-path/statistics changes, shorter resource
ownership, bounded concurrency, maintenance or more capacity. Preserve tenant
filters, ordering, transaction invariants and cancellation outcomes. Budget the
read/write, memory, storage and rollout consequences. Plan analysis that executes
a statement inherits its effects; choose an appropriate disposable/read-only
target for the actual command rather than assuming rollback reverses everything.

**Done:** the candidate addresses the measured mechanism and has explicit
correctness, resource, deployment and recovery checks.

## 4. Validate representative outcomes

Compare matched workload, parameters, data/skew and resource limits. Observe
client latency, useful throughput, query count, waits, execution/plan evidence
and changed resource costs. Include contention or writes when the proposal
affects them. For review/design, provide proposed checks with acceptance criteria.

**Done:** report the supported cause, changed behavior or recommendation,
executed checks, tradeoffs and untested conditions. Keep toy/warm isolated results
within their observed scope. [Sources](references/sources.md) records provenance.
