# Quality publisher archive research

Frozen on 2026-10-01. The archived [metadata index](../../../MANIFEST.md#archived-files) contains **13,099 distinct
publisher-declared URLs**, **2,232 exact metadata titles**, and **4,957 known
publication dates**. Unknown titles and dates are null. Sitemap modification times
remain separate. The URL field does not imply that every HTML canonical or
redirect was checked. The [coverage ledger](../../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) records endpoint
counts, scope, terminal evidence, exclusions, failures, and acquisition hashes.

Eight selected sitemap scopes were exhausted. JetBrains and Discord retain
explicit broader archive gaps. Exhausting a sitemap establishes the publisher's
currently declared discoverability; it does not recover removed historical posts.
Sitemap/feed enumeration is metadata work. Only the five articles in the
[source cards](articles.json) were deeply read; their exact scopes are separate.
No article bodies or full feed/XML/HTML responses are stored in this repository.

| Publisher | URLs | Exact titles | Known dates | Earliest known date | Archive result |
| --- | ---: | ---: | ---: | --- | --- |
| JetBrains | 2,294 | 12 | 2,294 | 2001-12-13 | Partial: 48 editorial child sitemaps returned empty HTTP 202 responses; metadata API also 202 |
| Docker | 948 | 10 | 10 | 2026-08-31 | Five post sitemaps exhausted; REST metadata endpoint returned 401 |
| Sentry | 926 | 32 | 32 | 2024-05-16 | Declared sitemap exhausted; recent RSS enriches 30 entries |
| PostHog | 358 | 252 | 252 | 2019-09-01 | Declared sitemap exhausted; RSS enriches part of the sitemap |
| Tailscale | 405 | 16 | 16 | 2020-08-21 | Blog URLs in finite site sitemap exhausted; recent RSS plus selected article metadata |
| GitLab | 2,301 | 17 | 17 | 2026-09-08 | Declared blog sitemap exhausted; recent Atom feed enriches 17 root-English URLs |
| Snyk | 2,052 | 1,670 | 1,670 | 2015-04-17 | Blog and article/knowledge-center sitemaps exhausted; blog feed supplies 1,670 titles/dates |
| Trail of Bits | 526 | 21 | 526 | 2012-06-11 | Dated article URLs in finite sitemap exhausted; recent RSS plus selected article metadata |
| Elastic | 3,127 | 40 | 40 | 2023-03-27 | English blog URLs in finite sitemap exhausted; feed provides 40 entries |
| Discord | 162 | 162 | 100 | 2025-04-08 | Engineering collection and recent RSS consumed; whole-blog history unproven |

The dates in this table are the oldest **known metadata dates**, not asserted
archive beginnings. A recent feed's earliest entry cannot date the oldest
unknown sitemap article. Snyk's `/articles/` surface includes article/hub subtype
uncertainty. Discord's exposed engineering list has 77 historical collection rows
plus featured articles, with no pagination or next link in that HTML; its RSS has
100 recent articles across categories. Main sitemap probes returned 404.

## Access and reproducibility

Robots-declared sitemap graphs were preferred. Finite URL sets were consumed,
relevant child maps were followed, and author/category/tag/localized/navigation
surfaces were excluded. Public feed and listing metadata enriched exact titles
and dates. Protected APIs and empty challenge responses were recorded without
bypassing them. Temporary responses were cached under `/tmp` only; request hashes
and endpoint URLs remain in the ledger.

Requested URL starts were paced at least 1.05 seconds apart per requested host,
with 5-second connection and 20-second read timeouts. Five initial requests followed
automatic redirects: Docker's blog feed, three Elastic lab sitemaps, and
`www.discord.com/sitemap.xml`. Intermediate-hop timing was not logged, so this
run does not establish the pacing bound for every redirect hop. The helper now
disables automatic redirects. Web-reader source access has its own provider
behavior; no per-hop network trace is available for it.

The acquisition scripts and probe logs explain the procedure; the frozen
`index.json`, `coverage.json`, and `articles.json` are the authoritative results.
A fresh acquisition would observe a different archive and must use a new dated
record rather than overwrite these results. [Deep-read findings](deep-reads.md)
connect the selected sources to conditional toolkit additions.
