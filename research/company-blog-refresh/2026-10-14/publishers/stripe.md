# Stripe publisher refresh, 2026-10-14

All 123 current developer blog posts and all 236 official corporate archive posts, including the 26 developer Engineering topic records. Topic membership is retained rather than guessed for legacy corporate articles.

The developer page embeds the full 123-post dataset, with no cursor. Corporate pages 1 through 12 expose 236 unique article URLs; page 13 redirects to the root. All nine child sitemaps of the corporate sitemap index were consumed.

The current crawl frontier contains 359 URL identities. 359 have a frontier disposition, 359 were attempted over article HTTP, 358 have a fetched response or published body import, 358 have automatic body extraction, 0 are fetched without substantive extraction, and 0 remain pending. Deliberate reading covers 1 articles or explicitly named body sections. Automatic extraction and metadata discovery are not article reading.

[The database movement article](https://stripe.dev/blog/how-stripes-document-databases-supported-99.999-uptime-with-zero-downtime-data-migrations) describes snapshot import, retained mutation replay, point in time comparison, version gating, final catchup and route publication. The old source rejects requests after its version advances, preventing stale routing from continuing accepted writes during cutover. Bidirectional replication tags prevent cycles and support rollback. These mechanisms can strengthen examples in `background-maintenance`, `microservice-data` or `infrastructure-change-safety` if missing. Stripe used a custom MongoDB patch; the source does not prove that a stock installation can enforce the same gate. A new skill is not warranted solely by this example.

The companion JSON binds counts to the external crawler summary hash, verified historical inventory and coverage hashes, source terminal receipts, collector identities and deliberate reading evidence. Raw bodies, crawl logs and prior attempts remain outside the source tree.

Remaining limits:

- Engineering only history cannot be classified from redirected legacy categories. This crawl expands to all currently exposed developer and corporate posts, keeping topic labels when available. Prior sitemap-only legacy identities are preserved.
- The legacy `accept-ach-payments` article redirects to a Financial Connections product page. Its body remains unavailable and is retained as a redirect outside the blog scope. Product content is not treated as an article body.
- Twelve corporate article URL identities redirect to current developer article identities. Counts describe 359 URL identities, not 359 distinct canonical stories.
- The original generic main extraction picked up developer metadata and related cards. Cached responses were extracted again from published postData.content Markdown, retaining the prior events and original HTTP receipts.
- Legacy Engineering classification remains unresolved despite exhaustively crawling the broader published corporate and developer archives.
- Early collector run hashes were recorded without an exact source snapshot. Later cache finalization archives executed collector source, while early implementation reconstruction remains a gap.
