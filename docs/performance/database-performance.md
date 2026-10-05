# Database performance

## What it does

Connects application impact to database work and waiting, then validates the smallest justified query, index, transaction-lifetime, pool, or maintenance intervention on the actual engine. It separates client and pool time from network, server execution, locks, and result consumption.

## When to reach for it

Use [database-performance](../../skills/performance/database-performance/SKILL.md) for expensive queries, plan regressions, contention, pool pressure, or database saturation. Duplicate-effect or isolation correctness alone belongs on its existing route; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) when the bottleneck is not yet known and [python-backend](../../skills/languages/python-backend/SKILL.md) for broader session and query ownership questions.

## It's working if

- The affected workload, baseline interval, timing boundary, invariant, and evidence gaps are explicit.
- The leading mechanism is supported by aligned application-path, wait, and workload evidence, with a measurement that could reject it.
- The candidate addresses that mechanism and includes correctness, resource, deployment, and recovery checks.
- A representative matched comparison reports client latency, useful throughput, query count, waits, plan or execution evidence, and changed resource costs.
- The result records executed checks, tradeoffs, untested conditions, and the scope of isolated or toy results.

## Where it fits

This skill handles database-specific diagnosis and intervention. Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to find the affected system constraint, [load-testing](../../skills/performance/load-testing/SKILL.md) for representative comparison, and [python-backend](../../skills/languages/python-backend/SKILL.md) when ORM session lifetime or query ownership is central. The [reading path](../reading-paths.md#database-workload-performance) points to PostgreSQL plans, waits, maintenance, and conditional pooler contracts.
