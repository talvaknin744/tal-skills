# Netflix publisher refresh, 2026-10-14

Current official publication sitemap and recent RSS, reconciled with all 219 preserved historical URL identities and three older article references found inside the published feed bodies. Historical archive enumeration remains blocked.

Complete current sitemap urlset and RSS with ten entries feed consumed. Historical archive returns HTTP 403, so lifetime discovery is unresolved.

The current crawl frontier contains 222 URL identities. 222 have a frontier disposition, 212 were attempted over article HTTP, 10 have a fetched response or published body import, 10 have automatic body extraction, 0 are fetched without substantive extraction, and 0 remain pending. Deliberate reading covers 2 articles or explicitly named body sections. Automatic extraction and metadata discovery are not article reading.

[The Flink autoscaler article](https://netflixtechblog.com/a-tale-of-two-flink-autoscalers-e9f6a1b1492b) supports a focused addition to `stream-processing-design`: inspect vertex busyness and backpressure, preserve coupled parallelism across forward edges, check fixed sink capacity, and include state restore plus rebuilt metric windows in a rescale decision. Netflix implemented some safeguards in a private fork, so the article cannot establish upstream support or universal parameter values. A useful evaluation would present a job bounded by sink capacity where independent vertex scaling introduces a shuffle, and require checking the installed engine before recommending a rescale.

[The topology article](https://netflixtechblog.com/building-service-topology-at-scale-architecture-challenges-and-lessons-learned-f4b792f3f0d8) reinforces existing performance diagnosis and stream state guidance: aggregate before redistribution, measure key skew and retained object lifetime, and distinguish topology layers with different observation coverage. These are enrichment candidates rather than evidence for a new generic performance skill.

The companion JSON binds counts to the external crawler summary hash, verified historical inventory and coverage hashes, source terminal receipts, collector identities and deliberate reading evidence. Raw bodies, crawl logs and prior attempts remain outside the source tree.

Remaining limits:

- Pre 2020 archive remains unresolved. The archive endpoint returns HTTP 403. Feed exposes ten recent entries with no continuation.
- Known article HTTP 403 dispositions remain unresolved; the exact count is reported in article_status_counts. Ten full article bodies are available legitimately in the official RSS. No access restriction was bypassed.
- The refreshed sitemap exposes the same 219 article identities as the historical inventory. All 20 internal article references from the ten full feed bodies were also inspected, adding three unlisted older article URLs.
- Sitemap modification dates are not publication dates. The historical archive predating the exposed inventory remains unresolved.
- Early collector run hashes were recorded without an exact source snapshot. Later cache finalization archives executed collector source, while early implementation reconstruction remains a gap.
