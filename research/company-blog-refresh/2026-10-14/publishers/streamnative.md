# StreamNative blog refresh

Research date: 2026-10-14. Candidate identity: `2026-10-14-company-blog-refresh`. No skill behavior or adapter was edited by this publisher pass.

## Crawl evidence

Fresh exposed discovery found 368 article URLs. The preserved baseline contained 365; their union contains 368. The body crawler currently knows 368 URLs, processed 368 frontier dispositions and made HTTP article requests for 368 unique URLs, extracted 368 substantive bodies, fetched 0 additional responses without accepted text extraction, and retains 0 pending requests. Deliberate complete textual readings: 1 articles. Automatic fetch and extraction do not count as reading.

Discovery traversed 3 sitemap, feed, archive, or structured collection pages. All included finite urlsets and feeds parsed, and every exposed archive next link reached a page with no next link. No article count or pagination cap established completion. The current Nuxt build identifier was recovered from the public archive HTML and its complete non-draft listing array was exhausted.

[The compact receipt](streamnative.json) binds current summary and terminal discovery hashes. Raw bodies, extraction events, failed attempts, and endpoint snapshots stay in the external evidence root `/tmp/tal-skills-blog-crawl-2026-10-14`. The shared body crawler does not claim discovery completion; this pass separately records publisher-specific terminal evidence.

## Relevant additions

The [transaction buffer snapshot comparison](https://streamnative.io/blog/a-comparison-of-transaction-buffer-snapshot-strategies-in-apache-pulsar) explains how long retention and aborted transactions can enlarge a single snapshot and amplify writes. Segmented snapshots bound each snapshot entry, but the article reports that both tested strategies eventually reached an out of memory limit. Some elapsed time descriptions disagree. Its headline ratios therefore establish neither bounded memory nor a current production guarantee.

Existing `capacity-planning`, `performance-diagnosis`, or `recovery-validation` can use this as a sustained state growth and restore-cost example. Proposed verification: run an explicit transaction abort, retention, and backlog mix long enough to expose memory slope; measure entry size, snapshot bandwidth, GC pauses, and restart loading separately. Include retention expiry and historical transaction state in the recovery oracle. A smaller snapshot write does not prove lower total retained state or correct restore. Current product eligibility and on-demand loading status remain unresolved. The complete textual report, benchmark configuration, analysis, and future-work section were read. Chart pixels were not inspected, configurations were not applied, and no Pulsar benchmark ran.

## Limits and disposition

Discovery establishes exposed current publisher collections, not every article ever published. Deleted, private and unlisted articles remain outside this proof. Automatic extraction is separate from deliberate reading. All unread article bodies remain a reading coverage gap. The shared crawler used bodies-only mode. Its discovery_complete field is false; publisher-specific terminal discovery is bound separately in this receipt. Initial sitemap probes hit an unavailable BeautifulSoup XML parser. The raw responses and failed probe records were retained, and subsequent ElementTree discovery parsed them successfully. Recommendations and failure schedules remain proposed, with no independent behavior score. Existing skill ownership is preferred; these readings alone do not justify another promoted skill.
