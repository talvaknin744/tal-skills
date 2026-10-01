# Independent follow-up review — 1 October 2026

The frozen research batch has **no open actionable findings on the bytes below**. It is suitable for publication as research and proposed enrichment of existing references. This review does not approve unpublished skill instructions or transfer earlier native scores. The [structured review](review.json) records exact scopes, corrections, arithmetic and hashes.

The [synthesis](README.md) and [selected manifest](selected-readings.json) agree with the four source ledgers: **10 substantive works = 6 papers + 4 articles**. Coordination contributes 1/1, scheduling 2/1, schema 1/2 and clocks 2/0 papers/articles. The separate book ledger records **4 sources, 3 complete chapters, 0 full books**. Current contract checks remain separate (9 scheduling, 7 schema and 6 clock records; these are records, not a count of pages). File inventories confirm the synthesis’s 49 skills, 15 agents and 8 workflows. Publication checkpoint/test/installation claims match the linked recorded evidence; those operations were not rerun by this reviewer.

## Corrections retained

1. **Closed P2 — stale backfill across delete/recreation.** The draft’s identity/revision guard could match a recreated row with a reused revision, overwriting its newly acknowledged value. The final [schema example](schema-evolution.md) requires an immutable non-reused incarnation and revision from one row snapshot, and includes the explicit adverse schedule. Narrow rereading verifies the logical correction; the migration remains unexecuted.
2. **Closed P3 — Go comparison scope.** The final [clock contract](time-and-clocks.md) names `After`, `Before`, `Equal`, `Compare` and `Sub`, with their monotonic-both-operands rule and wall fallback, and distinguishes `==` stored-representation semantics. This matches the selected [official Go time contract](https://pkg.go.dev/time#hdr-Monotonic_Clocks); no runtime experiment occurred.
3. **Closed scope clarification — F1 figure/table modality.** The ledger now specifies extracted labels, captions and table text. Rendered-pixel inspection is not claimed. This was an auditability clarification, not an established technical mismatch.

**Closed optional wording note, rechecked 1 October:** the clock Markdown and JSON now say `wait()` does not cancel pending tasks on timeout, matching the [Python guarantee](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait). Reversing only that wording replacement reproduces each previous bound hash exactly; the other 12 artifact hashes are unchanged. This narrow recheck ran no model or runtime experiment and does not change the publication verdict.

The author’s additional schema corrections are coherent: same-snapshot readers, rollback through a bridge or restored fallback, an engine-specific maintenance gate before F1 index backfill, and exact expected/actual sets in both directions. The draft history and final locators remain in the structured review. Query compatibility includes stale/unmapped rows before code-only predicates; no index-only freshness guarantee is inferred.

## Independent checks and their limits

The Python 3.14.3 coordination script ran successfully and matched its recorded output. A separate method used integer bitmasks and bitwise OR rather than importing its functions: 8 states, 8 idempotence, 64 commutativity and 512 associativity cases; `1+3+9+27+81 = 121` delivery words. Two locally valid sales merge to stock `-1`; a proper-subset view is stale despite convergence. Sequential reservation admits one sale per order. One unique operation ID versus two naïve effect executions assumes an atomic enforcement boundary, which this model does not test. These bounded interpretations agree with the selected [CALM v2 text](https://arxiv.org/pdf/1901.01930v2) and [Bailis explanation](https://www.bailis.org/blog/when-does-consistency-require-coordination/).

For the book arithmetic, an independent 90-digit Decimal calculation gives `1 − (999/1000)^1000 = 0.632304575229035955…`, while the expected count is `1000 × 0.001 = 1`. The recorded double differs by about `5.54e−17`. Neither expectation nor probability implies a guaranteed daily failure. Equal independent Bernoulli trials are an explicit added model, not a fleet forecast.

A delegated independent endpoint sweep reproduced every [tenant schedule](scheduling-and-isolation.json) metric and checked per-node slots, CPU, memory, arrivals, durations and A’s residency cap. Both schedules cost 34 slot-seconds, 34 reserved CPU-seconds and 68 GiB-seconds. FIFO/protected quiet wait is 7/0, quiet finish 9/2, timely completions 4/6, and common-horizon idle capacity 30 each. These are reservations under fixed-duration, nonpreemptible, failure-free, no-borrowing assumptions. Historical [Borg](https://research.google/pubs/large-scale-cluster-management-at-google-with-borg/) and [Omega](https://research.google/pubs/omega-flexible-scalable-schedulers-for-large-compute-clusters/) studies and the [SQS launch account](https://aws.amazon.com/blogs/compute/building-resilient-multi-tenant-systems-with-amazon-sqs-fair-queues/) are not reproduced service experiments.

An independent algebraic check also matches all recorded clock results: wall remaining `[6,36,30,−24]` versus monotonic `[6,6,0,6]`; before/overlap/after interval predicates; commit-wait false/true; and receive counter 3. Generation 7 rejects only after generation 8 reaches the protected resource. No clock API, OS adjustment, suspend, real lease or Spanner transaction was exercised.

Primary checks used official papers, authors, engineering accounts and selected versioned/pinned documentation. Exact independent scopes are in `source_check_scopes` in the JSON: several papers were checked through selected extracted sections, rather than independently reread in full. PDF lengths/identities and access failures were corroborated; proofs, graph pixels and production evaluations were not reproduced. Book checks verify official sample/access/edition boundaries and selected substance, rather than another full reading of every claimed chapter. DS4’s email/CAPTCHA access barrier remains a gap. Exact-identifier searches found prior Shopify metadata, not an earlier body-reading record; these bounded searches are not an audit of every historical reading.

All JSON parses, selected IDs/URLs/titles/source references and local Markdown links passed. The ten readings, documentation, three chapters, unavailable books, arithmetic and unexecuted schema schedules remain distinct. No unsupported jump from provider documentation to production validation was found on the frozen bytes.

## Proposed destination

The synthesis ranking is supported: online evolution under `infrastructure-change-safety`, resident tenant service under `overload-control`, and clock/merge boundaries under `concurrency-correctness`, with the stated existing secondary owners. Treat these as conditional reference proposals. This batch does not establish demand or discriminating evidence for a new package.

## Frozen artifacts reviewed

| File | SHA-256 |
| --- | --- |
| [README.md](README.md) | `9df26908a2ced6ea8c4ac2b7109243e6de99583c24d7c3e578f2f352dde38e5a` |
| [selected-readings.json](selected-readings.json) | `58386329b2a0125963ceb75186179fcaed3baac500c7bcd23d8d9a84e7b1d694` |
| [book-access.md](book-access.md) | `461fa71e883a447c6ec886ad7007496eba5ba597a07e2515d8cddb16a92feb14` |
| [book-access.json](book-access.json) | `59681364ef363f20d550b3a1aa0c177b9c7109115160a05892ce0392c3804fe7` |
| [coordination-design.md](coordination-design.md) | `75760357085f184b38e1d0b90cdd462f37bde919a15485255d5b309e7e716a0b` |
| [coordination-design.json](coordination-design.json) | `ea68c9a9a02dae97c707e3d9bb25fd6bccc28f45c316e68bb099eb4b42dbaf74` |
| [coordination-oracle.py](coordination-oracle.py) | `db1626274eb202c1ba9ff769a1b1178d7b6b8caaaa42449c6329053b1cd0767e` |
| [coordination-oracle-result.json](coordination-oracle-result.json) | `2cf362ba26bae5eeb1138c4ab4e97111293a13e626343602234570dec32a15f1` |
| [scheduling-and-isolation.md](scheduling-and-isolation.md) | `98584bf988dc10815afd8d1262f411cb91e8b0c9d8f90e92cec2638b0884fe3e` |
| [scheduling-and-isolation.json](scheduling-and-isolation.json) | `c820f7905ee15720c51a8a4565862ae8429a1e9e29413326f1091c4bac8558de` |
| [schema-evolution.md](schema-evolution.md) | `02b3d05ffd39e6f799bb87491b8d97711ca9f16e27bd9f43fc0c53456e2fe8a4` |
| [schema-evolution.json](schema-evolution.json) | `17ff4ca18f5af2bc144f3a1e662d890461a75151f7b0ee28b285742a67eedbb3` |
| [time-and-clocks.md](time-and-clocks.md) | `4e7bd704da24af18d1e747d9581fc6aabfa2e353a7b993a174c3eca9c3cb1016` |
| [time-and-clocks.json](time-and-clocks.json) | `49d4e08acea6578052c1423fd4fecdc2e7502aadccea60996eede5e51e754f4d` |

The review owns only `review.md` and `review.json`. It performed no skill, package, model, configuration, commit or publication change. Changed substantive artifact bytes require a focused recheck.
