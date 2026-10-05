# Temporal meaning of joins

Choose the enrichment question before selecting SQL syntax:

| Meaning | Required evidence | Output contract |
|---|---|---|
| Maintain the relation as either side changes | Current keyed state and source updates/deletes | Changes to earlier joined rows may require replacements or retractions. |
| Use the dimension effective at the event's time | Versioned dimension history, event timestamp, key, and effective intervals | Define whether later historical corrections revise already published enrichment. |
| Use the latest dimension when processing | Lookup snapshot/version and permitted cache age | Reprocessing at a later time may produce a different result unless the chosen version is retained. |

State which side is authoritative, key uniqueness, missing-match behavior, and deletion semantics. For outer joins, distinguish a provisional null from a permanently unmatched row. Specify join cardinality: an unexpected many-to-many match can multiply sums even after event deduplication.

Historical lookup needs sufficient history for the oldest admissible event and backfill. A current-value table cannot recover a deleted or superseded version merely because the query uses an event timestamp. Define effective-time overlap/gap behavior and the effect of a retroactive dimension correction. A maintained current-state join answers a different question from the historical value a business event used.

Require the sink to represent the selected changes. Preserve a reproducible lookup version where output must survive replay unchanged. Check delayed facts spanning a dimension change, a late matching row, a delete, a correction to historical effective time, and a duplicate fact. Verify concrete joined values and output operations rather than successful serialization. Product-specific examples and ambiguity are recorded in [sources.md](sources.md).
