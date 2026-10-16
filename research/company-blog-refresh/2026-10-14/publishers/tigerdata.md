# Tiger Data blog refresh

Recorded on 2026-10-14. The canonical scoped collection contains 551 article routes, with 550 substantive bodies automatically extracted and 1 returned bodies below the extraction threshold. Every scoped route was processed. Deliberate reading covered 2 selected article bodies, with current documentation reading recorded separately. Crawling and extraction do not establish reading of the full archive.

Canonical default public blog posts under www.tigerdata.com/blog. Ghost CMS URLs were mapped by their exact published slug to the public sitemap route. Author, tag, documentation and product surfaces are excluded.

The blog sitemap contained 551 article URLs. The Ghost API advertised 551 posts across six pages, with 51 posts and next null on the last page. Page seven returned zero posts. Both sets agree after canonical public route mapping.

One short historical post did not pass the automatic 120 word substantive extraction threshold. Its complete returned HTML is retained. The Ghost response uses a CMS hostname. Transformed import JSON retains each original CMS URL, and original endpoint responses and hashes remain separate. The web tool rejected a documentation response advertised as text/markdown. Direct public HTML retrieval succeeded, and the article content sections were deliberately read.

The [refresh mechanism article](https://www.tigerdata.com/blog/continuous-aggregate-refresh-demystified) and [policy shape article](https://www.tigerdata.com/blog/continuous-aggregate-refresh-policies-solar-wind-scada) distinguish recent publication from historical correction coverage. [Current refresh documentation](https://www.tigerdata.com/docs/build/continuous-aggregates/refresh-policies) confirms bounded windows, nonoverlapping concurrent policies and retention interactions. Add a correction outside every scheduled window to `stream-processing-design`; a healthy recent job and a live tail must not imply reconciled historical output.

The [policy API reference](https://www.tigerdata.com/docs/reference/timescaledb/continuous-aggregates/add_continuous_aggregate_policy) exposes separate transactions per refresh batch. Add interrupted partial refresh to `background-maintenance`, with visible partial results and an incomplete whole range. Retention must match whether an aggregate preserves a historical record or follows source removal. The vendor article's general comparisons with competing engines were not adopted without those engines' owner contracts.

These are research recommendations for a future candidate. No instruction behavior was changed here, no live database procedure was run, and no behavioral evaluation pass is claimed. The companion JSON binds counters, source hashes, reading scope and remaining gaps to the external archive. Historical evidence and failed attempts remain retained.
