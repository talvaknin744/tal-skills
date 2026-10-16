# MongoDB blog refresh, 2026-10-14

Default root company blog URLs from the complete publisher declared blog sitemap, public blog API records and the verified historical inventory. Localized duplicate trees and nonblog nodes remain outside this discovery scope.

The machine readable [mongodb report](mongodb.json) binds the current crawler summary and external evidence receipts by SHA256. Historical evidence is preserved. Automatic extraction is separate from deliberate reading.

| Counter | Value |
| --- | --- |
| baseline records | 1408 |
| known urls | 1418 |
| processed urls | 1418 |
| http article attempted urls | 1418 |
| body retrieved urls | 1416 |
| body extracted | 1414 |
| body fetched unextracted | 2 |
| pending | 0 |
| article scope count | 1418 |
| excluded nonarticle count | 0 |
| read articles | 1 |

Processed URLs include every terminal disposition, including exclusions and robots restrictions. HTTP article attempts count distinct requested article URLs in the transport ledger. Retrieved bodies count only extracted or fetched unextracted body dispositions. The single deliberately read article is independent of those automated counts.

Finite blog sitemap traversal reaches its terminal XML document. Publisher client code uses cumulative result limits, and current API probes confirm 12 and 24 results but clamp a request for 3267 to 50. Page, offset and skip alternatives repeat that frontier. The advertised total remains unresolved.

Reading and candidate addition: [Formal methods for transaction isolation and permissiveness](https://www.mongodb.com/company/blog/engineering/formal-methods-beyond-correctness-isolation-permissiveness-distributed-transactions). The article composes a distributed transaction model with an explicit storage engine contract and checks isolation using committed transaction histories. It separately measures permissiveness, the allowed histories relative to those permitted by the chosen isolation definition. A safety pass can therefore coexist with unnecessary blocking or aborts. This supports a small `concurrency-correctness` or `failure-oriented-testing` addition: name the modeled interface assumptions, validate them against the real adapter and measure independent progress alongside safety.

Proposed, unexecuted: an implementation preserves the claimed isolation by serializing all disjoint transactions. The safety oracle passes, while a separate progress comparison detects unnecessary contention. An adapter that violates the modeled prepare visibility contract must fail conformance even if the abstract model passes.

The article and its substantive textual explanation were read. Linked TLA+ sources, the paper, production transactions and model checker were not run. No general database isolation setting or permissiveness benchmark is certified.

Remaining coverage: The public posts API advertises 3267 records, increases returned results from 12 to 24, but clamps large cumulative limits at 50. Page, skip and offset probes retain the same identities. The sitemap is finite but does not establish enumeration of that advertised total. The publicly linked client bundle was inspected to establish intended cumulative limit behavior. Its resource find endpoint returns a different node collection, not proof of missing blog archive coverage. Redirects to product or collection pages are retained as unresolved article bodies. Deleted and unavailable historical URLs remain recorded. Most sitemap title and publication metadata still requires article inspection; last modification is never substituted for publication.

No skill behavior was changed in this publisher report. Its proposed checks remain unexecuted, and no host or production guarantee is claimed.

Evidence integrity audits verify preserved objects and bookkeeping, separately from article completeness or behavior. Earlier receipts with missing recorded byte counts retain that omission; the auditor derives sizes only after verifying their stored object hashes. Every automatic main container extraction still requires article identity review before stronger content claims.
