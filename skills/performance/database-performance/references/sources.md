# Primary grounding

Inspected 2026-10-01. PostgreSQL reading used explicit version 18 documentation;
the target engine/version governs implementation. No live query was executed.

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
