# Materialize publisher refresh

Research date: October 14, 2026.

Public English article URLs under /blog/. Numeric archive pages, documentation, product and resource paths are excluded. Verified historical URLs are retained even when the current site redirects them to the archive.

The finite sitemap and complete exposed RSS feed parsed. Current HTML pagination reaches /blog/21 with no next page. Historical /blog/22 and /blog/23 now return 404. This establishes the exposed archive; archived historical URLs remain part of the recovery frontier.

Verified baseline: 180 records. Current article frontier: 181 URLs. Frontier dispositions processed: 181. Unique collector article HTTP request URLs: 20. Article body responses retrieved: 161. Extracted: 161. Fetched without substantive extraction: 0. Pending: 0. Deliberately read: 3. Extraction and reading counts are independent. The read count includes 0 complete short body inspections performed for extraction auditing; these support coverage classification rather than new technical mechanisms.

## Relevant improvement

Extend stream-processing-design retained-state analysis to count future additions and retractions, not only visible rows. A replica expiration optimization may discard future work only when the system prevents that work from becoming definite before a scheduled rebuild. Extend database-performance cleanup review to validate NULL semantics, stable delete keys, maintained indexes and total completed goodput including maintenance. The newest log design also shows that final protocol correctness does not establish correctness during mixed old and new client or isolation mode rollouts. Coordinate predecessor locking against truncation, initialization identity, client fencing and staged isolation switches under the actual storage invariant.

The replica expiration article, complete transaction processing article including its correction appendix, and newly discovered linearizable log article including rollout and results were read. Their code and reported benchmarks were not executed. The transaction design is explicitly educational. The newest log article reports a Lean 4 proof and database benchmark, neither independently executed here. Its product rollout flag defaults off and applies after upgrading and fencing old clients, as described for version 26.33 or later; it is not a general instruction to lower isolation. Replica expiration depends on supported object types, wall-clock mapping and scheduled restarts; its article excludes self-managed deployments. The transaction appendix corrects earlier whole-row NULL deletion and performance accounting mistakes.

Discriminating evaluation: Use a temporal result with a far-future retraction and restart beyond its proposed retention horizon; require proof that omitted updates cannot become visible before rebuild. Separately, clean up transaction rows containing NULL values, and require stable identity deletion plus an independently expected retained-state result. A lower visible row count or stage rate alone is insufficient.

## Read evidence

* [transaction-processing-in-the-data-plane](https://materialize.com/blog/transaction-processing-in-the-data-plane/), Complete substantive body, examples and limits. Raw body SHA256: `4c3a79c8b47fda9d5a8e8f6ec56deffc6af1d6b151f696a6faa6f0cf7dc2caa2`.
* [replica-expiration](https://materialize.com/blog/replica-expiration/), Complete substantive body, examples and limits. Raw body SHA256: `e872e54b4692baed19b5fe960d97035ed8e6ebb943fcf282e6cedac80e54fcb1`.
* [building-a-linearizable-log-on-read-committed](https://materialize.com/blog/building-a-linearizable-log-on-read-committed), Complete substantive body, examples and limits. Raw body SHA256: `ae2cf81cf9b116a35ebfc350d5fef8bfda5d4d17424217836f2433eaf2ccb37f`.

## Coverage limits

* Finite sitemaps and terminal listing pages establish exposed scope, not every deleted, private or unlisted historical article.
* Automatic extraction is separate from deliberate reading; only the selected bodies below were read.
* No source code, broker, stream engine, connector or benchmark was executed as part of this research.
* Twenty verified historical article URLs now redirect to /blog/ and provide no article body. They remain explicit access gaps, with their redirect receipts preserved.

Compact counters, scope and evidence binding are in [materialize.json](materialize.json). Raw responses, extracted text, failed attempts, exclusion journals and original probe failures remain outside the source tree under the external crawl archive. The bound summary SHA256 is `1e61fcc5f562cdf2854a83795731497dd4e1db38f53a1fc40738cf1f24247bbd`.
