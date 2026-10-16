# PlanetScale blog refresh

Recorded on 2026-10-14. The canonical scoped collection contains 327 article routes, with 311 substantive bodies automatically extracted and 16 returned bodies below the extraction threshold. Every scoped route was processed. Deliberate reading covered 2 selected article bodies, with current documentation reading recorded separately. Crawling and extraction do not establish reading of the full archive.

Canonical default public blog article URLs from the dedicated blog sitemap, reconciled with verified historical inventory. Product, course, case study and documentation maps were parsed but excluded from article scope.

All 328 URL elements in the dedicated sitemap were parsed, yielding 327 article routes after excluding the blog root. The root sitemap graph was exhausted. This establishes publisher declared blog discoverability, not lifetime completeness or the current client archive's pagination semantics.

Sixteen routes are video posts with short article containers and embedded media. Public HTML was fetched, but substantive prose extraction and media transcript coverage are unavailable. The initial classifier mislabeled two real MySQL tutorials as challenges because their prose said access denied. The original events remain, and corrected classifier retries retrieved both substantive bodies. Guessed feed and sitemap alias endpoints returned HTTP 404. The actual declared sitemap and RSS endpoints succeeded. The current blog archive yielded no article links to the generic HTML parser, so an empty archive extraction was not treated as proof of exhaustion.

The [schema workflow account](https://planetscale.com/blog/how-planetscale-makes-schema-changes) separates application rollout from schema deployment. Add mixed application versions and independently staged schema transitions to `infrastructure-change-safety`, or consider a dedicated schema evolution package after evaluation. Online table copying does not establish application compatibility.

The [revert internals account](https://planetscale.com/blog/behind-the-scenes-how-schema-reverts-work) explains transactional copy progress, incoming change catch up and authoritative cutover. [Current deploy request documentation](https://planetscale.com/docs/vitess/schema-changes/deploy-requests) limits revert eligibility and describes data loss, constraint and instant deployment exceptions. Add a postcutover value incompatible with the old column or constraint to `recovery-validation`; reject a guaranteed reversible claim. Retained rows do not recreate fields absent during the deployed schema.

These are research recommendations for a future candidate. No instruction behavior was changed here, no live database procedure was run, and no behavioral evaluation pass is claimed. The companion JSON binds counters, source hashes, reading scope and remaining gaps to the external archive. Historical evidence and failed attempts remain retained.
