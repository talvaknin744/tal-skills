# Netflix continuation r03, 2026-10-14

The one time resumable public feed collector is stopped. It uses the same ordinary request identity, serializes all HTTP requests through a shared 60 second start budget, preserves every response and stops on the first HTTP 429, source HTTP 403 or explicit verification challenge. Frozen r01 and r02 files remain unchanged.

The live checkpoint records 785 source fetch operations, 785 actual HTTP requests and 785 successful feed responses in this phase. It retains 1775 RSS body occurrences across 576 distinct post IDs. The cumulative inventory has 596 logical URLs, 596 post IDs and 577 automatically extracted bodies. There are 17 original body gaps and 0 unresolved documented feed routes. No individual article HTTP requests or new deliberate article reads occurred.

[Medium documents the publication tag feed schema](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics). Each queued route retains exact publisher sitemap or RSS category routing proof. Successful sources carried from earlier phases are cached. New categories and explicit in scope next links are followed without a successful feed target. Author display names do not supply routing proof for additional writer feeds.

The companion JSON identifies the process, collector source, immutable checkpoint and pending source frontier. Raw attempts, request timing, bodies, extraction text and checkpoint history remain external. Current state exports are derived from the resumable SQLite state. Scoped feed exhaustion would still leave lifetime discovery and visual completeness unresolved. A successful cooldown response is separate from a host availability guarantee.

The collector stopped with reason: no_pending_source_routes.
