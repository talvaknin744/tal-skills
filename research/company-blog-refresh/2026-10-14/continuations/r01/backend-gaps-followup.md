# Backend publisher gap followup, October 14, 2026

The remaining supported Dropbox category feeds recovered 35 more original body gaps. Across the two additive rounds, 80 original gaps have been recovered. The first report, source snapshots and v1 extraction files remain unchanged. The remaining original gap count across these three publishers is 679.

| Publisher | New body recovery | Cumulative recovery | Remaining original gaps | Source disposition |
| --- | ---: | ---: | ---: | --- |
| Airbnb | 0 | 21 | 42 | 95 tag feeds plus cached publication feed, 92 deferred on shared Medium rate limit |
| Doordash | 0 | 0 | 342 | 15 grounded category feeds, one HTTP 403 and 14 deferred |
| Dropbox | 35 | 59 | 295 | All eight category feeds plus global RSS consumed |

## Source frontier and overlap

Dropbox consumed six additional ordinary feeds for [Application](https://dropbox.tech/application/feed), [Culture](https://dropbox.tech/culture/feed), [Frontend](https://dropbox.tech/frontend/feed), [Machine Learning](https://dropbox.tech/machine-learning/feed), [Mobile](https://dropbox.tech/mobile/feed) and [Security](https://dropbox.tech/security/feed). Infrastructure, Developers and global RSS remain cached from the first round. The 59 new feed entries in this round contain 19 overlaps with original retrieved bodies, five overlaps with first round recovery, and 35 new original gap bodies. Exact recovered slugs, source URLs, response hashes and text hashes appear in the companion JSON. No new scoped article URL appeared.

Airbnb follows the documented [publication tag feed scheme](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics), grounded by retained first party tags. The team coordinated a shared request gate before traversal. Pinterest then observed three HTTP 429 responses, so Airbnb made no new Medium request. The 92 unrequested tag sources are explicitly deferred by coordination. Their individual access remains unobserved. The companion JSON binds the shared response bytes and stop ledger.

DoorDash category slugs come from the retained official Engineering taxonomy. The [documented WordPress category feed scheme](https://wordpress.com/support/feeds/) grounds those routes. Its [Engineering feed](https://careersatdoordash.com/category/engineering/feed/) returned HTTP 403. Fourteen other grounded routes remain deferred without endpoint variants or retry loops.

## Preserved correction and parsing limits

Independent audit identified two first round Dropbox extraction rows with zero text. Their cached encoded HTML contains positive AEM prose: SwiftyDropbox has 116 words and OpenID Connect has 95 words. The v1 generic extractor applied a 120 word threshold. V2 extracts text within the verified publisher supplied AEM content. Both positive text hashes are recorded beside the preserved empty text hashes. This correction adds no network recovery and does not remove or relabel the original failed extraction evidence.

The Security feed contains a nested CDATA code example and fails strict XML parsing. Extraction retained the unchanged response and separately segmented all ten outer item and content fields with matching opening and closing counts. This is a recorded source parse limitation. Raw HTML retains the original code and figures, while automatic text can omit unescaped code markup and rendered media.

## Evidence and remaining work

All 111 protected first round files retain their hashes. Fresh transport receipts, encoded body hashes, extracted text hashes, duplicate accounting and both positive text corrections passed local byte checks. No instruction behavior changed, no behavioral evaluation ran and no additional deliberate research read is claimed.

Dropbox category frontier closure does not establish historical completeness because the feeds expose recent snapshots without historical pagination. Airbnb requires a change in shared host availability before the preserved tag frontier can be requested. DoorDash source access remains blocked in the observed route. Author names without explicit profile identifiers were not converted into guessed feeds.
