# PostHog blog refresh

Observed 2026-10-14. The [compact receipt](posthog.json) binds the external crawler summary and deliberate reading scopes. Historical prompts, fixtures, source cards and failed attempts remain preserved.

[PostHog's migration design](https://posthog.com/blog/async-migrations) addresses long background data work in installations the provider does not control. It combines a supported software version window, an upgrade completion gate, durable progress, service dependencies, initial and repeated health checks, and interruption recovery. A schema based requirement check lets a fresh installation skip historical work that is already unnecessary. This fits `background-maintenance` and `technical-deprecation` better than a new package.

Proposed verification should separate a fresh schema, an interrupted old installation, a failed headroom check and an attempted upgrade beyond the compatibility window without a completion record. The 2022 article's ClickHouse examples concern nonreplicated tables. No present platform support, safe rollback implementation or zero downtime guarantee was independently established. This complete direct body read resolves the older selected article reading gap, while preserving the historical failed web reader attempt.

Discovery followed the official sitemap declarations, attempted every selected child, consumed accessible metadata and unioned the verified historical inventory. 

The current external sweep reports 369 known URLs, 369 processed URL dispositions, 369 distinct article HTTP requests, 316 automatically extracted bodies, 0 fetched but unextracted responses, 0 pending URLs and 1 deliberately read article. Automatic counts do not establish deliberate reading or a production guarantee.

A finite sitemap terminal proves only currently declared discoverability. Deleted, private and unlisted history remains unknown. Automatic extraction is separate from deliberate reading. The historical and current one slug scope includes category listing shells. Fifty three listing shells were explicitly excluded without deleting their known URL rows or earlier HTTP attempts. They are not missing article bodies.

The final disposition explicitly excludes 53 navigation or listing URLs while preserving their historical rows and HTTP evidence.
