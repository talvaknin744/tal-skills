# RisingWave publisher refresh

Research date: October 14, 2026.

Public English article URLs under /blog/, including all sitemap-listed articles that are absent from the current dated embedded listing. Documentation, product and collection paths are excluded.

Both child sitemap URL sets parsed, each exposing 2,125 unique blog article paths. The complete embedded blogs array was independently parsed as 285 entries, all already present in the verified baseline. No declared next link or hidden cursor was observed in that array. The broader sitemap union remains the crawl frontier.

Verified baseline: 2125 records. Current article frontier: 2125 URLs. Frontier dispositions processed: 2125. Unique collector article HTTP request URLs: 2125. Article body responses retrieved: 2125. Extracted: 2124. Fetched without substantive extraction: 1. Pending: 0. Deliberately read: 3. Extraction and reading counts are independent. The read count includes 1 complete short body inspections performed for extraction auditing; these support coverage classification rather than new technical mechanisms.

## Relevant improvement

Extend stream-processing-design with source transaction domains and resource ownership during backfill. Individually consistent sources can expose a partial multi-table transaction unless capture, progress and visible output coordinate across the transaction domain. Historical relation initialization differs from external CDC backfill. Separate backfill compute still competes for shared source, storage and compaction capacity.

Both selected bodies were read completely. The atomic CDC article contains inconsistent statements about whether barriers advance without buffered data or wait for transaction completion, so the specific implementation remains unresolved without code or deployed-version documentation. The backfill article describes default changes, deprecations, preview features and Cloud-only behavior, which are not installation or runtime guarantees.

Discriminating evaluation: A transaction updates order, payment and inventory tables captured through independent sources while a barrier advances between events. Require an explicit atomic visible-output domain rather than assuming per-source exactly-once proves cross-table atomicity. During snapshot backfill, isolate compute while injecting compaction pressure and a restart; verify both state recovery and the shared resource budget.

## Read evidence

* [backfilling-in-risingwave-from-historical-initialization-to-continuous-streaming](https://risingwave.com/blog/backfilling-in-risingwave-from-historical-initialization-to-continuous-streaming/), Complete substantive body, examples and limits. Raw body SHA256: `5349ee34d89745e22e9c70db3b5219995ed0ef6f00ec8a2fefeda31f7f3145ad`.
* [atomic-cdc-transactions-in-risingwave](https://risingwave.com/blog/atomic-cdc-transactions-in-risingwave/), Complete substantive body, examples and limits. Raw body SHA256: `a6c4b0c41a34621e7e892b151148c268c04efa34bffd7737bf379fc5b13e0984`.
* [real-time-pricing-engine-streaming-sql](https://risingwave.com/blog/real-time-pricing-engine-streaming-sql), Complete currently exposed short article body inspected during extraction audit. Linked video, repositories and documentation were not read or executed.. Raw body SHA256: `42145c0e6033922848934f261b162181af64429acf6357c21c73ee54a051437b`.

## Coverage limits

* Finite sitemaps and terminal listing pages establish exposed scope, not every deleted, private or unlisted historical article.
* Automatic extraction is separate from deliberate reading; only the selected bodies below were read.
* No source code, broker, stream engine, connector or benchmark was executed as part of this research.
* 1 responses were fetched but did not pass substantive body extraction. Their bytes and receipts remain archived.
* The current 285 entry dated listing omits 1,840 additional sitemap URLs. Missing publication dates remain unknown; sitemap lastmod is not a publication timestamp.

Compact counters, scope and evidence binding are in [risingwave.json](risingwave.json). Raw responses, extracted text, failed attempts, exclusion journals and original probe failures remain outside the source tree under the external crawl archive. The bound summary SHA256 is `ce466d2168fa0a0fdfc748edb44ad2fabc22099799f88c04082099a7e4771192`.
