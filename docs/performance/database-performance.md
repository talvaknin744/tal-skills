# Database performance

## What it does

Connects application impact to database work and waiting, then validates the smallest justified query, index, transaction-lifetime, pool, or maintenance intervention on the actual engine. It separates client and pool time from network, server execution, locks, and result consumption.

## When to reach for it

Use [database-performance](../../skills/performance/database-performance/SKILL.md) for expensive queries, plan regressions, contention, pool pressure, or database saturation. Duplicate-effect or isolation correctness alone belongs on its existing route; use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) when the bottleneck is not yet known and [python-backend](../../skills/languages/python-backend/SKILL.md) for broader session and query ownership questions.

Invocation: automatic

## It's working if

- The affected workload, baseline interval, timing boundary, invariant, and evidence gaps are explicit.
- The leading mechanism is supported by aligned application-path, wait, and workload evidence, with a measurement that could reject it.
- The candidate addresses that mechanism and includes correctness, resource, deployment, and recovery checks.
- A representative matched comparison reports client latency, useful throughput, query count, waits, plan or execution evidence, and changed resource costs.
- The result records executed checks, tradeoffs, untested conditions, and the scope of isolated or toy results.

## Where it fits

This skill handles database-specific diagnosis and intervention. Use [performance-diagnosis](../../skills/performance/performance-diagnosis/SKILL.md) to find the affected system constraint, [load-testing](../../skills/performance/load-testing/SKILL.md) for representative comparison, and [python-backend](../../skills/languages/python-backend/SKILL.md) when ORM session lifetime or query ownership is central. The [reading path](../reading-paths.md#database-workload-performance) points to PostgreSQL plans, waits, maintenance, and conditional pooler contracts.

## Sources

- [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html), §§14.1.1–3:
  plans, actual loops and measurement/effect boundaries.
- [Monitoring statistics](https://www.postgresql.org/docs/18/monitoring-stats.html),
  §§27.2.1–3, and [pg_stat_statements](https://www.postgresql.org/docs/18/pgstatstatements.html),
  introduction/view: wait and workload observations, collection limitations.
- [Memory settings](https://www.postgresql.org/docs/18/runtime-config-resource.html)
  and [routine vacuuming](https://www.postgresql.org/docs/18/routine-vacuuming.html),
  §§24.1.1–3: concurrent resource/maintenance costs. Additional interventions need
  their own engine-specific checks.
- [PgBouncer usage](https://www.pgbouncer.org/usage.html), SHOW STATS and SHOW POOLS:
  pooler boundaries, conditional on actually using PgBouncer.
- [SQLAlchemy performance](https://docs.sqlalchemy.org/en/21/faq/performance.html):
  query/loading attribution, conditional on the target ORM. Pool-budget and
  application-invariant checks are derived requirements, not ORM guarantees.
