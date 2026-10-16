# Databricks retrieval continuation r01

This continuation recovered positive article bodies for 504 of the 507 original retrieval gaps and fetched one new article from a fresh sitemap snapshot. Of the recovered original gaps, 502 meet the unchanged extraction threshold and two are complete but short publisher content fields. Three exact URLs still return HTTP 404. The original publisher report, crawler state, failed receipts and raw archive remain preserved. The [structured report](databricks.json) binds the additive overlay and its external evidence.

| Observation | Original frozen state | Effective state with r01 |
| --- | ---: | ---: |
| Known URLs | 3472 | 3473 |
| Excluded archive navigation | 1 | 1 |
| Scoped article URLs | 3471 | 3472 |
| Extracted article candidates | 2962 | 3465 |
| Positive short bodies below extraction threshold | 2 | 4 |
| Retrieved article bodies | 2964 | 3469 |
| Current HTTP 404 gaps | 506 | 3 |
| Collection redirect without recovered article body | 1 | 0 |
| Pending known frontier | 0 | 0 |
| Deliberately read articles | 3 | 4 |

The effective counts are an overlay, not an edit to the frozen crawler summary. Retrieval includes genuine short article fields. Navigation and error payloads never count as article bodies. Automatic extraction does not establish that the corpus was read.

## Exact retrieval and public renderer evidence

Independent ordinary probes returned HTTP 200 for several exact URLs that previously returned 404. The recovery retained case, including the uppercase path in [Integrating NVIDIA TensorRT LLM](https://www.databricks.com/blog/Integrating-NVIDIA-TensorRT-LLM). Public author pages also link the exact original paths, including [Megha Agarwal](https://www.databricks.com/blog/author/megha-agarwal) and [Hagay Lupesko](https://www.databricks.com/blog/author/hagay-lupesko). The cause of the earlier failures remains unresolved.

The bounded retry processed all 507 prior gaps, reused six exact probe receipts, and made 501 new exact frontier requests. It used the ordinary requests user agent, four workers, a 0.4 second request start interval, and no retries. Robots permitted the requests. Redirects were followed only on the ordinary publisher host when allowed, with every response hop retained. This first pass produced 498 extracted bodies, five short extraction results, one collection redirect and three 404 responses.

The publisher's public [blog loader](https://www.databricks.com/blog-legacy-assets/app-690cd4d1d023255c5584.js) identifies its published page data route. The continuation used that route for the nine remaining records. Positive payloads require `Drupal_NodePost`, an exact match among the original URL path, payload path and entity path, an exact canonical URI, and preserved node and revision identifiers. The complete `body.processed` field is archived separately from its enclosing response.

Six payloads passed those identity checks. They include the [engineering fellowship announcement](https://www.databricks.com/blog-legacy-assets/page-data/blog/2021/11/10/announcing-databricks-engineering-fellowship.html/page-data.json), despite its current HTML redirect to the blog collection, and five definition pages. Three definition fields exceed the extraction threshold. The PyCharm field has 60 words and the unified data analytics platform field has 110 words, so their positive complete body fields remain `body_fetched_unextracted`. The threshold was not lowered. Six alternate responses for the three missing URLs returned HTTP 200 error components without article fields and were rejected.

The remaining exact gaps are:

- [Unifying governance across engines and catalogs](https://www.databricks.com/blog/unifying-governance-across-engines-and-catalogs).
- [Self service data intelligence cloned path](https://www.databricks.com/blog/empowering-business-users-self-service-data-intelligence-cloned).
- [Granular usage attribution cloned test path](https://www.databricks.com/blog/granular-usage-attribution-dbt-pipelines-query-tags-cloned-test).

No deletion or uncertain slug equivalence is asserted. Their original errors, fresh errors and alternate error components remain available for review.

## Fresh discovery and deliberate reading

Both the [current English blog sitemap index](https://www.databricks.com/en-blog-assets/sitemap/sitemap-index.xml) and [legacy blog sitemap index](https://www.databricks.com/blog-legacy-assets/sitemap/sitemap-index.xml) were retrieved. Each declares one leaf, and both leaves were fetched and parsed. Their combined raw blog namespace contains 6228 URLs, including author and category navigation. The retained collector's unchanged URL classifier selects 3456 article candidates and excludes 2772 navigation URLs. Exactly one article is new relative to the frozen 3472 URL state. Historical URLs missing from the latest sitemap remain preserved.

The new [document intelligence article](https://www.databricks.com/blog/power-real-time-applications-and-agents-document-intelligence) has a publication timestamp of October 14, 2026 at 20:00 UTC. Its ordinary HTML response was retrieved and its complete extracted main prose was deliberately read through the final API and guide links. Embedded diagram and code illustration pixels, linked API contracts and runtime were not verified.

The article illustrates extracting fields with optional source citations and confidence, followed by explicit human correction or approval before storing a reviewed record and source reference. A useful deferred `agent-evaluation` improvement is to score field correctness, source support and approval boundaries separately from schema validity and confidence. A high confidence value can satisfy the schema while disagreeing with the document. A valid citation can also refer to an obsolete source revision. These are proposed discriminating cases, alongside an explicit approval boundary case and a nontrigger case for deterministic JSON transformations. The article's product availability claims are dated publisher claims, not independently reproduced guarantees. No skill instruction was changed in this continuation.

The discovery terminal proof applies to the declared current and legacy sitemap scope. It does not establish deleted, private, unlisted or lifetime publication completeness. Only the new article was deliberately read during r01, with bulk retrieval kept separate.

## Evidence and verification

Raw responses, text, scripts, full ledgers and verification outputs are retained in the external namespace `tal-skills-blog-crawl-resume-2026-10-14-r01`, under `databricks/`. The combined ledger contains 508 unique records: the 507 original gaps and the new article. Its SHA256 is `638cd51ea17cbdffd0e44558800996b604f53021cdf14d90d82e0a6a243c1f08`. The unchanged collector identity is `62f19fc622491ddcff088c1a6c345eefc416bab4b3da194f9428c134b0dcb50b`.

Local verification checked SHA256 and byte sizes for 1024 referenced response and text objects, all 1030 content addressed objects, six exact renderer identities, every original failed raw receipt, the frozen parent report and summary identities, and overlay arithmetic against the read only frozen SQLite state. It also reproduced sitemap classification from the retained collector. Self checks are separate from independent audit and native behavioral scores. No native host, product runtime or behavioral model evaluation was executed by this research continuation.

The six imported pilot receipts did not store exact original fetch timestamps. Their import timestamps therefore identify receipt reuse, while independently verified payload digests and byte sizes bind the actual evidence. This limit remains visible in the structured report.

An ordinary publisher tag feed also exposed older Pinterest content through [Medium's documented RSS format](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics). Two successful pilot feeds supplied five unique content entries, including the earlier blocked TiDB URL. A third request returned HTTP 429 and this pilot stopped. Medium warns that RSS does not provide complete paywalled stories. The separate [Pinterest continuation](pinterest.md) owns further enumeration and its totals; these pilot observations add no Databricks counts and establish no complete Pinterest archive.
