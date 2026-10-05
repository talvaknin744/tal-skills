# Backend deep reads: interface evolution and real-time dataflow

Research accessed **2026-10-01**, followed by approved reference implementation on the same date. The initial reading phase changed no skills or code. The subsequent phase added P1's affected-path telemetry and effective-version checks to `microservice-integration/references/compatibility.md` and its source ledger. No deployment, runtime experiment, or model evaluation was performed. Proposed behavioral checks below remain validation specifications, not results.

The two edited skill references passed package-local link/anchor and whitespace checks and independent read-only technical review. The implementation-time repository packaging check found a link escaping a different skill package; that issue was reported to its owner. No skill entrypoint or trigger changed. The ranked placements below preserve the initial recommendations; only P1's compatibility/source additions were implemented by this agent.

## Selection and exact reading scope

Before selecting, every existing `.json` and `.md` record under `docs/research/engineering-toolkit` was read and searched for both selected URLs, slugs, and titles. Neither article appeared in the historical records. The concurrent 2026-10-01 publisher indexes identify them as new metadata-only discoveries; enumeration is not a prior full read. The machine-readable companion retains the scan manifest and matching paths. Existing Shopify monolith/background-job reads, GitHub MySQL migration, Slack Shipyard, and Slack agentic-testing candidates were excluded. This cannot establish unrecorded human reading history.

