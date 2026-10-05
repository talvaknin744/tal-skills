# Shopify Engineering archive enumeration — 2026-10-01

Enumerated **432 unique article URL/title/date records**, from **2010-10-15** through **2026-10-01**, using the official [Atom feed](https://shopify.engineering/blog.atom). The feed has no next link and parses to a closing feed element. This is metadata enumeration; article bodies were not deep-read or retained.

| Surface | Observed count | Terminal evidence |
| --- | ---: | --- |
| Atom feed | 432 entries | Single complete XML feed; only self and alternate feed links |
| Article sitemap | 431 URLs | Single complete XML urlset |
| HTML latest archive | 411 unique articles across 22 nonempty pages | [Page 23](https://shopify.engineering/latest?page=23) returned HTTP 404 with no article cards |

The [HTML archive](https://shopify.engineering/latest) stops presenting a Next link at page 13. Explicit page 14 and later numbered URLs still return older posts; arithmetic continuation reached page 22, then the empty HTTP 404 page 23. Twenty-one feed URLs are absent from the exhausted HTML archive. The [sitemap](https://shopify.engineering/sitemap.xml) omits the newly published ShopGym entry present in the feed/current latest page. Exact set differences, endpoint URLs, response statuses and per-page counts are recorded in coverage.json.

Both previously recorded Shopify articles are marked in index.json: the monolith retrospective and high-availability background jobs. Deduplication scanned every pre-existing JSON/Markdown document under docs, excluding this dated run, and normalized query, fragment and trailing slash differences. No previously recorded article is recommended anew.

Completeness refers to the currently accessible feed, sitemap and HTML archive surfaces. Deleted, private, legacy-host and unlisted history may exist outside them. Feed publication timestamps and sitemap last-modified dates remain distinct. URLs use official feed identity; individual article canonical tags and body accessibility were not independently verified.
