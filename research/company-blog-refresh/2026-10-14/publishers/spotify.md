# Spotify publisher refresh, October 14, 2026

## Coverage and evidence

Current public engineering blog inventory and article paths. API creation and archive dates do not independently prove every publication date.

The initial API inventory has 289 records across offsets 0, 100 and 200. Offset 300 returns an empty successful response. The nonempty responses report 289, while the terminal empty response reports zero, as in the earlier collector behavior.

| Observation | Count |
| --- | --- |
| baseline records | 288 |
| known urls | 289 |
| processed urls | 289 |
| body extracted | 278 |
| body fetched unextracted | 11 |
| pending | 0 |
| read articles | 1 |
| http article attempted urls | 289 |
| body retrieved urls | 289 |
| policy deferred urls | 0 |

Counts are a receipt bound snapshot. Processed URLs include policy dispositions without an individual article HTTP request. Embedded feed bodies count as retrieved without an article HTTP request. Fetching and extraction do not establish deliberate reading. The companion JSON identifies every deliberately read source, discovery receipt and source hash. Raw HTML, full extracted text and failed attempts remain outside the repository. Automatic extraction may include ancillary prose and does not establish diagram, media or linked resource coverage.

## Findings and useful additions

The refreshed inventory has one additional locator relative to the earlier 288 records. The added October article was discovered as metadata and is not counted as a deliberate read.

The [quality and velocity article](https://engineering.atspotify.com/2026/9/ai-changed-how-spotify-builds-what-we-learned-and-fixed-about-quality-at-higher-velocity) describes silent content processing failures, background work competing with fresh uploads, an automated upgrade that passed checks but failed in production, and regional failover under constrained spare capacity. Its changes include business completion monitoring, priorities, broader rollback coverage and owner availability. Add the resulting checks to existing operations, overload and infrastructure change skills. Treat its internal attribution and measurement as observations from Spotify, not a general proof of AI quality or a capacity guarantee for another fleet. The account explicitly keeps regional spillover work in progress.

Proposed evaluation, unexecuted: successful queue acceptance with stuck user publishing must leave business completion unresolved. Nontrigger: a synchronous local helper change does not acquire a fleet rollout process. Changed boundary: a receiving region has insufficient capacity, so failover needs protected class admission and gradual load transfer rather than an unconditional full shift.

## Remaining limits

* The robots response was reviewed after the initial API discovery probe and disallows /api/. No further API requests were made after observing this rule; article paths remain the body crawl scope. This timing and access policy limit is retained.
* Archive URL dates and API createdAt values remain unverified publication dates unless article or feed evidence independently establishes publication.
* Initial successful body fetches missed the actual HTML article container. Local extraction repair preserved original receipts without refetching article content. Eleven multimedia teaser pages expose only 16 to 82 body words, below the extraction threshold; linked audio and video were not transcribed.

All behavioral cases above are proposed and unexecuted. This publisher task changed research records only. It does not claim a revised skill passed any host evaluation.
