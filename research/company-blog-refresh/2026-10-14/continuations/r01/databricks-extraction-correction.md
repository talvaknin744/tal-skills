# Databricks r01 extraction and identity correction

Independent review found that 90 of the 499 HTML gains contain two visible publisher article content blocks. The frozen collector selected only the longest block, omitting positive source text on every affected URL. The complete responses were already retained, so retrieval gains remain valid while those original text artifacts are partial. The original [r01 report](databricks.md), its 508 row overlay and every old object remain preserved. The [structured correction](databricks-extraction-correction.json) binds a versioned replacement for those ninety text records.

The cache only correction selects both nonnested `.article--content` blocks, removes the same site shell elements as the frozen parser, and joins the content in publisher DOM order. Each response SHA256 and byte size matches its frozen receipt. Each old text digest matches one complete block. Every new union digest and word count matches the independent audit expectation. No new HTTP request or deliberate article reading was made.

| Example | Original retained words | Corrected union words | Restored words |
| --- | ---: | ---: | ---: |
| [ACID transactions](https://www.databricks.com/blog/what-are-acid-transactions) | 645 | 1055 | 410 |
| [Large language models](https://www.databricks.com/blog/what-are-large-language-models) | 1593 | 2577 | 984 |
| [DataFrames](https://www.databricks.com/blog/what-are-dataframes) | 245 | 264 | 19 |

The union restores 34151 positive words across ninety URL text instances. All 418 other overlay records remain structurally equal to their frozen versions. The retrieval statuses remain 503 extracted, two genuine short unextracted bodies and three HTTP404 gaps. Deliberate reading flags remain unchanged. These counts concern current URL responses and do not prove distinct historical article identities.

## Canonical alias qualification

Three current responses retain their exact requested URL as the final transport URL but declare a different same publisher canonical. Their source text is valid current response evidence. Equivalent original historical article content is unresolved.

| Requested path | Declared canonical path |
| --- | --- |
| `/blog/what-is-data-lakehouse-article` | `/blog/what-is-data-lakehouse` |
| `/blog/what-is-medallion-architecture-article` | `/blog/what-is-medallion-architecture` |
| `/blog/what-is-parquet-article` | `/blog/what-is-parquet` |

All three canonical destinations are separately present in the retrieved continuation frontier. The corrected subset has ninety URL responses and 87 distinct declared canonical destinations. The alias pairs therefore add no distinct canonical article destinations. Retrieval and URL disposition counts remain unchanged, while historical equivalence gaps are explicit. Restored word counts can include source content repeated at alias paths.

An initial strict canonical equality assertion failed on these responses. Its candidate, failure metadata and partial text artifacts are retained. The passing candidate binds the exact current response and the three separately reviewed alias values, without asserting historical equivalence.

## Versioned evidence and remaining scope

The external evidence namespace is `tal-skills-blog-crawl-resume-2026-10-14-r01`. Correction objects, the candidate scripts, retained failure, source and text binding records, and the versioned 508 row overlay are under `databricks/extraction-v2/`. The corrected overlay SHA256 is `2e10622de75c42b70048023d01f15d8f57c0e78357b5347152a9bf382edebd08`. Its candidate SHA256 is `a4497b05fe236a1c3bca0709b6e36bdb8e9de88e88eccd0289bac14d71bb7295`.

Local checks passed for the ninety complete audited content block unions, all original source and text bindings, all 418 unaffected records, the unchanged frozen report and overlay identities, and unchanged retrieval and reading counters. Independent correction reconciliation remains separate from those self checks. No skill instruction or native behavioral evaluation was changed or executed.

Use this versioned text overlay for the ninety affected records. The union establishes inclusion of their audited visible article blocks. It does not establish complete text or media extraction for every publisher page, reproduce product runtime, or extend deliberate reading to the bulk corpus. Three current 404 body gaps and three historical alias equivalence gaps remain visible.
