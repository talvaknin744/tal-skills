# Pinterest public feed continuation r01

Checked 2026-10-14. This additive continuation preserves the original [publisher report](../../publishers/pinterest.md) and its raw archive. [Compact evidence](pinterest.json) binds the new source, field and reader hashes.

## Recovery and remaining frontier

[Medium's official RSS contract](https://help.medium.com/hc/en-us/articles/214874118-Using-RSS-feeds-of-profiles-publications-and-topics) documents profile feeds and publication feeds filtered by tags. The earlier Pinterest root feed exposed 27 tags. Those feeds and the official writer profile recovered 68 unique substantive article content fields, including two of the three previously blocked URLs. This adds 58 RSS bodies beyond the parent's ten. Article hyperlinks in those first party fields ground another 40 URLs. With the original frontier, 110 unique transport URLs are now known, 97 more than before, including the separately discovered cache article.

A public primary reader snapshot adds the 2020 cache article's substantive body. The combined evidence covers 69 URLs, with 41 known URLs still lacking body evidence. No fresh canonical article HTTP request was issued. Seeing a hyperlink is discovery, not retrieval. The raw field, extraction and three deliberate readings remain separate evidence stages.

The pilot made 28 source requests. Recursive expansion adopted a shared Medium request start gate with Netflix and Airbnb, spaced at least 1.5 seconds globally. The next three grounded tag feeds returned HTTP429 with no Retry After header. The circuit stopped and both other owners were notified to stop Medium requests. In total 27 source requests succeeded, four returned429. The observed graph contains 85 tags, with 55 feeds still unrequested. No authentication, user agent or alternate representation workaround was attempted.

Finite RSS entries, rare tag feeds and the first ten exposed rows of a public year archive do not establish complete historical discovery. RSS dates are publisher metadata and can reflect migration. An in publication localized article remains a transport URL, without a claim that it is a distinct intellectual work. Medium excludes full paywall stories from RSS, and every recovered field's story completeness has not been independently checked.

## Reading findings

[An Engineer's Guide to Better AI Skills](https://medium.com/pinterest-engineering/an-engineers-guide-to-better-ai-skills-implementing-a-testing-process-to-optimize-agent-a000c9c9abcd) reinforces measuring activation and false positives independently and repeating trials against pinned host, model and candidate identities. Invocation logs alone do not establish correct task execution. A discriminator is a visibly loaded skill whose resulting artifact violates the task contract. The article's internal Codex fork, selected model versions and regex based invocation detection were not reproduced. Its description and all caps experiments do not justify changing this repository's established activation boundaries or description contract.

[Building an MCP Ecosystem at Pinterest](https://medium.com/pinterest-engineering/building-an-mcp-ecosystem-at-pinterest-d881eb4c16f1) distinguishes registry approval, authenticated user identity, mesh service identity and per tool authorization. A broadly reachable chat integration must not silently grant sensitive data access. This informs existing `mcp-engineering` work. A discriminator supplies a spoofed forwarded user header or lacks the required business group despite reaching an approved server. The internal Envoy and SPIFFE design differs from standard portable MCP OAuth flows. Its implementation, governance and time saved estimates were not verified.

[Scaling Cache Infrastructure at Pinterest](https://medium.com/pinterest-engineering/scaling-cache-infrastructure-at-pinterest-422d6d294ece) connects shared proxy routing, fallback pools and hot key load. Consistent hashing reduces remapping during topology changes but does not solve hot keys. This informs `overload-control` and `infrastructure-change-safety`: test a failed pool during a hot key burst and a globally bad routing configuration, checking fallback and origin capacity. The 2020 architecture and reported scale are historical. The primary reader snapshot had an older cache note; images and runtime claims were not reproduced.

## Verification and limits

All 68 retained RSS fields and their source responses match their SHA256 bindings. The three selected readings match their evidence hashes, URL counters were independently recomputed, and seven bound original report and archive files stayed unchanged. The first pilot parsing failure, repaired candidate and later rate limit attempts remain archived. No instruction edits or behavioral evaluations were run. The remaining feeds require the host rate limit to clear before ordinary published source requests can continue.
