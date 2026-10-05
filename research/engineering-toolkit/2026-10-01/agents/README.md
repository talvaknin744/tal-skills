# Official archive audit and design findings — agents lane

This lane covers exactly publisher-survey publishers 0–9: OpenAI through Twilio. The frozen index has **15841 metadata records**, including separately labeled release notes and partner/community posts. **Five new main article bodies** were read. Nine publishers’ included public metadata endpoints reached terminal traversal; Pinterest’s historical archive remains an explicit access gap. Reaching a sitemap/API endpoint terminal does not establish that a publisher has listed every historical article.

## Read the results

- [findings.md](findings.md) ranks transferable practices and suggested existing-reference placements.
- [deepchecks.md](deepchecks.md) covers Snowflake execution anchors and Pinterest datastore selection.
- [selected-articles.json](selected-articles.json) holds five six-dimension cards and nine current official documentation crosschecks.
- The [research crawl archive manifest](../../../MANIFEST.md#archived-files) lists the archived combined and per-publisher inventories, which preserve canonical URL/title/date metadata with fields left null where unknown. Each record labels its reading status and source.
- [coverage.json](../../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-coverage-json) points to the per-publisher audits containing every actual endpoint request, pagination terminal, exclusions, failures and known date bounds. Complete inventories and request logs are stored once.
- [excluded-navigation.json](excluded-navigation.json) accounts for removed author/category/landing URLs.
- [discovery-shortlist.json](discovery-shortlist.json) is only a title/URL keyword screen for later reading.

## Endpoint coverage

| Publisher | Indexed metadata | Title/date known | Earliest known date | Traversal |
| --- | ---: | ---: | --- | --- |
| OpenAI | 36 | 36/0 | Unknown | 2 sitemap nodes |
| Anthropic | 25 | 25/24 | 2024-09-19 | 1 sitemap nodes |
| Hugging Face | 871 | 871/871 | 2020-02-14 | pages 0–63, empty terminal |
| LangChain | 529 | 529/528 | 2023-01-16 | 1 sitemap nodes, 34 HTML pages |
| Vercel | 1673 | 1626/1626 | 2016-10-25 | 1 sitemap nodes, Atom feed |
| Databricks | 3435 | 38/38 | 2013-10-27 | 5 sitemap nodes |
| Snowflake | 265 | 35/31 | 2025-02-25 | 1 sitemap nodes, 1 sitemap nodes |
| NVIDIA | 5277 | 5277/5277 | 2011-06-07 | 54 REST pages |
| Pinterest | 11 | 11/11 | 2024-07-19 | RSS feed (historical archive blocked) |
| Twilio | 3719 | 35/35 | 2011-06-11 | 2 sitemap nodes |

Dates are the earliest **known** dates among indexed/enriched records, not a claim about each archive’s first publication. Pinterest’s date includes the separately selected historical article; its feed inventory itself only covers ten recent records. Title/date discovery was enriched automatically for selected metadata candidates, which does not count as reading article bodies.

## Exact archive roots

- OpenAI: `https://developers.openai.com/sitemap-index.xml` → returned child URL set; selected `/blog/` paths.
- Anthropic: `https://www.anthropic.com/sitemap.xml`, engineering landing-page title/time metadata.
- Hugging Face: `https://huggingface.co/blog?p=N`, embedded `Articles` metadata, 14 records/page; pages 0–63, page 63 empty. Canonical editorial versus partner/community posts labeled. Separate community archive excluded.
- LangChain: `https://www.langchain.com/sitemap.xml` plus `https://www.langchain.com/blog?8457a1db_page=N`, pages 1–34. Page 34 has no next-page continuation; repeated featured cards deduplicated.
- Vercel: `https://vercel.com/sitemap.xml` redirects to `https://vercel.com/crawled-sitemap.xml`; `https://vercel.com/atom` includes blog and changelog records. Categories excluded and release notes labeled.
- Databricks: `https://www.databricks.com/webshared/sitemaps/sitemap-index.xml` → English blog and legacy blog indexes → leaf URL sets. Nonblog and locale branches excluded by exact endpoint URLs in coverage.
- Snowflake: `https://www.snowflake.com/content/snowflake-site/global.sitemap.xml`; only English engineering paths. `https://www.snowflake.com/sitemap_index.xml` has no included post branch under the selected filter. Visible article publication dates take precedence over AEM migration dates declared in JSON-LD.
- NVIDIA: `https://developer.nvidia.com/blog/wp-json/wp/v2/posts?per_page=100&page=N&_fields=id,date,date_gmt,link,title,slug,categories`, pages 1–54 to advertised total pages. Metadata-only ID/link recheck and front-page reconciliation disclose one new post and canonical aliases.
- Pinterest: `https://medium.com/feed/pinterest-engineering`, ten recent entries. Publication and `/archive` returned 403. No bypass attempted; the older TiDB article was a separate selected reading.
- Twilio: `https://www.twilio.com/sitemap.xml` → `https://www.twilio.com/en-us.sitemap.xml`; all English blog categories, with authors and category navigation excluded.

## Method and exclusions

Discovery starts at each known official publisher index and robots/sitemap/feed references. Primary XML, REST or embedded pagination metadata was traversed before title/URL screening. HTTP calls used bounded connect/read timeouts and at least 1.05 seconds between top-level crawler request starts per host; redirects followed by the HTTP library were not separately paced. Initial probes and failures remain in the coverage record. Independent publishers were traversed concurrently.

The metadata crawler never saved article bodies in the repository. RSS/Atom payloads and HTML used for extraction were held transiently outside the repository. Automatically visiting a page to extract a title/date does not make it a complete reading. Five selected bodies have separate scopes, evidence sections, analyst counterexamples and unexecuted validation proposals.

Canonical metadata uses normalized scheme/host/path, removing query parameters, fragments and trailing slashes. Previously recorded URLs are compared against all earlier `docs/research` files, including JSON and Markdown. Selected new readings also receive slug/canonical searches. Historical redirect aliases cannot be proven equivalent for thousands of unread sitemap records; no universal semantic-deduplication claim is made.

Scope excludes non-English sitemap branches, author/category/landing navigation and unlisted or retired URLs absent from the accessible inventory. NVIDIA retained REST post links that point outside `/blog/` because the publisher API advertises them as posts. Vercel release notes and Hugging Face noncanonical partner/community posts are labeled and excluded from the keyword shortlist’s first-party engineering candidates.

No new skill, vendor runtime probe, model run or commit occurred. After the research was frozen, root authorized narrow adoption in two existing packages; [adoption.md](adoption.md) records those edits and structural validation. A new vendor-neutral agent-system-design invocation remains a user choice.
