# RabbitMQ blog refresh

Research date: 2026-10-14. Candidate identity: `2026-10-14-company-blog-refresh`. No skill behavior or adapter was edited by this publisher pass.

## Crawl evidence

Fresh exposed discovery found 181 article URLs. The preserved baseline contained 181; their union contains 181. The body crawler currently knows 181 URLs, processed 181 frontier dispositions and made HTTP article requests for 181 unique URLs, extracted 169 substantive bodies, fetched 12 additional responses without accepted text extraction, and retains 0 pending requests. Deliberate complete textual readings: 2 articles. Automatic fetch and extraction do not count as reading.

Discovery traversed 22 sitemap, feed, archive, or structured collection pages. All included finite urlsets and feeds parsed, and every exposed archive next link reached a page with no next link. No article count or pagination cap established completion.

[The compact receipt](rabbitmq.json) binds current summary and terminal discovery hashes. Raw bodies, extraction events, failed attempts, and endpoint snapshots stay in the external evidence root `/tmp/tal-skills-blog-crawl-2026-10-14`. The shared body crawler does not claim discovery completion; this pass separately records publisher-specific terminal evidence.

## Relevant additions

The [quorum queue 4.0 article](https://www.rabbitmq.com/blog/2024/08/28/quorum-queues-in-4.0) now warns that its two-level priority behavior was superseded. [Current 4.3 documentation](https://www.rabbitmq.com/docs/quorum-queues) defines strict priority levels, returned-message ordering exceptions, distinct acquisition and failed-delivery counters, configurable delayed retry, and protocol-specific consumer timeout behavior. Existing `messaging-reliability` already covers counter differences and quarantine transfer. A narrow upgrade checklist can add version-specific priorities and disposition details. Proposed verification: redeliver a high priority message, let a consumer time out, and exhaust the delivery limit with its quarantine target unavailable. Assert expected ordering, attempt accounting, and retained recovery state. Do not preserve a historical fairness ratio as current behavior.

The [stream delivery optimization](https://www.rabbitmq.com/blog/2025/09/26/stream-delivery-optimization) shows why sparse ingress and small stored chunks can make historical consumption slower despite low current input. Read ahead reduces file operations for small chunks within its byte limit. Existing `performance-diagnosis` can measure ingress, stored chunk geometry, protocol, and replay throughput separately. Proposed verification: hold total historical messages constant while varying chunk size and protocol, then compare system calls and throughput with read ahead enabled and disabled. Published throughput ratios apply to the reported testbed. Full textual bodies and commands were read; graph pixels were not inspected and no RabbitMQ runtime ran.

## Limits and disposition

Discovery establishes exposed current publisher collections, not every article ever published. Deleted, private and unlisted articles remain outside this proof. Automatic extraction is separate from deliberate reading. All unread article bodies remain a reading coverage gap. The shared crawler used bodies-only mode. Its discovery_complete field is false; publisher-specific terminal discovery is bound separately in this receipt. 12 successful responses did not pass the shared substantive extraction threshold. Raw responses remain preserved. Initial sitemap probes hit an unavailable BeautifulSoup XML parser. The raw responses and failed probe records were retained, and subsequent ElementTree discovery parsed them successfully. The public robots.txt endpoint returned HTTP 404. Sitemap and blog archive discovery remained accessible. Recommendations and failure schedules remain proposed, with no independent behavior score. Existing skill ownership is preferred; these readings alone do not justify another promoted skill.
