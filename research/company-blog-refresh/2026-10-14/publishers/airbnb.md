# Airbnb publisher refresh, October 14, 2026

## Coverage and evidence

Current airbnb.tech public posts plus the preserved Medium publication URL frontier and current publication feed. The current site and the legacy publication remain separate archive boundaries.

Current airbnb.tech posts API reports 48 posts and one page. Its blog HTML contains the same 48 permalinks. Page 2 returns HTTP 400 with rest_post_invalid_page_number. The legacy Medium feed does not provide a historical terminal.

| Observation | Count |
| --- | --- |
| baseline records | 71 |
| known urls | 121 |
| processed urls | 121 |
| body extracted | 58 |
| body fetched unextracted | 0 |
| pending | 0 |
| read articles | 2 |
| http article attempted urls | 53 |
| body retrieved urls | 58 |
| policy deferred urls | 58 |

Counts are a receipt bound snapshot. Processed URLs include policy dispositions without an individual article HTTP request. Embedded feed bodies count as retrieved without an article HTTP request. Fetching and extraction do not establish deliberate reading. The companion JSON identifies every deliberately read source, discovery receipt and source hash. Raw HTML, full extracted text and failed attempts remain outside the repository. Automatic extraction may include ancillary prose and does not establish diagram, media or linked resource coverage.

## Findings and useful additions

The current official [Airbnb tech blog](https://airbnb.tech/blog/) closes a discovery gap left by the earlier Medium only survey. Current posts and legacy Medium URLs are preserved together without claiming that the new site proves historical migration completeness.

The [database capture and replay article](https://airbnb.tech/infrastructure/beyond-synthetic-testing-capturing-and-replaying-real-database-workloads-at-airbnb/) preserves transaction order, query timing and concurrent replay starts. It separates load replay from result comparison against two databases restored from the same snapshot. Generated identifier rewriting stabilizes comparison but removes coverage of the target's own identifier generation. Add these mechanisms to load-testing and database-performance: record the snapshot, preserved transaction and timing properties, result normalization and deliberately untested behavior. Captured SQL must follow its actual production data access policy; the account describes restricted production equivalent targets. Its performance observations are examples, not forecasts.

Proposed evaluation, unexecuted: a database upgrade plan must preserve transaction boundaries and explicit ordering when comparing results. Nontrigger: an isolated synthetic benchmark stays a synthetic benchmark. Changed boundary: replay pins generated IDs, so the candidate must keep native ID generation unresolved and propose a separate check.

The [configuration platform account](https://airbnb.tech/infrastructure/safeguarding-dynamic-configuration-changes-at-scale/) separates rollout decisions from delivery, stages changes, keeps local cached values and provides an auditable emergency portal. Existing configuration-distribution guidance already addresses authority, snapshots, stale updates and freshness. Add emergency changes to the same version and recovery contract rather than inventing another platform skill. The article does not specify an atomic emergency ownership protocol or a universal cache expiry.

Proposed evaluation, unexecuted: an emergency portal value supersedes an in flight rollout, so the older rollout must not silently restore its value. Nontrigger: a static environment variable edit follows ordinary deployment guidance. Changed boundary: stale authorization configuration has an explicit operation bound and cannot be justified solely by cached availability.

## Remaining limits

* Ten Medium publication feed entries expose full content, imported from the already fetched public RSS bytes. This recovers those bodies without proving older feed or archive completeness.
* Legacy Medium lifetime history remains unenumerated. A recent publication feed and a union with the earlier 71 URL inventory do not prove historical archive exhaustion.
* The current site contains 48 public posts. This does not establish that every historical Medium post was migrated. Mirrored Medium and current site URLs are distinct transport URLs and are not asserted to be distinct intellectual articles.
* Current sitemap requests redirect to unavailable wp-sitemap.xml. Current post enumeration is independently bounded by API totals and terminal pagination.
* Initial current site body attempts hit the collector redirect normalization bug. Failed attempts are retained.

All behavioral cases above are proposed and unexecuted. This publisher task changed research records only. It does not claim a revised skill passed any host evaluation.
