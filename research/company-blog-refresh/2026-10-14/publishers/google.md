# Google Research crawl and skill research

Snapshot date: 2026-10-14. All known body targets have a latest classification. Automatic extraction and deliberate reading are separate evidence states.

| Baseline records | Live discovered | Known body targets | Classified targets | Extracted | Fetched without extraction | Pending | Deliberately read |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1617 | 1623 | 1624 | 1624 | 1621 | 3 | 0 | 1 |

Google Research blog routes only. Excludes Google Cloud and other Google publications.

Discovery terminal: `{"reason": "no active next page link", "page": 136, "url": "https://research.google/blog/?page=136"}`. Request response hashes and full raw receipts remain in the external archive; [google.json](google.json) binds the crawler summary and discovery proof. Live URL discovery is reconciled with the retained historical inventory.

## Potential improvements

The [contextual agent privacy and security report summary](https://research.google/blog/open-and-emergent-problems-in-agentic-privacy-and-security-a-contextual-angle/) proposes evaluating information flow by actors, data categories and transmission rules before tool execution. It describes a contextual policy supervisor and dynamic capability changes as research directions. Preserve that status when enriching agent authorization guidance. A proposed adversarial evaluation can change recipient, purpose or tool capabilities while holding the user's task fixed. This source does not demonstrate that natural language policies, model reasoning or multi agent benchmarks enforce a production boundary. Existing `mcp-engineering` and `a2a-engineering` authorization owners should be examined before adding a broad security package.

## Remaining boundaries

- Scope is Google Research only. The Google Cloud SLO and cost article is a retained historical supplemental body target.
- Initial transport attempts normalized redirect targets without their trailing slash, causing artificial redirect loops. Those failed attempts are preserved; repaired transport runs are reported separately.
- The live sitemap and 136 archive pages agree on 1623 current blog routes. Deleted or unlisted publications are not recovered.
- Three short historical announcements or link pointers were fetched but fell below the substantive extraction threshold.
- Completed initial attempt receipts were retained. The interrupted old transport run can lack receipts for requests still in flight; the completed repaired run provides latest receipts for the full frontier.

No runtime, model behavior or production experiment was executed by this research lane. Historical fixtures, results and archived inventories were retained.
