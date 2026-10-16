# Decodable publisher refresh

Research date: October 14, 2026.

Public English article URLs under /blog/ on the Decodable company host. Category, author, pagination and documentation paths are excluded. Redis acquisition navigation is outside this publisher scope.

The finite sitemap parsed as 146 article URLs. The RSS feed exposes 100 items and remains a capped feed rather than a lifetime archive. HTML pagination reached ?aa1d3371_page=17 with no next link.

Verified baseline: 146 records. Current article frontier: 146 URLs. Frontier dispositions processed: 146. Unique collector article HTTP request URLs: 146. Article body responses retrieved: 146. Extracted: 146. Fetched without substantive extraction: 0. Pending: 0. Deliberately read: 2. Extraction and reading counts are independent. The read count includes 0 complete short body inspections performed for extraction auditing; these support coverage classification rather than new technical mechanisms.

## Relevant improvement

Extend stream-processing-design with completeness and commit-order checks for CDC transaction buffers. Transaction END markers, expected event counts per table, unique event identity and transaction order establish different facts. Completed later transactions may need to wait for earlier transactions. The destination still needs an atomic transaction. Schema evolution must also cover operator state, historical replay and sink schemas, independently of registry compatibility.

Both selected bodies were read completely. The transaction buffering implementation is experimental and was not executed. Large transactions can exceed broker message limits; a naive in-memory SMT has unbounded memory and no buffer fault tolerance. Debezium transaction metadata and DDL support depend on connector and configuration. Flink CDC synchronization modes and supported connectors need current version verification.

Discriminating evaluation: Deliver a later small transaction before an earlier large one completes, and duplicate one CDC row while its END marker expects two unique rows. Require unique completeness, source commit order, persisted recoverable buffering and atomic sink application. Repeat with a schema rename and historical event replay to expose registry versus state and sink compatibility.

## Read evidence

* [aggregating-change-data-capture-events-based-on-transactional-boundaries](https://www.decodable.co/blog/aggregating-change-data-capture-events-based-on-transactional-boundaries), Complete substantive body, examples and limits. Raw body SHA256: `363f366669fd39b119ab85b4c73f5cff07e9e169438552cbb95181540199aaa2`.
* [schema-evolution-in-change-data-capture-pipelines](https://www.decodable.co/blog/schema-evolution-in-change-data-capture-pipelines), Complete substantive body, examples and limits. Raw body SHA256: `0a1b1f1b9d5f3d48177d749eae5979a66251d9e0d7658b7b7a9d0af377848f89`.

## Coverage limits

* Finite sitemaps and terminal listing pages establish exposed scope, not every deleted, private or unlisted historical article.
* Automatic extraction is separate from deliberate reading; only the selected bodies below were read.
* No source code, broker, stream engine, connector or benchmark was executed as part of this research.
* The RSS feed exposes 100 entries while the sitemap exposes 146. Initial Webflow extraction failures are preserved; local re-extraction recovered article text without a new network claim.

Compact counters, scope and evidence binding are in [decodable.json](decodable.json). Raw responses, extracted text, failed attempts, exclusion journals and original probe failures remain outside the source tree under the external crawl archive. The bound summary SHA256 is `39da917dd8650fc615234d6bb3d3d02307b315ddd2800574b153ce23a6273406`.
