# Shopify publisher refresh, 2026-10-14

Official Engineering Atom feed, article sitemap and every numbered latest archive page through the observed terminal.

Complete Atom feed has 432 entries. Complete sitemap has 432 URLs. Numbered archive page 23 returns HTTP 404 after 22 nonempty pages. Missing Next links did not truncate traversal.

The current crawl frontier contains 432 URL identities. 432 have a frontier disposition, 432 were attempted over article HTTP, 432 have a fetched response or published body import, 432 have automatic body extraction, 0 are fetched without substantive extraction, and 0 remain pending. Deliberate reading covers 2 articles or explicitly named body sections. Automatic extraction and metadata discovery are not article reading.

[Deadlock mitigation](https://shopify.engineering/mitigating-deadlocks-in-high-concurrency-environments) identifies physical lock overlap despite logically separate account batches. Shopify changed clustered key ordering and retained an id lookup index. A useful addition to `database-performance` would require inspecting actual engine lock scope, isolation, affected indexes and a reproducible schedule before accepting a layout change. The post's simplified explanation should be verified against the installed MySQL documentation before becoming normative guidance.

[The circuit breaker article](https://shopify.engineering/circuit-breaker-misconfigured) makes probe cost concrete: many failing instances consume worker capacity both before their circuits open and during repeated half open tests. Breaker naming, thresholds, recovery delay and probe timeout belong in one aggregate capacity budget. Existing `overload-control` already covers recovery and synchronized probes, so this is a possible example and correlated failure test rather than a separate skill.

The companion JSON binds counts to the external crawler summary hash, verified historical inventory and coverage hashes, source terminal receipts, collector identities and deliberate reading evidence. Raw bodies, crawl logs and prior attempts remain outside the source tree.

Remaining limits:

- Completeness is relative to the currently published Atom, sitemap and numbered latest archive. Removed, private and unlisted history remain outside the evidence.
- The automatic extractor can include author and related article prose. Extraction does not establish complete visual or interactive content.
- Early collector run hashes were recorded without an exact source snapshot. Later cache finalization archives executed collector source, while early implementation reconstruction remains a gap.
