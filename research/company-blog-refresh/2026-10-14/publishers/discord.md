# Discord blog refresh

Checked 2026-10-14. The preserved baseline contains 162 unique URLs. Current selected publisher surfaces expose 353 unique URLs, including 192 additions. The crawl union contains 354 URLs. Two substantive articles were deliberately read. Automatic body extraction and deliberate reading are separate counts.

## Discovery and body coverage

Root English blog and all six exposed category collections, plus current publisher declared RSS, unioned with the preserved historical engineering and RSS inventory. Localized, developer documentation and nonblog routes are excluded.

All root exposed category collections, root blog collection and current RSS consumed; Load More only reveals preexisting DOM rows. Whole historical blog completeness remains unproved.

The [published Load More script](https://discord.com/webflow-scripts/blogFeaturedArticles.js) only reveals existing DOM items. Root and all six linked category collections were exhausted as exposed HTML sets. That demonstrates the visible collection boundary, not every article ever published.

Exact body statuses, source response hashes, selected reading hashes and the crawler summary identity are recorded in [discord.json](discord.json). Raw responses, failed attempts and extraction history remain outside the source tree under the shared crawl archive. Historical inventories are preserved.

## Useful additions and limits

The [WebSocket compression investigation](https://discord.com/blog/how-discord-reduced-websocket-traffic-by-40-percent) initially compared stateless zstandard to stateful zlib. Matching streaming context changed the conclusion. Its dictionary and dynamic buffer proposals were then abandoned when measured benefit failed to justify memory and compatibility complexity. This supports `performance-diagnosis` and `load-testing`: align state lifetime, cache or dictionary context and workload before comparing a replacement; measure byte distributions and native memory as well as message counts. The proposed discriminator uses identical small messages with retained versus fresh compression contexts and verifies that the reported comparison discloses that difference. Published metrics and client rollout were not reproduced.

The [Go to Rust migration](https://discord.com/blog/why-discord-is-switching-from-go-to-rust) connects a large retained LRU structure, historical collector scans, cache misses and end to end latency. This supports a runtime attribution addition to `performance-diagnosis`: trace retained live state and allocation rate separately, identify the cache miss tradeoff, and compare the candidate under pinned runtime and matched workload. A proposed discriminator reduces a cache to improve collection time while worsening user latency through extra database reads. The source explicitly concerns Go 1.8 through 1.10 and a 2019 port. It does not establish current language rankings, and no migration or benchmark was reproduced.

## Verification scope

All selected sitemap or feed bodies and exposed archive collections were parsed. Source receipts retain status, byte size and SHA256. Article readings include substantive prose, code illustrations and limitations; illustrations and published experiment results were not executed except the explicitly identified safe Snyk source check. No skill behavior change or model evaluation was performed by this publisher research. Any future adoption must run relevant historical cases plus focused trigger, nontrigger and changed boundary evaluations against an identified candidate.
