# Sentry blog refresh

Observed 2026-10-14. The [compact receipt](sentry.json) binds the external crawler summary and deliberate reading scopes. Historical prompts, fixtures, source cards and failed attempts remain preserved.

[The general sampling article](https://blog.sentry.io/sampling-strategy-sentry/) treats errors, traces, replays and logs as independent collection decisions and shows parent decision inheritance. Its SDK snippets and replay lifecycle code were read without execution.

[The agent trace sampling article](https://blog.sentry.io/sample-ai-traces-at-100-percent-without-sampling-everything/) establishes a useful failure mechanism for `microservice-operations` and `performance-diagnosis`: a head sampling decision at the HTTP root occurs before descendant agent spans exist. Matching a later child operation cannot restore a dropped parent tree. Root or route classification must happen when the decision is made. Independently emitted metrics and logs can preserve aggregates or call records, but cannot reconstruct an omitted span tree. Missing sampled telemetry cannot establish that a tool never ran. The article contains inconsistent span arithmetic, and its cost examples were not independently verified. Preserve workload specific budgets and actual SDK/version behavior; no universal 100 percent policy is inferred.

Discovery followed the official sitemap declarations, attempted every selected child, consumed accessible metadata and unioned the verified historical inventory. 

The current external sweep reports 930 known URLs, 930 processed URL dispositions, 930 distinct article HTTP requests, 927 automatically extracted bodies, 0 fetched but unextracted responses, 0 pending URLs and 3 deliberately read articles. Automatic counts do not establish deliberate reading or a production guarantee.

A finite sitemap terminal proves only currently declared discoverability. Deleted, private and unlisted history remains unknown. Automatic extraction is separate from deliberate reading. Three category hubs were explicitly excluded. A genuine gaming article initially misclassified as nonarticle was corrected by hash verified extraction of its blog prose container; the failed initial classification remains preserved.

The final disposition explicitly excludes 3 navigation or listing URLs while preserving their historical rows and HTTP evidence.
