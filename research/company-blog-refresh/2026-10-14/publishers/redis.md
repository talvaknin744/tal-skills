# Redis blog refresh, 2026-10-14

All declared root blog sitemaps, published public blogPost CMS records and the verified historical inventory. Category landing pages are separately retained as excluded article candidates.

The machine readable [redis report](redis.json) binds the current crawler summary and external evidence receipts by SHA256. Historical evidence is preserved. Automatic extraction is separate from deliberate reading.

| Counter | Value |
| --- | --- |
| baseline records | 1122 |
| known urls | 1147 |
| processed urls | 1147 |
| http article attempted urls | 30 |
| body retrieved urls | 1124 |
| body extracted | 1122 |
| body fetched unextracted | 2 |
| pending | 0 |
| article scope count | 1125 |
| excluded nonarticle count | 22 |
| read articles | 1 |

Processed URLs include every terminal disposition, including exclusions and robots restrictions. HTTP article attempts count distinct requested article URLs in the transport ledger. Retrieved bodies count only extracted or fetched unextracted body dispositions. The single deliberately read article is independent of those automated counts.

The current published CMS query enumerates 1124 blogPost records in five full 200 record batches and a final 124 record batch. Count and returned row totals match. Raw CMS body fields and conversion omissions remain external. Root blog sitemap category routes are excluded from the article cohort. The CMS prose conversion import labels are local bookkeeping aliases, while actual publisher source query URLs and raw response hashes are preserved in the linked external evidence ledger.

Reading and candidate addition: [Semantic cache optimization](https://redis.io/blog/10-techniques-for-semantic-cache-optimization/). The article tunes semantic thresholds using false match tradeoffs, applies tenant and contextual filters before similarity matching and combines exact matching with semantic reuse. A useful candidate addition is to an AI correctness or caching reference: validate accepted false matches separately from hit rate and enforce the exact reuse scope before approximate lookup. The proposed permission, source version and model version namespace checks are engineering inferences beyond the article, to be verified for the selected service.

Proposed, unexecuted: similar account questions come from different tenants, then permission and policy change. Reject wrong identity or stale scope despite a high similarity score, while allowing an approved same scope paraphrase. Report correct accepted answers and latency rather than hit rate alone.

No LangCache API, threshold default, cost benchmark or permission enforcement was executed. Current conventional cache references already cover coherence, origin protection and persistence, so this is a narrower semantic reuse boundary candidate.

Remaining coverage: The CMS raw article bodies retain all content fields. Converted text covers Portable Text spans, code, tables, quotes and accordion descriptions; images, videos, embeds, buttons and linked references remain outside the prose extraction. Short or empty CMS entries need independent canonical page extraction. Current root language paths include a publisher test record; exposed metadata is not editorial endorsement. Deleted, private and unlinked posts outside declared sitemap and published CMS collections remain unknown.

No skill behavior was changed in this publisher report. Its proposed checks remain unexecuted, and no host or production guarantee is claimed.

Evidence integrity audits verify preserved objects and bookkeeping, separately from article completeness or behavior. Earlier receipts with missing recorded byte counts retain that omission; the auditor derives sizes only after verifying their stored object hashes. Every automatic main container extraction still requires article identity review before stronger content claims.
