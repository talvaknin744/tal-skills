# Infrastructure archive and design pass

Frozen on 2026-10-01. **10,922 scoped archive URLs** were indexed across the ten previously surveyed publishers, with **two explicitly supplemental sources** and **four new substantive article reads**. Metadata indexing is distinct from reading an article body. The archived URLs include positive designs and research, operational guidance, product announcements and incident accounts; selection for deep reading favored positive design mechanisms.

[coverage.json](coverage.json) records exact collection boundaries, accessed pages, terminal observations, unknown dates, failed probes and exclusions. [index.json](index.json) retains canonical metadata and discovered aliases. [request-provenance.json](request-provenance.json) records final response SHA-256, status and UTC access time; the initial extraction responses were not hashed, so final revalidation is labeled separately.

| Collection | Indexed URLs | Archive endpoint pages | Earliest observed publication | Terminal observation |
| --- | ---: | ---: | --- | --- |
| AWS | 30 | 1 | Unknown original dates | response cursor absent/empty |
| Google | 1,616 | 136 | 2006-02-18 (all dates known) | no active next page link |
| Microsoft | 31 | 4 | 2021-07-06 (all dates known) | rest_post_invalid_page_number |
| Cloudflare | 3,641 | 1 | 2023-11-04 (partial dates) | all declared child sitemap pages exhausted |
| Fastly | 1,039 | 4 | 2026-08-06 (partial dates) | all declared child sitemap pages exhausted |
| Datadog | 102 | 1 | 2016-07-11 (all dates known) | all declared child sitemap pages exhausted |
| Grafana Labs | 2,029 | 103 | 2014-04-18 (partial dates) | no link to next page |
| Honeycomb | 669 | 33 | 2016-08-09 (partial dates) | no link to next page |
| HashiCorp | 1,563 | 1 | 2021-12-08 (partial dates) | all declared child sitemap pages exhausted |
| Fly.io | 202 | 3 | 2020-01-22 (partial dates) | single archive document; no pagination links; feed exhausted |

Page counts include scoped sitemap endpoints plus archive/API/feed pages used for enumeration, not article-body pages. Google and Grafana pagination terminated at pages 135 and 102 respectively; Honeycomb terminated at page 32. A terminal means the accessible declared route is exhausted. It does not recover removed or unlisted history.

AWS is the current **Builders Library collection**, not all AWS blogs. Its public tag API returned 30 items and no cursor when `pageSize=100`; four report non-English locale hints despite English displayed titles. The API dates describe current/migrated collection publication, and original dates remain unknown. The static-stability PDF is a supplemental Builders Library source outside that current tag inventory. Google Cloud's SLO/cost article is supplemental to the surveyed Google Research archive.

The 37 Honeycomb sitemap-only entries are retained as metadata and identified as press-release-style routes. HashiCorp's `/en/blog/all` and robots route returned HTTP 429, while its English sitemap and legacy feed were accessible. Most Fastly, Cloudflare and HashiCorp publication dates remain unknown; sitemap modification times are never relabeled as publication times. Fly's single archive lists 199 items against 202 scoped sitemap routes, and its feed dates only 40 recent entries.

## New reads and transferred guidance

[deep-design.md](deep-design.md) and [deep-design.json](deep-design.json) contain AWS static stability, Google SLO/cost design and Grafana telemetry gateway design. They include complete text-reading scopes, image/implementation limits, twelve current documentation/maintainer checks and one historical example-policy section check.

[config-distribution.md](config-distribution.md) and [config-distribution.json](config-distribution.json) cover Datadog's local configuration replicas, continuously exercised snapshot/update paths and startup readiness, crosschecked against current Kafka delivery/compaction constraints. Their snapshot-watermark, deletion and local state/offset checks are explicit engineering transfers; the article does not disclose those protocols.

The six-dimension cards distinguish trigger, problem, mechanism, limits, counterexample and verification. Proposed verification scenarios were not executed. No archive-wide body crawl, production action, model run, runtime benchmark or new skill package was performed.

The implemented changes deepen existing owners: prepared survivor capacity in `microservice-operations/references/capacity.md`, plus conditional configuration-distribution guidance and navigation in `infrastructure-change-safety`. Root owns integration of the operations source ledger. [implementation.json](implementation.json) records changed paths and checks.

## Collector source

The [collector guide](collector/README.md) describes the metadata collectors and final provenance checks. Requests are paced to at most one per second per host, with 8/25-second connect/read timeouts. Fetched HTML/XML/API bodies are transient and discarded. Collectors retain titles, URLs, dates, scope and request metadata; extracted metadata is not a claim of article comprehension. Dependencies are the already available Python `requests` and `beautifulsoup4` libraries.

Run the collectors against a fresh output directory for a new dated snapshot; their pagination sizes and API capabilities must be rechecked when publisher interfaces change. The source includes the discovery and normalization logic used here; excluded probe errors are retained in coverage instead of body-bearing scratch exports.
