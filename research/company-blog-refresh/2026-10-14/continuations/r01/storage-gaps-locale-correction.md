# MongoDB locale correction for storage continuation r01

The requested logical metadata locale filter was not honored by the returned collection. The frozen r01 inventory is multilingual and cannot be counted as 2,043 new English articles. Its published record identities, URL route inventory and captured body fields remain available, with the corrected locale strata below. The original [r01 report](storage-gaps.md) is preserved unchanged; this [correction record](storage-gaps-locale-correction.json) supersedes its locale filtering and English aggregation claims.

| Observed metadata locale | Admitted route records | New API URLs | New nonempty body fields | Substantive text screening |
| --- | ---: | ---: | ---: | ---: |
| `en` | 2,860 | 1,673 | 1,668 | 1,560 |
| Empty string | 81 | 77 | 77 | 73 |
| Explicit other locale | 305 | 293 | 293 | 266 |
| Total | 3,246 | 2,043 | 2,038 | 1,899 |

The 293 new explicit other locale records comprise `pt-br` 38, `de-de` 36, `it-it` 30, `es` 50, `zh-cn` 60, `ko-kr` 33, `fr-fr` 36, `zh-tw` 4, `ja-jp` 4, `ko` 1 and `it` 1. Empty locale records remain a distinct unknown metadata stratum. Even `en` is a publisher metadata value, not independent verification of the article's prose language.

Across all 3,266 returned source records, before URL route exclusions, the corresponding totals are 2,866 `en`, 81 empty string and 319 explicit other locale. Mixing that broader English count with the 3,246 admitted route total produces an incorrect remainder. This correction binds each cohort to its exact input hashes and predicates.

The additional publication index family stays separate. Its 16 new default route metadata URLs have `publish_details.locale` set to `en-us` in the immutable original blog root, as do the 15 additional page response targets. These metadata values do not establish language, complete rendering or distinct publication identity, and are not node API locale counts.

Executed checks reconcile the exact locale distributions and existing body counters for each stratum. The frozen r01 reports and source data retain their original hashes. No network request, instruction edit or retrospective rewrite was performed. Exact body field mapping verification remains a separate independent audit; this correction makes no new reading or mapping assurance claim.
