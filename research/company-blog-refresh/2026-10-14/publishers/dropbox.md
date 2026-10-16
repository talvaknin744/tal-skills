# Dropbox publisher refresh, October 14, 2026

## Coverage and evidence

All public article permalinks in the accessible all-stories archive reconciled against the official sitemap. Navigation, authors and configuration pages are excluded.

The single all-stories page exposes 410 distinct article links, all present among 722 sitemap loc entries. The urlset has no child sitemap or continuation. Remaining 312 entries are nonarticle paths under the same historical exclusion boundary.

| Observation | Count |
| --- | --- |
| baseline records | 410 |
| known urls | 410 |
| processed urls | 410 |
| body extracted | 54 |
| body fetched unextracted | 2 |
| pending | 0 |
| read articles | 1 |
| http article attempted urls | 410 |
| body retrieved urls | 56 |
| policy deferred urls | 0 |

Counts are a receipt bound snapshot. Processed URLs include policy dispositions without an individual article HTTP request. Embedded feed bodies count as retrieved without an article HTTP request. Fetching and extraction do not establish deliberate reading. The companion JSON identifies every deliberately read source, discovery receipt and source hash. Raw HTML, full extracted text and failed attempts remain outside the repository. Automatic extraction may include ancillary prose and does not establish diagram, media or linked resource coverage.

## Findings and useful additions

The current archive matches the preserved 410 record metadata baseline. Article URLs were fetched separately rather than treating archive metadata as body reading.

The [sync testing account](https://dropbox.tech/infrastructure/-testing-our-new-sync-engine) makes replay depend on both explicit scheduling input and code identity. Its convergence check needs additional preservation invariants because deleting every tree can also converge. Deterministic mocks provide fast schedule exploration, while native filesystem and real network checks cover different boundaries at reduced determinism. Even the native mode does not establish reboot durability or every operating system interleaving. Existing failure-oriented-testing already covers state models and retained counterexamples. Add a concise destructive convergence example and boundary matrix rather than a duplicate skill.

Proposed evaluation, unexecuted: a sync implementation converges to empty state after deleting a remote only file, so equality alone must not count as correctness. Nontrigger: a stateless parser has no sync lifecycle. Changed boundary: an in memory filesystem simulation cannot establish fsync durability through reboot, and that claim remains an unexecuted native experiment.

## Remaining limits

* The first network crawl retained 354 HTTP 202 responses containing an AWS WAF challenge, separate from substantive article retrieval. No challenge bypass was attempted.
* The current accessible archive does not prove presence of deleted or migrated historical posts.
* Robots returns HTTP 404. No accessible robots instructions were inferred from an error page.
* Initial successful article fetches missed the site specific body container. Local extraction repair retains original network bytes and receipts. Two public short posts expose 61 and 81 body words, below the extraction threshold; their raw substantive introductions are still retrieved.

All behavioral cases above are proposed and unexecuted. This publisher task changed research records only. It does not claim a revised skill passed any host evaluation.
