# Source basis for analytical read models

The optional [analytical-read-models.md](analytical-read-models.md) branch draws on ClickHouse, [Postgres to ClickHouse: Data Modeling Tips V2](https://clickhouse.com/blog/postgres-to-clickhouse-data-modeling-tips-v2), March 6, 2025. The full substantive body was read on October 1, 2026: CDC/versioned rows, deduplication identity, ordering keys, JOINs, raw and aggregated materializations, and the difference between historical distinct counts and current records. Historical performance and projection-versus-FINAL statements are not adopted as current guarantees.

Current primary crosschecks on the same date:

- [ClickPipes Postgres ordering keys](https://clickhouse.com/docs/integrations/clickpipes/postgres/ordering-keys): direct CDC custom ordering-key fields must be stable per row, and deletion replica identity must carry the selected key values. The ordering key determines `ReplacingMergeTree` deduplication identity.
- [Incremental materialized views](https://clickhouse.com/docs/concepts/features/materialized-views/incremental-materialized-view): inserted-block computation and JOIN triggering on the left/source table; changes only to the right-side table do not retroactively refresh prior materialized rows. The documentation distinguishes incremental processing from periodic full-query recomputation.

Query-meaning/freshness contracts, approximation requirements, watermark or quiescent comparison boundaries, mutation/rebuild schedules, adoption criteria, and comparative resource checks are independently authored synthesis. Engine-local version reconciliation does not demonstrate CDC catch-up or a consistent source snapshot across tables. No CDC pipeline, SQL example, database benchmark, or model evaluation was executed for this extension. This ledger attributes this optional branch; it does not recast the broader architecture workflow as ClickHouse-specific guidance.
