# ScyllaDB blog refresh

Recorded on 2026-10-14. The canonical scoped collection contains 1,022 article routes, with 1,012 substantive bodies automatically extracted and 10 returned bodies below the extraction threshold. Every scoped route was processed. Deliberate reading covered 2 selected article bodies, with current documentation reading recorded separately. Crawling and extraction do not establish reading of the full archive.

Default public WordPress post collection, including dated article permalinks. Nonblog site pages are excluded. Public content API pages cover every advertised post identity.

The public API advertised 1,022 posts across 11 pages. All 11 pages were consumed, page 11 contained 22 posts, and page 12 returned HTTP 400. This establishes the exposed post collection, not deleted, private, or unlinked lifetime content.

Ten short posts did not pass the automatic 120 word substantive extraction threshold. Their original content HTML remains available in the retained public API responses. The generic discovery scope used current dated permalinks plus verified historical inventory. Complete article discovery rests on independently exhausted public API pagination. The first import command failed because the CLI parsed an equals sign inside a query as the file delimiter. The failed run remains retained, and corrected per page imports succeeded.

The [incremental repair account](https://www.scylladb.com/2026/04/07/incremental-repair-faster/) separates file repair markers from authoritative system activation. It keeps repaired and unrepaired compaction inputs apart, and distinguishes incremental work from full revalidation. Add a crash between preparation and activation case to `background-maintenance`; a marked file alone must not permit skipping uncommitted repair work.

The [tombstone article](https://www.scylladb.com/2022/06/30/preventing-data-resurrection-with-repair-based-tombstone-garbage-collection/) links retirement to replica repair rather than elapsed age. [Current GC documentation](https://docs.scylladb.com/manual/stable/cql/ddl.html#tombstones-gc-options) adds delayed write propagation as a separate eligibility boundary. Add a delete, repair, GC, then older timestamp insert case. Successful repair alone does not establish safe retirement while admissible older writes remain. Current defaults and table support differ from the historical experimental article.

These are research recommendations for a future candidate. No instruction behavior was changed here, no live database procedure was run, and no behavioral evaluation pass is claimed. The companion JSON binds counters, source hashes, reading scope and remaining gaps to the external archive. Historical evidence and failed attempts remain retained.
