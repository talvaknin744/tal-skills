# Estuary publisher refresh

Research date: October 14, 2026.

Public English article URLs under /blog/. Numeric archive pages and the five exposed category collection roots are excluded, as are integration, documentation and product paths.

Declared sitemap index, its finite URL sets and the exposed RSS feed parsed. Main HTML pagination reached /blog/26 with no next page link. Category pagination URLs are collection pages and were journaled separately. This establishes publisher-exposed scope.

Verified baseline: 773 records. Current article frontier: 775 URLs. Frontier dispositions processed: 775. Unique collector article HTTP request URLs: 775. Article body responses retrieved: 775. Extracted: 775. Fetched without substantive extraction: 0. Pending: 0. Deliberately read: 2. Extraction and reading counts are independent. The read count includes 0 complete short body inspections performed for extraction auditing; these support coverage classification rather than new technical mechanisms.

## Relevant improvement

Extend stream-processing-design state and history guidance with the concurrent snapshot and CDC recovery tuple: snapshot cursor, source log position, durable checkpoint, replication slot and required retained log. Reconcile snapshot rows against overlapping changes at a defined fence. Budget source log retention by write rate, maximum acknowledgement interval and lag, while diagnosing old open transactions separately.

Both selected article bodies were read completely. Connector documentation and runtime examples were not executed or independently verified against a deployed version. XID-limited recovery misses deletes, physical row identifiers weaken guarantees, read-only low-traffic capture may need a published heartbeat, and Only Changes cannot supply prior history to a later destination.

Discriminating evaluation: Interrupt a backfill at 80 percent, then delete a row and invalidate its replication slot during the outage. With the recovery tuple intact, resume from the durable checkpoint. With required WAL missing, require a new log position and reconciliation; reject restart-only or XID-only recovery as proof that deletes are correct.

## Read evidence

* [postgres-cdc-backfill](https://estuary.dev/blog/postgres-cdc-backfill/), Complete substantive body, examples and limits. Raw body SHA256: `3c42f42d6b7c97c58fb7e07745cf12f9c1ec55ecfd9489d7b399131a5676a8c1`.
* [transactional-consistency-matters](https://estuary.dev/blog/transactional-consistency-matters/), Complete substantive body, examples and limits. Raw body SHA256: `34f6a2dbc37aa900a1c8bb129a7c5d0a2d541d77a727a37b0f26c023060aab97`.

## Coverage limits

* Finite sitemaps and terminal listing pages establish exposed scope, not every deleted, private or unlisted historical article.
* Automatic extraction is separate from deliberate reading; only the selected bodies below were read.
* No source code, broker, stream engine, connector or benchmark was executed as part of this research.

Compact counters, scope and evidence binding are in [estuary.json](estuary.json). Raw responses, extracted text, failed attempts, exclusion journals and original probe failures remain outside the source tree under the external crawl archive. The bound summary SHA256 is `da57205a245ff601829ec08bf4f4b74da7a5c2981818bfb497ad52c7257dfced`.
