# Meta blog refresh, 2026-10-14

Public WordPress engineering post collection, its declared post sitemaps and verified historical inventory. Linked canonical publisher URLs remain in scope; attachment sitemaps and technical navigation are classified separately.

The machine readable [meta report](meta.json) binds the current crawler summary and external evidence receipts by SHA256. Historical evidence is preserved. Automatic extraction is separate from deliberate reading.

| Counter | Value |
| --- | --- |
| baseline records | 1126 |
| known urls | 4609 |
| processed urls | 4609 |
| http article attempted urls | 296 |
| body retrieved urls | 1128 |
| body extracted | 1109 |
| body fetched unextracted | 19 |
| pending | 0 |
| article scope count | 1131 |
| excluded nonarticle count | 3478 |
| read articles | 1 |

Processed URLs include every terminal disposition, including exclusions and robots restrictions. HTTP article attempts count distinct requested article URLs in the transport ledger. Retrieved bodies count only extracted or fetched unextracted body dispositions. The single deliberately read article is independent of those automated counts.

The current WordPress API advertises 1131 posts across 12 pages. All full content pages were retained. Attachment sitemap discovery and eight technical navigation URLs were reviewed and excluded from the article cohort without removing their prior events.

Reading and candidate addition: [Cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/). The article measures client observable freshness by convergence timescale, retries ambiguous samples before expensive authoritative checks and traces state changes near invalidation races. This complements the existing version, eviction and payload pairing checks in `concurrency-correctness/references/cache-coherence.md`. The small addition is to define the observed invariant, reporting timescale, authoritative comparison budget and transient versus persistent classification. The reported consistency result belongs to the historical deployment, rather than a portable guarantee.

Proposed, unexecuted: a sample initially misses the cache after an invalidation, then a newer deletion appears in authority. The monitor must avoid a stale false positive, stay within its authority query budget and report a genuinely stale entry after the declared convergence bound.

The source is already cited by the existing skill. This is a monitoring detail addition candidate, not evidence for a separate cache skill or a new consistency guarantee.

Remaining coverage: Linked canonical pages with empty or short WordPress content require their own body retrieval and extraction. Short notices and media can remain unextracted. Deleted, private and unlinked posts outside the exposed post collection are not established.

No skill behavior was changed in this publisher report. Its proposed checks remain unexecuted, and no host or production guarantee is claimed.

Evidence integrity audits verify preserved objects and bookkeeping, separately from article completeness or behavior. Earlier receipts with missing recorded byte counts retain that omission; the auditor derives sizes only after verifying their stored object hashes. Every automatic main container extraction still requires article identity review before stronger content claims.
