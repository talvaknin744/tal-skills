# Cloudflare Blog crawl and skill research

Snapshot date: 2026-10-14. All known body targets have a latest classification. Automatic extraction and deliberate reading are separate evidence states.

| Baseline records | Live discovered | Known body targets | Classified targets | Extracted | Fetched without extraction | Pending | Deliberately read |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 3641 | 3663 | 3663 | 3663 | 3620 | 42 | 0 | 3 |

English/default single segment Cloudflare Blog article routes in official post sitemap, excluding translation routes, author/tag/archive pages.

Discovery terminal: `{"reason": "all declared sitemap branches exhausted", "sitemap_pages": 6, "root": "https://blog.cloudflare.com/sitemap.xml"}`. Request response hashes and full raw receipts remain in the external archive; [cloudflare.json](cloudflare.json) binds the crawler summary and discovery proof. Live URL discovery is reconciled with the retained historical inventory.

## Potential improvements

The [Hyperdrive MySQL account](https://blog.cloudflare.com/hyperdrive-mysql/) shows a shared cache storing writer specific wire formats under one query identity. Opposite producers and consumers disagreed about EOF/OK capabilities, producing empty results or hangs. Canonical internal bytes plus translation at delivery repaired that mismatch. A focused compatibility extension should cover both producer/consumer directions, capability skew and restored session invariants after pool reset. These checks are proposed, not executed.

The [security operations harness](https://blog.cloudflare.com/agentic-security-operations/) admits a versioned evidence snapshot before parallel analysis, fixes tenant scope in application code and constrains synthesis. It distinguishes an unchecked source, a lookup with no match and evidence supporting absence. This can sharpen `architecture` evidence provenance and failure reporting. Its early beta status supplies no general agent safety guarantee.

The [D1 control plane design](https://blog.cloudflare.com/d1-control-plane/) batches per resource deltas into per account aggregates, consuming delta rows and applying the grouped update in one PostgreSQL statement. An existing data projection owner can examine atomic consume/apply, replay identity, aggregation lag and hot account contention. Its eventual quota enforcement permits lag and cannot justify a strict cap.

## Remaining boundaries

- Current declared inventory is not proof that removed historical pages were recovered.
- English/default single segment article routes are included. Translation, author, tag and archive sitemap routes are excluded.
- The old direct sitemap now contains only 1952 scoped routes. The declared root and all five post shards yield 3663 routes; direct shard exhaustion alone is insufficient.
- Automatic extraction can include ancillary prose and omit dynamically rendered sections.
- Forty two short article pages were received successfully but fell below the substantive extraction threshold.
- Ten initial read timeouts and two retry timeouts remain in the attempt history. The last two resources were retrieved using ordinary public trailing slash routes, with their genuine external receipts retained.
- The HTTP attempted URL count includes two trailing slash transport aliases for existing canonical article identities.
- Independent audit found the raw object for copy-fail-linux-vulnerability-mitigation unavailable. An ordinary public refetch returned the exact historical digest and bytes, but its saved object disappeared before followup verification. The current article is evidence_unavailable, all prior events remain preserved and recovery loops stopped.
- {"latest_article_status_counts": {"evidence_unavailable": 1}, "meaning": "Unresolved transport, policy or media states are preserved rather than counted as extracted bodies."}

No runtime, model behavior or production experiment was executed by this research lane. Historical fixtures, results and archived inventories were retained.
