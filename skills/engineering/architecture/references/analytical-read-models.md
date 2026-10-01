# Analytical read models

Use this branch when choosing a derived analytical schema or materialization over changing authoritative data. Produce a query-meaning contract, update model, and comparison of credible computation strategies. A source schema and its query semantics do not automatically transfer to another engine.

## Define the answer

For each representative query, specify current state versus historical events, grouping identity, exact versus approximate results, permitted approximation error, and acceptable age. Distinguish ingestion-time dimension values from current dimension values. Name the authoritative source and whether the answer requires a consistent snapshot across tables.

For example, accumulating distinct identities ever inserted answers a historical question. It cannot establish how many records currently exist after deletion or movement between groups. An approximate aggregate needs an error contract; an exact aggregate still needs the correct meaning and update semantics.

**Done:** every query has an observable meaning, freshness boundary, and completeness/approximation policy.

## Choose the update and computation model

For CDC, define stable row identity, source version/order, deletion representation, replay behavior, and the signal that establishes catch-up. Explain how updates that change grouping or ordering fields replace prior contributions. In ClickHouse `ReplacingMergeTree`, the ordering key determines deduplication identity; appending a source ID does not make additional mutable key columns safe. Verify that the CDC deletion identity contains the values the chosen layout needs.

Compare query-time reconciliation, periodic full recomputation, and incremental transformation against query flexibility, freshness, memory, ingestion/write overhead, and refresh cost. Incremental views process inserted blocks rather than recomputing the entire source state. A ClickHouse incremental JOIN view triggers on inserts to its left/source table; changes only to the right-side dimension do not refresh earlier materialized rows. If current dimension values are required, choose a supported query-time join or recomputation mechanism and account for its cost. Periodic refresh alone does not establish a consistent cross-table source snapshot.

**Done:** each mutation has a supported effect on the read model, and each selected strategy meets the meaning/freshness contract or names the missing proof. Record backfill, cutover, rebuild, and rollback requirements when changing an existing model.

## Verify at a comparable boundary

Insert one identity, replay its version, update its value, move it between groups, and delete it. Update only a joined dimension while no fact insert occurs. Interrupt and rebuild the model. Compare with a known source snapshot after a declared watermark or quiescent boundary; inspect visible values, aggregate meaning, dimension values, and measured age. Query-time `FINAL` can reconcile engine-local versions; it does not establish that CDC has caught up or recreate a cross-table source snapshot.

Measure rows/bytes scanned, useful query throughput, latency, memory, refresh duration, and ingestion overhead under the same workload/resources. Accept only demonstrated meaning, freshness, approximation, and cost contracts. Report unexecuted checks explicitly. [sources.md](sources.md) records the primary basis and independent synthesis.
