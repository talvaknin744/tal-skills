# Tailscale blog refresh

Observed 2026-10-14. The [compact receipt](tailscale.json) binds the external crawler summary and deliberate reading scopes. Historical prompts, fixtures, source cards and failed attempts remain preserved.

[The application capabilities article](https://tailscale.com/blog/app-capabilities) supplies a proxy boundary example for `microservice-integration`. The proxy forwards selected peer capabilities in an HTTP header; the application still interprets those capabilities and enforces its own authorization.

[Current Serve documentation](https://tailscale.com/docs/features/tailscale-serve) specifies Tailscale version 1.92 or later, incoming capability header stripping and no equivalent capability headers for public Funnel traffic. A directly reachable backend can accept forged assertions, so documentation recommends listening on localhost. That restriction still leaves other local services inside the trust boundary. Proposed checks should cover a legitimate proxy request, a forged direct request, absent capability, malformed capability data and permission mismatch. No Tailscale configuration was changed, no network test was run, and this selected design does not establish a new general identity skill.

Discovery followed the official sitemap declarations, attempted every selected child, consumed accessible metadata and unioned the verified historical inventory. 

The current external sweep reports 407 known URLs, 407 processed URL dispositions, 407 distinct article HTTP requests, 404 automatically extracted bodies, 3 fetched but unextracted responses, 0 pending URLs and 4 deliberately read articles. Automatic counts do not establish deliberate reading or a production guarantee.

A finite sitemap terminal proves only currently declared discoverability. Deleted, private and unlisted history remains unknown. Automatic extraction is separate from deliberate reading. Three real short article bodies do not pass the automatic 120 word extraction threshold. Their HTTP responses are retained; automatic extraction coverage is incomplete.
