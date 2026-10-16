# Fastly Blog crawl and skill research

Snapshot date: 2026-10-14. All known body targets have a latest classification. Automatic extraction and deliberate reading are separate evidence states.

| Baseline records | Live discovered | Known body targets | Classified targets | Extracted | Fetched without extraction | Pending | Deliberately read |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1039 | 1045 | 1045 | 1045 | 1041 | 4 | 0 | 1 |

English Fastly /blog/{article} routes in official sitemap index, excluding translated routes, author/category/tag paths and non-blog pages.

Discovery terminal: `{"reason": "all declared sitemap branches exhausted", "sitemap_pages": 4, "root": "https://www.fastly.com/sitemap/sitemap-index.xml"}`. Request response hashes and full raw receipts remain in the external archive; [fastly.json](fastly.json) binds the crawler summary and discovery proof. Live URL discovery is reconciled with the retained historical inventory.

## Potential improvements

The [request collapsing account](https://www.fastly.com/blog/request-collapsing-demystified) shows how unusable origin responses can repeatedly serialize followers. Low collapsing volume can also reflect a healthy fast origin. Enrich existing overload or latency diagnosis guidance with object level origin load, follower waiting time and response sharing eligibility rather than optimizing a collapse counter alone. Proposed checks should include a private response, an uncacheable error and a fast successful origin.

The current [provider contract](https://www.fastly.com/documentation/guides/concepts/cache/request-collapsing/) distinguishes cacheability, queued response reuse and request pass behavior. A zero TTL alone does not protect private response data. This documentation is a supplemental contract check, outside the surveyed blog corpus. No CDN configuration was changed.

## Remaining boundaries

- English /blog/{article} routes are included. Translated blogs, author/category/tag paths and non blog documents are excluded.
- Four short article or announcement pages were fetched but did not pass the automatic substantive body threshold. Their raw responses remain available.
- Declared sitemap exhaustion establishes current listed scope, not recovered deleted or unlisted history.

No runtime, model behavior or production experiment was executed by this research lane. Historical fixtures, results and archived inventories were retained.
