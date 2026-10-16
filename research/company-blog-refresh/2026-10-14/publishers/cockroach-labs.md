# Cockroach Labs blog refresh, 2026-10-14

Official blog sitemap, complete ordinary archive pagination and verified historical inventory. Blog root and engineering or culture category landing pages are distinct from article bodies.

The machine readable [cockroach-labs report](cockroach-labs.json) binds the current crawler summary and external evidence receipts by SHA256. Historical evidence is preserved. Automatic extraction is separate from deliberate reading.

| Counter | Value |
| --- | --- |
| baseline records | 901 |
| known urls | 908 |
| processed urls | 908 |
| http article attempted urls | 908 |
| body retrieved urls | 904 |
| body extracted | 904 |
| body fetched unextracted | 0 |
| pending | 0 |
| article scope count | 905 |
| excluded nonarticle count | 3 |
| read articles | 1 |

Processed URLs include every terminal disposition, including exclusions and robots restrictions. HTTP article attempts count distinct requested article URLs in the transport ledger. Retrieved bodies count only extracted or fetched unextracted body dispositions. The single deliberately read article is independent of those automated counts.

The refreshed ordinary archive returns nine records on page 90, two on page 91 and zero on both pages 92 and 93. Generic Next controls continue beyond content. The finite sitemap and this explicit empty continuation proof establish only the exposed collection. Blog root, engineering and culture routes are listing pages.

Reading and candidate addition: [Physical cluster replication and atomic recovery](https://www.cockroachlabs.com/blog/disaster-recovery-physical-cluster-replication/). The article allows replication partitions to advance independently, records the minimum fully applied timestamp and removes newer MVCC changes before activating a consistent standby. A partition checkpoint alone can therefore coexist with a partially applied transaction. The narrow owning reference is `recovery-validation/references/recovered-history.md`: establish a globally complete cut and any supported activation cleanup before admitting the recovered service.

Proposed, unexecuted: debit and credit changes replicate in different partitions, one advances and the other stalls. Recovery activation must expose both effects or neither at the selected complete cut, then test interruption during activation.

The source is a historical implementation account. No CockroachDB cluster, retention configuration, current activation command or model was executed. The MVCC cleanup mechanism is product specific and is not a procedure to copy to an unrelated database.

Remaining coverage: Sitemap and ordinary archive can disagree. Retain their union and every currently failing historical URL. Completion applies to exposed sitemap and archive pages, rather than deleted or unpublished history.

No skill behavior was changed in this publisher report. Its proposed checks remain unexecuted, and no host or production guarantee is claimed.

Evidence integrity audits verify preserved objects and bookkeeping, separately from article completeness or behavior. Earlier receipts with missing recorded byte counts retain that omission; the auditor derives sizes only after verifying their stored object hashes. Every automatic main container extraction still requires article identity review before stronger content claims.
