# Messaging archive and general streaming design research

Frozen 2026-10-01. The 6,345 canonical article URLs across the ten prior messaging publishers are preserved in the [research crawl archive manifest](../../../MANIFEST.md#archived-files). [coverage.json](../../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) records each exact endpoint, successful collection page, terminal evidence, content hash, retrieval time, date semantics, and gap. Four new article bodies are marked `deep_read`; the other 6,341 URLs are indexed metadata. Ten records match earlier research sources. This collection does not claim every article ever published or that each indexed URL is currently live.

| Publisher | Article URLs | Titles | Publication dates | Earliest known publication |
|---|---:|---:|---:|---|
| Confluent | 1,408 | 1,408 | 1,408 | 2014-11-01 |
| Temporal | 433 | 433 | 433 | 2020-07-01 |
| Redpanda | 437 | 437 | 437 | 2019-02-11 |
| StreamNative | 365 | 365 | 365 | 2019-07-09 |
| RabbitMQ project | 181 | 181 | 181 | 2010-08-01 |
| Synadia / NATS | 297 | 297 | 297 | 2015-11-07 |
| Estuary | 773 | 773 | 773 | 2021-04-01 |
| Materialize | 180 | 180 | 180 | 2020-02-18 |
| RisingWave | 2,125 | 285 | 285 | 2022-04-04 |
| Decodable | 146 | 146 | 146 | 2021-11-13 |

Publication dates come from official feeds, archive cards, structured listings, or explicitly named article metadata. Sitemap `lastmod` remains a separate field. A slug label is navigation metadata and never fills a missing title. The earliest date means the earliest known publication among the collected records, rather than proof of the publisher's first article.

## Collection boundaries and terminal evidence

- **Confluent:** The [main sitemap](https://www.confluent.io/sitemap.xml) and [developer sitemap](https://developer.confluent.io/sitemap.xml), the [RSS feed](https://www.confluent.io/rss.xml), and all 100 advertised [blog archive pages](https://www.confluent.io/blog/) were exhausted. [Page 100](https://www.confluent.io/blog/100/) has no next link. The [developer blog](https://developer.confluent.io/blog/) adds metadata for its exposed article list. Two missing archive dates were filled from article JSON-LD without reading the body. Uniform sitemap generation timestamps are not publication dates.
- **Temporal:** The [sitemap](https://temporal.io/sitemap.xml) and [feed](https://temporal.io/blog/feed.xml) expose 433 blog records. Both finite collections were exhausted and the feed supplies titles/dates for every record.
- **Redpanda:** The [sitemap](https://www.redpanda.com/sitemap.xml) exposes 437 blog records and the [archive HTML](https://www.redpanda.com/blog) embeds all 437 dated cards. The [RSS feed](https://www.redpanda.com/blog/rss.xml) exposes a capped 100 items.
- **StreamNative:** The [sitemap](https://streamnative.io/sitemap.xml) exposes 356 blog records. The official archive's `__NUXT_DATA__` points to a public structured `blogs-listing` array with 365 non-draft records. That array was exhausted; its versioned payload URL and hash are in the coverage record. Nine additional listing paths are retained. The listing payload also contains bodies; only metadata was parsed and no bodies are republished.
- **RabbitMQ:** The [sitemap](https://www.rabbitmq.com/sitemap.xml) and complete [dated archive](https://www.rabbitmq.com/blog/archive) expose 181 articles back to 2010. Category and author roots were excluded. The [RSS feed](https://www.rabbitmq.com/blog/rss.xml) exposes 20 items.
- **Synadia / NATS:** The [Synadia sitemap index](https://www.synadia.com/sitemap-index.xml), its child, [Synadia feed](https://www.synadia.com/rss.xml), [NATS sitemap](https://nats.io/sitemap.xml), and [NATS feed](https://nats.io/blog/index.xml) were exhausted. Company and project records remain one publisher, consistent with the earlier survey; series/category landing pages are excluded.
- **Estuary:** The [sitemap index](https://estuary.dev/sitemap-index.xml), its blog-containing child, and the [773-item feed](https://estuary.dev/blog/rss.xml) were exhausted. The integrations-only sitemap is explicitly outside the blog collection. Category pagination is excluded.
- **Materialize:** The [sitemap](https://materialize.com/sitemap.xml), [feed](https://materialize.com/rss.xml), and [23 archive pages](https://materialize.com/blog/) were exhausted. [Page 23](https://materialize.com/blog/23/) has no next link and the union exposes 180 dated articles.
- **RisingWave:** The [sitemap index](https://risingwave.com/sitemap.xml) and both children expose 2,125 blog URLs. The current [archive HTML](https://risingwave.com/blog/) embeds a 285-item structured listing; its “Load More” client code only slices that already loaded array. Both finite collections were exhausted. Titles/publication dates remain unknown for 1,840 sitemap records; the common sitemap generation timestamp is not publication evidence.
- **Decodable:** The [sitemap](https://www.decodable.co/sitemap.xml), [100-item capped feed](https://www.decodable.co/blog/rss.xml), and all 17 explicit Next Page links were exhausted. [Page 17](https://www.decodable.co/blog?aa1d3371_page=17) has no next link. The union exposes 146 dated articles. A Redis acquisition link in navigation is excluded from the publisher host scope.

Metadata is one canonical URL per publisher. Canonicalization strips query/fragment and a trailing slash and resolves the publishers' ordinary `www` aliases. Locale, tag, author, series, category, numeric pagination, feed, and documentation paths are outside this collection. Existing research URL matches are retained as provenance flags; the four deep readings passed the prior-record novelty check.

## General design findings

[deep-reading.md](deep-reading.md) and [deep-reading.json](deep-reading.json) contain four complete textual readings, nine current documentation crosschecks, and six-dimensional practice cards. They cover replay/live-serving topology, temporal-filter state, barriers versus event-time finality, and regular versus historical streaming joins. They record the limits of each reading, including uninspected image pixels and unexecuted examples.

The strongest research proposal is a distinct `stream-processing-design` trigger for choosing time domain, output changes/finality, join semantics, and state lifetime inside one engine. The best existing placement for service-owned projections is `microservice-data/references/projections.md`; replay/serving separation fits `distributed-system-patterns/references/serving.md`. These are ranked research recommendations, with no skill changes or model evaluations in this lane.

## Reproduction and verification

`collect_archives.py` records initial official discovery probes; `build_archive.py` parses finite sitemap/feed/listing collections and follows the declared archive pages. Raw fetched bodies were held temporarily outside the repository and removed after the metadata freeze. Rerunning the collectors fetches their current official endpoints again. The scripts serialize each host at a minimum 1.1-second request interval, use 8-second connect and 20-second read timeouts, and run different publishers concurrently. Discovery-only script/payload request evidence is merged into coverage.json; duplicate probe inventories and raw responses were removed after the freeze.

The collector's metadata schema and frozen index were checked for valid JSON, canonical URL uniqueness, allowed publisher hosts, exact per-publisher count agreement, source provenance, four deep-read records, and empty pagination successors on the terminal pages. Local Markdown references in the deep-reading note resolve. Proposed broker/engine verification schedules were not executed.
