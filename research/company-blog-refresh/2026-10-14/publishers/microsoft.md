# Engineering@Microsoft crawl and skill research

Snapshot date: 2026-10-14. All known body targets have a latest classification. Automatic extraction and deliberate reading are separate evidence states.

| Baseline records | Live discovered | Known body targets | Classified targets | Extracted | Fetched without extraction | Pending | Deliberately read |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 31 | 31 | 31 | 31 | 31 | 0 | 0 | 2 |

Engineering@Microsoft sub-blog only. Excludes all other Microsoft DevBlogs collections.

Discovery terminal: `{"reason": "rest_post_invalid_page_number", "page": 2, "url": "https://devblogs.microsoft.com/engineering-at-microsoft/wp-json/wp/v2/posts?per_page=100&_fields=link%2Ctitle%2Cdate%2Cmodified%2Cslug&page=2"}`. Request response hashes and full raw receipts remain in the external archive; [microsoft.json](microsoft.json) binds the crawler summary and discovery proof. Live URL discovery is reconciled with the retained historical inventory.

## Potential improvements

The [annotated security key account](https://devblogs.microsoft.com/engineering-at-microsoft/common-annotated-security-keys/) describes reserved test keys for validating secret scanner controls without exposing a valid credential. That is a useful test fixture boundary, not evidence of cryptographic authorization. Fixed signatures and checksums help identify token shapes. Its promised future standard, token entropy and format details require a current specification check before implementation. This body alone does not justify a broad new security skill.

The [Learn MCP server account](https://devblogs.microsoft.com/engineering-at-microsoft/how-we-built-the-microsoft-learn-mcp-server/) reports hardcoded callers breaking after a parameter rename, despite protocol discovery. It used optional aliases during a deprecation window. A focused `mcp-engineering` or `technical-deprecation` evaluation should retain both stale schema callers and clients that refresh discovery. Description wording changes need activation and outcome evidence, including nontrigger cases. The article's reported breakage percentage is its deployment observation, not a portable forecast.

Earlier plain HTTP requests and the public full content API probe returned HTTP 403; later public article responses with the research crawler's normal request headers were readable. No access boundary was bypassed. The earlier surveyed flaky test candidate remains absent from the current scoped inventory, without an established deletion reason.

## Remaining boundaries

- Scope is Engineering@Microsoft only. Other DevBlogs collections are excluded.
- Earlier basic article requests and the public full content API probe returned HTTP 403. Later public article responses with normal research headers were readable; all outcomes remain recorded. No authentication or challenge was bypassed.
- Requests conservatively use a ten second interval from the robots crawl delay signal. Host circuit deferrals retain unattempted transport outcomes explicitly.
- The earlier surveyed flaky test candidate is absent from the current scoped inventory. Absence does not establish a removal reason.
- The initial transport run was interrupted before an article job completed. In flight request receipts from that partial run may be unavailable; final completed public responses are retained separately.

No runtime, model behavior or production experiment was executed by this research lane. Historical fixtures, results and archived inventories were retained.
