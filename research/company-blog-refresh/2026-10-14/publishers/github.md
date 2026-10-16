# Github publisher refresh, 2026-10-14

Official English Engineering category 72 and its five direct child categories, enumerated through both declared WordPress API pages.

Two official API pages contain 100 and 76 records. The `X-WP-Total` header is 176 and `X-WP-TotalPages` is 2. Categories API supplies five children of category 72.

The current crawl frontier contains 176 URL identities. 176 have a frontier disposition, 0 were attempted over article HTTP, 176 have a fetched response or published body import, 176 have automatic body extraction, 0 are fetched without substantive extraction, and 0 remain pending. Deliberate reading covers 2 articles or explicitly named body sections. Automatic extraction and metadata discovery are not article reading.

[Context aware replica pools](https://github.blog/engineering/infrastructure/context-aware-mysql-pools-via-haproxy/) shows that excluding lagging replicas can concentrate load on the remaining replicas until they lag too. Its backup pool trades freshness for capacity, so a portable design must first identify which reads permit stale results. This reinforces the boundary between `capacity-planning` and `concurrency-correctness`; it does not justify routing a read with a required revision to an arbitrary stale replica.

[Git infrastructure for agent development](https://github.blog/engineering/architecture-optimization/building-git-infrastructure-for-agent-scale-development/) separates reference agreement, immutable object work, background maintenance, durable storage and serving compute. It offers a concrete example for existing distributed system and background maintenance guidance. The article describes an ongoing architectural rebuild and internal benchmarks, so it does not establish a completed migration or a general production throughput guarantee.

The companion JSON binds counts to the external crawler summary hash, verified historical inventory and coverage hashes, source terminal receipts, collector identities and deliberate reading evidence. Raw bodies, crawl logs and prior attempts remain outside the source tree.

Remaining limits:

- Engineering category and direct children are exhausted by official API totals. Unlisted or removed posts cannot be established. English category membership is the scope filter.
- Full body evidence is imported from two public official API responses. Import receipt objects point to embedded body hashes; original HTTP 200 response receipts are retained separately.
- The first import attempt failed because query equals signs confused the argument parser. That partial attempt remains in the crawl log.
- Early collector run hashes were recorded without an exact source snapshot. Later cache finalization archives executed collector source, while early implementation reconstruction remains a gap.
