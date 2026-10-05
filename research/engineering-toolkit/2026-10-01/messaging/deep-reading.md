# Streaming design: time, state, joins, and history

Researched 2026-10-01. Four new first-party article bodies were read for general design decisions. Canonical URL searches found no occurrence in the 181 existing Markdown/JSON research files checked before writing. These are additional readings, not a replacement for the earlier messaging archive. The [structured records](deep-reading.json) map claims to sources and distinguish proposed verification from executed evidence. No skill or runtime was changed.

## 1. Estuary / Gazette: separating serving from historical storage

[A decade of Gazette: a streaming broker that doesn’t store data](https://estuary.dev/blog/gazette-streaming-broker-architecture/), Dani Pálma, 2026-09-17.

**Read scope:** Complete substantive prose, all thirteen body sections, seven append steps, transaction/ownership examples, and diagram captions. Diagram pixels were not inspected; conceptual snippets were read, not executed.

- **Trigger:** Design a new historical consumer beside a latency-sensitive live stream.
- **Problem:** Bulk replay and live serving need different capacity paths. [Article](https://estuary.dev/blog/gazette-streaming-broker-architecture/)
- **Mechanism:** Gazette combines replicated hot appends with immutable fragments in one journal offset space; readers can fetch stored fragments directly. Record interpretation stays above the byte broker. [Article](https://estuary.dev/blog/gazette-streaming-broker-architecture/), [Broker Concepts: Journals, Fragments, Fragment Index](https://gazette.readthedocs.io/en/latest/brokers-concepts.html)
- **Limits:** A journal's append rate remains bounded by its primary/replicas; additional brokers require additional journals to increase that rate. [Current Gazette docs](https://gazette.readthedocs.io/en/latest/brokers-concepts.html#clustering)
- **Counterexample — synthesis:** A small consumer requiring only the live head may gain little from introducing a separate historical read path. Derive that decision from measured replay pressure.
- **Verification — proposed:** Seal bytes `[0,100)`, continue writing from `100`, and replay across the seam. Require contiguous committed ranges and identical framing through both paths; measure live latency during replay against an explicit budget. No broker test ran.

**Placement:** The best existing location is `distributed-system-patterns/references/serving.md`: it already handles placement, partitioning, and parallel work. Add a storage/serving separation branch, rather than importing Gazette's whole implementation. Its ownership example corroborates the existing `ownership.md` protected-write rule; it does not require another ownership skill. [Existing skill](../../../../skills/engineering/distributed-system-patterns/SKILL.md), [ownership reference](../../../../skills/engineering/distributed-system-patterns/references/ownership.md)

## 2. Materialize: result lifetime and pending state are different

[Replica expiration: Limiting temporal filters' resource requirements](https://materialize.com/blog/replica-expiration/), Moritz Hoffmann, 2025-01-15.

**Read scope:** Complete body from temporal-filter introduction through the constant-collection appendix; SQL and update tables inspected. No environment, SQL, or source code was executed.

- **Trigger:** Design or size a continuously maintained view with records entering or leaving as time advances.
- **Problem:** A small visible result can coexist with pending future updates. [Article](https://materialize.com/blog/replica-expiration/)
- **Mechanism:** Temporal filters schedule additions/retractions. The article's optimization bounds a replica's future execution horizon and prevents it advancing beyond that horizon. [Article](https://materialize.com/blog/replica-expiration/)
- **Limits:** Current documentation still requires resources for scheduled retractions and excludes sufficiently late records; filter syntax also constrains materialization. The historical article's deployment eligibility and observed memory savings are not current guarantees. [Temporal filters: restrictions and late events](https://materialize.com/docs/transform-data/patterns/temporal-filters/)
- **Counterexample — synthesis:** Treating the current result row count as the complete state estimate misses future-dated input and retraction bookkeeping.
- **Verification — proposed:** Define `t <= logical_now < t+10`. Inspect outputs at `t-1`, `t`, `t+9`, and `t+10`; include a far-future row and a record arriving after expiry. Separately measure pending state. Current `mz-deploy` preview tests can pin `mz_now()` with `AT TIME`; they check result sets, not a whole subscription history or memory bound. [EXECUTE UNIT TEST](https://materialize.com/docs/sql/execute-unit-test/)

**Placement:** `microservice-data/references/projections.md` is the strongest existing home for a cross-service view's freshness and lifetime contract. For a view maintained inside one streaming engine, that skill's cross-service trigger is a poor fit; this is evidence for the distinct design candidate below. [Existing projection reference](../../../../skills/engineering/microservice-data/references/projections.md)

## 3. RisingWave: progress barriers and window finality

[Deep Dive Into the RisingWave Stream Processing Engine (Part 3): Trigger Mechanism](https://risingwave.com/blog/deep-dive-into-the-risingwave-stream-processing-engine-part-3-trigger-mechanism/), RisingWave Labs, 2023-11-24.

**Read scope:** Complete body: computation example, barrier alignment/flush/broadcast, injection strategy, watermarks, EOWC scenarios, and conclusion; captions read, image pixels not inspected.

- **Trigger:** Choose between changing window results and a final append-only result.
- **Problem:** Batching progress and event-time completeness establish different facts. [Article](https://risingwave.com/blog/deep-dive-into-the-risingwave-stream-processing-engine-part-3-trigger-mechanism/)
- **Mechanism:** Barriers align input progress and flush incremental results. Window-close output waits for watermark progress instead. [Article](https://risingwave.com/blog/deep-dive-into-the-risingwave-stream-processing-engine-part-3-trigger-mechanism/), [Current emit-on-window-close docs](https://docs.risingwave.com/processing/emit-on-window-close)
- **Limits:** Watermarks encode an admission policy: late data can be excluded. Table watermark TTL ignores expired changes and does not retract already derived downstream results. CDC transaction preservation requires supported native connectors and `transactional=true`; transactions exceeding 4096 changed rows are not guaranteed. [Watermarks](https://docs.risingwave.com/processing/watermarks), [Transactions](https://docs.risingwave.com/processing/transactions)
- **Counterexample — synthesis:** Passing wall-clock time alone does not advance a watermark defined from maximum observed event time. A quiet source can delay final output despite an apparently elapsed window.
- **Verification — proposed:** Feed the same window in different arrival orders; compare rolling updates with final output. Advance an explicit watermark, then inject a row before it. Assert the documented late-data disposition and downstream TTL behavior; separately verify source transaction eligibility. No engine test ran.

**Placement:** `microservice-data/references/projections.md` can hold a conditional completeness/output contract. `distributed-system-patterns/references/batch.md` is a weaker fallback: its finite-membership barrier is not an event-time window. Keep those concepts distinct. [Projection reference](../../../../skills/engineering/microservice-data/references/projections.md), [batch reference](../../../../skills/engineering/distributed-system-patterns/references/batch.md)

## 4. Decodable: choose the temporal meaning of enrichment

[Real Time Streaming Joins With SQL](https://www.decodable.co/blog/real-time-joins-with-decodable), Robert Metzger, 2022-10-14.

**Read scope:** Complete textual body: motivating examples, benefits, connector/change-stream pipeline, and conclusion. The HTML's SQL example was empty; embedded screenshots/diagram pixels were not inspected. Current documentation supplied the inspectable semantic examples.

- **Trigger:** Enrich an event or maintain a joined relation as reference data changes.
- **Problem:** A continuous join updates a result from source changes; that alone does not select which reference-data time the application needs. [Article](https://www.decodable.co/blog/real-time-joins-with-decodable)
- **Mechanism:** Distinguish regular maintained joins, event-time historical lookup, and processing-time latest-value lookup. [Current join overview](https://docs.decodable.co/pipelines/joins.html), [Time-based lookup joins](https://docs.decodable.co/pipelines/joins/temporal-joins.html)
- **Limits:** Regular joins retain state indefinitely; outer joins can temporarily emit nulls before later corrections. [Join overview](https://docs.decodable.co/pipelines/joins.html), [Regular joins: Joins that produce nulls](https://docs.decodable.co/pipelines/joins/regular-joins.html)
- **Counterexample — synthesis:** A delayed transaction requiring its historical exchange rate is incorrectly priced by a latest-value lookup after the rate changes.
- **Verification — proposed:** Change a dimension between event occurrence and processing; compare latest-value, historical, and maintained-join expectations. Include deletion and late matching input; require a sink that can represent each selected output change. No pipeline test ran.

**Placement:** Prefer a conditional join-semantics reference reached from `microservice-data/references/projections.md` for service-owned projections. Broker acknowledgement policy belongs in `messaging-reliability`; it does not decide this enrichment contract. [Existing projection reference](../../../../skills/engineering/microservice-data/references/projections.md), [messaging trigger](../../../../skills/engineering/messaging-reliability/SKILL.md)

## Ranked disposition

The ranking is repository-specific synthesis based on every current skill description, plus full readings of the three nearest specialist skills, their relevant references, and `architecture`. The broad architecture workflow can already handle a design request; the candidate earns a separate pointer only through a repeatable streaming semantic workflow. Scores are qualitative ordering, not measured model performance.

| Rank | Candidate | Trigger fit and boundary | Proposed disposition |
|---|---|---|---|
| 1 | Distinct `stream-processing-design` skill | A general design request to choose event/logical/processing time, changing versus final output, join semantics, or state lifetime has no narrow current trigger. It can apply within one engine, without a service split or delivery defect. | Strong research candidate. Own the result contract and semantic/state plan; disclose separate time/window, join, and backfill references. Do not copy broker recovery or service ownership workflows. |
| 2 | `microservice-data/references/projections.md` | Best existing placement when the request already concerns a service-owned read projection. Its current freshness/bootstrap rules provide the entry point. | Add conditional reference material for time/output/state contracts; preserve the existing cross-service description. |
| 3 | `distributed-system-patterns/references/serving.md` | Best existing placement for Gazette's independent replay-serving capacity and log partition choice. | Add a bounded topology branch and seam/capacity verification; reuse ownership checks. |
| 4 | `messaging-reliability/references/ordering-and-replay.md` | Useful only when retained history, late events, or consumer progress are the active reliability issue. | Link to the semantic design contract when needed; keep it focused on disposition and replay. |

A proposed positive trigger is “choose regular versus historical streaming joins and bound their state.” A countertrigger is “repair a lost consumer acknowledgement”: the existing messaging skill remains the natural entry point. A second positive trigger is “make a window append-only while stating allowed lateness”; a routine bounded in-process transformation does not justify the candidate.

The proposed skill's completion criterion should require an explicit time domain, source change model, output change model, lateness/finality rule, retained-state horizon, and a discriminating verification schedule for every selected branch. Gazette storage topology can be a disclosed reference or a link to the topology skill. The research does not justify a universal algorithm, automatic memory bound, or product-independent transaction guarantee.

## Evidence boundaries and follow-up

Current documentation was read on 2026-10-01; product pages are unversioned unless stated. RisingWave's older `/docs/current/` article links were cross-checked against current `/processing/` pages. Its old “experimental EOWC” label was not adopted as current status. Materialize's replica-expiration implementation remains historical architecture evidence; this pass did not prove its current eligibility matrix. Decodable's overview says lookup output is append, while its temporal example calls the result a change stream; verify the deployed schema/output contract instead of resolving that inconsistency by inference.

No broad “exactly once,” vendor speed, comparative cost, or automatic finality claim was imported from promotional wording. The source notes are concise paraphrases. All four verification schedules and placement decisions are original recommendations and remain unexecuted. Recommended next work is a small set of semantic evaluation cases before drafting or widening any skill pointer.