| Article | Publication | Read scope | Limits |
| --- | --- | --- | --- |
| [How Shopify Manages API Versioning and Breaking Changes](https://shopify.engineering/shopify-manages-api-versioning-breaking-changes), Tom Newton | 2019-12-17, displayed date | Complete main prose, examples/list, both charts and captions; embedded [ShopifyEng code example](https://gist.github.com/ShopifyEng/d7e676b2cc5510d819301baecc97eb2e) also inspected through its linked raw source. | Historical internal Ruby tooling, not a current public SDK contract. Gist web extraction failed; raw source succeeded. No further-reading articles were counted. |
| [Real-time Messaging](https://slack.engineering/real-time-messaging/), Sameera Thangudu | 2023-04-11, displayed date | Complete main prose from introduction through conclusion; discovery, connection setup, message journey, and transient-event flow diagrams visually inspected. | Other traffic plots and typing UI image were not separately inspected; no benchmark numbers are adopted. Native Slack architecture is a historical account, not the public app API or an ordering/commit guarantee. |

Article HTML and media reads were sequential; archive agents were notified before host reads. No article bodies were saved.

## P1 — Evolve the behavior consumers actually use

- **Trigger:** an API change alters validation, errors, meaning, callbacks, or required inputs while old consumers remain supported.
- **Problem:** a shape-only diff misses migration work; aggregate request counts conceal affected consumers.
- **Mechanism:** name the change, compare consumer behavior, preserve supported variants, and instrument affected paths with consumer/version context. Shopify's historical tooling distinguishes definite from possible impact; this is an example, not a required implementation. [Article](https://shopify.engineering/shopify-manages-api-versioning-breaking-changes)
- **Limits:** telemetry covers observed paths and its observation window. An absence of events does not establish absence of infrequent/offline consumers. Current Shopify policy covers specified surfaces; it does not automatically cover every Shopify interface. [Current versioning documentation](https://shopify.dev/docs/api/usage/versioning)
- **Counterexample:** unchanged JSON fields with stricter validation can break a client. A requested retired version can silently resolve to another contract.
- **Verification:** documentary crosscheck performed. Proposed fixture: supported old/new consumers, changed errors/validation, old callback payloads, and an infrequent caller; verify both the result and whether impact instrumentation detects the affected path. Compare requested and returned versions in an isolated client fixture. No calls were executed.

The current Shopify documentation specifies minimum 12-month stable support, overlap, fall-forward for inaccessible versions, and `X-Shopify-API-Version` as the served version. Its diagram labels `2025-10` unsupported on October 1 while the table lists accessibility until October 16; no precise retirement-date conclusion is drawn from that mismatch. The reusable recommendation is to inspect the effective contract and target policy. [Current versioning documentation](https://shopify.dev/docs/api/usage/versioning)

## P2 — Separate shard routing from subscription fanout

- **Trigger:** a service sends keyed updates to many connected clients across regions.
- **Problem:** partition count, gateway connections, subscribed regions, and recipient count have different capacity effects.
- **Mechanism:** trace the routing key to its serving node, then relay to subscribed gateways and their subscribed clients. Slack's diagram separates discovery configuration, regional connection state, and two fanout stages. [Article](https://slack.engineering/real-time-messaging/)
- **Limits:** consistent hashing establishes routing, not durable movement, exclusive write authority, ordering, or subscription readiness. Consul `stale` reads have no maximum staleness; `default` has an election caveat. The actual client/query mode must be checked. [Consul consistency modes](https://developer.hashicorp.com/consul/api-docs/features/consistency)
- **Counterexample:** one popular channel remains hot after adding shards. A connected gateway with a missing subscription can still miss updates.
- **Verification:** documentary crosscheck performed. Proposed fixture: one channel, several gateways/regions, and known recipients; measure relays separately from deliveries, then delay subscription/config refresh. Assert the declared audience/readiness rule and explicitly account for hot-key load. No topology experiment was run.

This is a reference example of composing patterns. Slack does not supply enough detail here to claim gap-free bootstrap, cross-region order, or an atomic store-and-broadcast transaction.

## P3 — Give durable updates and ephemeral signals different contracts

- **Trigger:** chat/state changes share a delivery system with typing/presence signals.
- **Problem:** treating every signal as durable creates inappropriate replay; treating every update as ephemeral can lose required state.
- **Mechanism:** classify persistence and recovery before selecting the delivery path. Slack's message-flow diagram stores a message in Vitess; its transient flow routes typing directly through gateways/channel servers. [Article](https://slack.engineering/real-time-messaging/)
- **Limits:** the article does not specify replay retention or freshness expiry. Public Slack Events API delivery is best effort with bounded retries; it is not proof of the native client path. `user_typing` is documented for legacy RTM, which granular-permission apps cannot use. [Events API](https://docs.slack.dev/apis/events-api/), [typing reference](https://docs.slack.dev/reference/events/user_typing/), [legacy RTM](https://docs.slack.dev/legacy/legacy-rtm-api/)
- **Counterexample:** replaying an old typing indicator after reconnect falsely implies current activity; discarding a missed durable change leaves stale client state.
- **Verification:** documentary crosscheck performed. Proposed fixture: delay an ephemeral signal beyond its declared freshness budget, disconnect during a durable update, and reconnect. Require stale ephemeral activity to expire and durable state to recover under the explicitly supported recovery contract. The expiry/recovery procedure is application synthesis, not a reported Slack implementation.

## Ranked existing-reference placements

| Rank | Target | Existing coverage inspected | Smallest proposed addition |
| --- | --- | --- | --- |
| 1 | `skills/engineering/microservice-integration/references/messaging.md` | Fact/command distinction, publication handoff, acknowledgements, and delivery limits are already covered. | A conditional durable-versus-ephemeral branch with declared freshness and recovery needs. Do not apply durable replay checks to every typing signal. |
| 2 | `skills/engineering/distributed-system-patterns/references/serving.md` | Shard keys, hot keys, routing maps, topology changes, and hashing limits are already covered. | Two-stage interest-filtered fanout example; distinguish subscribed relays, connected clients, and application readiness. |
| 3 | `skills/engineering/microservice-integration/references/compatibility.md` | Behavioral meaning, errors, old/new combinations, usage and retirement are already covered. | A compact case connecting affected-path telemetry to consumer migration burden; requested versus effective version as a platform-specific example. |
| 4 | `skills/engineering/technical-deprecation/references/consumer-evidence.md` | Observation windows, unknown callers, representative behavior, and evidence scope already exist. | At most a cross-link to P1's path instrumentation; avoid duplicating migration workflow. |

Also inspected the relevant skill entrypoints, distributed ownership/colocated-helper references, technical migration gates, messaging ordering/replay, microservice-data projections, concurrency projection-rebuild, recovery recovered-history, and UI composition. An independent read-only agent audited the placements and agreed that all three practices fit existing references. Their existing bootstrap and recovery guidance lowers the case for a broad new skill.

## Distinct new-skill opportunity — recommendation only

Candidate **`client-subscription-lifecycle`**: use when designing live/offline client subscriptions for collaborative applications. Its possible distinctive unit is registration/removal ownership, changing interests, reconnect cursor versus reset, stale connection generations, and client usability while state catches up. Existing topology, messaging, projection, and recovery references already cover snapshot continuity and state reconciliation. The possible new scope is the client-visible subscription lifecycle, not those general mechanisms.

**Do not create from these two articles alone.** Neither establishes a complete client lifecycle or current native implementation guarantees. First research a concrete client-sync task and consider a focused reference linked from `microservice-integration/references/ui-composition.md`, composing the existing mechanisms. A standalone skill needs evidence for a distinct end-to-end workflow and trigger. This is a future opportunity recommendation; root decides any skill creation or promotion.

## Current crosscheck boundaries

Current documentation was accessed 2026-10-01. Shopify and Slack docs are rolling, unpinned pages; Consul displayed **v2.0.x (latest)**, not an exact patch. Verification sources are targeted contract reads, not additional article deep reads. Documentation supports the stated limits; it does not validate runtime behavior in this repository.
