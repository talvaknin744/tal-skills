# AWS Builders Library crawl and skill research

Snapshot date: 2026-10-14. All known body targets have a latest classification. Automatic extraction and deliberate reading are separate evidence states.

| Baseline records | Live discovered | Known body targets | Classified targets | Extracted | Fetched without extraction | Pending | Deliberately read |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 31 | 30 | 31 | 31 | 21 | 9 | 0 | 1 |

Current public Builders Library tagged collection only, including locale hints. Excludes AWS product blogs and all other Builder Center articles. API migrated publication dates do not establish original dates.

Discovery terminal: `{"reason": "absent or empty response cursor", "url": "https://api.builder.aws.com/cs/v2/tag/articles?tag=builders-library&pageSize=100"}`. Request response hashes and full raw receipts remain in the external archive; [aws.json](aws.json) binds the crawler summary and discovery proof. Live URL discovery is reconciled with the retained historical inventory.

## Potential improvements

The [shuffle sharding account](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding) assigns each tenant a stable worker subset, limiting overlap when a tenant floods or poisons its workers. Callers need a usable surviving assigned worker. Consider a focused addition to `distributed-system-patterns/references/serving.md`: record subset overlap, survivor capacity and retry destinations. Verification should cover a poisoned subset, two overlapping failures and a retry that escapes the assigned subset. These are proposed checks. The article's combinatorial example does not establish isolation from a shared physical dependency or multiple simultaneous attacks. A separate new skill would duplicate the existing topology owner.

## Remaining boundaries

- Scope is the current Builders Library tag, not all AWS blogs. Thirty current tag items include four non English API locale hints despite English titles.
- Nine collection pages embed video with only short surrounding prose. Video transcripts were not retrieved or read.
- The historical static stability PDF is a supplemental item outside the current tag collection. Its raw response was received successfully, but generic extraction classified it unsupported media.
- Builder Center migration timestamps do not establish original historical publication dates.
- {"latest_article_status_counts": {"unsupported_media": 1}, "meaning": "Unresolved transport, policy or media states are preserved rather than counted as extracted bodies."}

No runtime, model behavior or production experiment was executed by this research lane. Historical fixtures, results and archived inventories were retained.
