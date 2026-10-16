# Temporal blog refresh

Research date: 2026-10-14. Candidate identity: `2026-10-14-company-blog-refresh`. No skill behavior or adapter was edited by this publisher pass.

## Crawl evidence

Fresh exposed discovery found 441 article URLs. The preserved baseline contained 433; their union contains 441. The body crawler currently knows 441 URLs, processed 441 frontier dispositions and made HTTP article requests for 441 unique URLs, extracted 441 substantive bodies, fetched 0 additional responses without accepted text extraction, and retains 0 pending requests. Deliberate complete textual readings: 2 articles. Automatic fetch and extraction do not count as reading.

Discovery traversed 3 sitemap, feed, archive, or structured collection pages. All included finite urlsets and feeds parsed, and every exposed archive next link reached a page with no next link. No article count or pagination cap established completion.

[The compact receipt](temporal.json) binds current summary and terminal discovery hashes. Raw bodies, extraction events, failed attempts, and endpoint snapshots stay in the external evidence root `/tmp/tal-skills-blog-crawl-2026-10-14`. The shared body crawler does not claim discovery completion; this pass separately records publisher-specific terminal evidence.

## Relevant additions

The [Standalone Activities announcement](https://temporal.io/blog/standalone-activities-durable-job-processing-now-in-public-preview) and [Pub/Sub bridge](https://temporal.io/blog/bridging-pub-sub-to-temporal-with-standalone-activities) describe durable jobs started directly by clients. The bridge acknowledges its source message after the bridge Activity returns and derives identities from a file path. Treat that identity choice as a domain assumption: a new file revision at the same path can represent different intent.

The [current concept documentation](https://docs.temporal.io/standalone-activity) now marks Standalone Activities generally available, while some operator and batch controls remain preview. It separates running execution conflict policy, closed execution reuse policy, and effect idempotency. Reuse policy defaults to allowing duplicates and examines retained executions only. A retry restarts Activity code; cancellation remains cooperative. The [Python feature guide](https://docs.temporal.io/develop/python/activities/standalone-activities) distinguishes durable start from waiting for completion and names its SDK and CLI prerequisites.

Existing `temporal-reliability` can add an external source handoff branch without requiring a Workflow. Proposed verification: lose a start reply, redeliver while running, redeliver after completion, expire retained execution history, and send a new revision under the same resource path. Assert the selected logical job count, upstream acknowledgement boundary, and external effect count independently. A retained Activity ID does not make repeated external writes safe. Workflow history replay cannot establish compatibility for a standalone execution that has no Workflow history. No Temporal runtime or snippet ran. Current documentation checks covered concept semantics and the Python start, result, identity, and prerequisite sections; other SDKs and hosted eligibility were not tested.

## Limits and disposition

Discovery establishes exposed current publisher collections, not every article ever published. Deleted, private and unlisted articles remain outside this proof. Automatic extraction is separate from deliberate reading. All unread article bodies remain a reading coverage gap. The shared crawler used bodies-only mode. Its discovery_complete field is false; publisher-specific terminal discovery is bound separately in this receipt. Initial sitemap probes hit an unavailable BeautifulSoup XML parser. The raw responses and failed probe records were retained, and subsequent ElementTree discovery parsed them successfully. Recommendations and failure schedules remain proposed, with no independent behavior score. Existing skill ownership is preferred; these readings alone do not justify another promoted skill.
