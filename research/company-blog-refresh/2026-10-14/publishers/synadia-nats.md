# Synadia and NATS publisher refresh

Research date: October 14, 2026.

Public English article URLs under the Synadia and NATS /blog/ paths. Series, category, tag, author, pagination, documentation and product paths are excluded.

Both declared finite sitemaps and exposed feeds parsed. Company archive has no declared next link. This establishes the exposed archive rather than every historical publication.

Verified baseline: 297 records. Current article frontier: 298 URLs. Frontier dispositions processed: 298. Unique collector article HTTP request URLs: 304. Article body responses retrieved: 298. Extracted: 288. Fetched without substantive extraction: 10. Pending: 0. Deliberately read: 3. Extraction and reading counts are independent. The read count includes 1 complete short body inspections performed for extraction auditing; these support coverage classification rather than new technical mechanisms.

## Relevant improvement

Extend messaging-reliability with the atomic batch publication boundary. A successful single stream batch is committed in contiguous stream order, while consumer processing order and external effects still require their own guarantees. Chunk reconstruction needs identity, index, count and integrity metadata even when storage adjacency holds.

The two articles were read completely, including examples and limitations, but the NATS server, clients and sample commands were not executed. Minimum versions, opt-in stream configuration, batch size, inactivity timeout, retry behavior and commit acknowledgement loss need deployed-version verification. The older article overstates simultaneous consumer delivery; the newer ordering article explicitly separates stream storage and processing.

Discriminating evaluation: A batch commits, its acknowledgement is lost, and a subject-filtered consumer sees only a subset of chunks while another message is redelivered. Require reconciliation of the batch outcome and validation of complete logical payload identity. Do not infer processing order or business-effect atomicity from stream adjacency.

## Read evidence

* [atomic-batch-publishing-nats-2-12](https://www.synadia.com/blog/atomic-batch-publishing-nats-2-12), Complete substantive body, examples and limits. Raw body SHA256: `1f02f0cdae093e918d4a1a2bf8f2c014aeda43999575738764274f0f18616117`.
* [jetstream-atomic-publish-batch-ordering](https://www.synadia.com/blog/jetstream-atomic-publish-batch-ordering), Complete substantive body, examples and limits. Raw body SHA256: `1f9907fb35558b3667aafbd512677a961c83c1af7c5ed406d21896f01ad3674d`.
* [hello-world-java-client](https://nats.io/blog/hello-world-java-client), Complete currently exposed short article body inspected during extraction audit. Linked video, repositories and documentation were not read or executed.. Raw body SHA256: `185cb1391e9bfe430e29624fb9fc650c5fda0db1926b9918eef6754ce7169d4f`.

## Coverage limits

* Finite sitemaps and terminal listing pages establish exposed scope, not every deleted, private or unlisted historical article.
* Automatic extraction is separate from deliberate reading; only the selected bodies below were read.
* No source code, broker, stream engine, connector or benchmark was executed as part of this research.
* 10 responses were fetched but did not pass substantive body extraction. Their bytes and receipts remain archived.
* Short video and webinar introductions may fail the automatic 120 word extraction threshold. Linked videos and repositories were not crawled or read as article bodies.

Compact counters, scope and evidence binding are in [synadia-nats.json](synadia-nats.json). Raw responses, extracted text, failed attempts, exclusion journals and original probe failures remain outside the source tree under the external crawl archive. The bound summary SHA256 is `4b1dd21d0a95b775e8c6ccf95bcc184fffc2a6a34fd77430f5417ed0a46c0d5f`.
