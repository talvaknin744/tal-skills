# Metadata collector source

These scripts created the 2026-10-01 metadata snapshot. Fetched source bodies are transient; only metadata is saved. The common fetcher waits at least 1.05 seconds between request starts to the same host and uses 8/25-second connect/read timeouts. A final pass records response SHA-256 and UTC access time, explicitly separate from the initial extraction responses whose hashes were not captured.

Run against a fresh dated output directory after checking current publisher interfaces:

1. `harvest.py` probes official robots/sitemap routes.
2. `enumerate.py` exhausts the selected sitemap branches and filters collection routes.
3. `enrich.py` follows Honeycomb/Grafana pagination, Microsoft metadata pages and Fly's single archive/feed.
4. `google-archive.py` follows Google Research's declared pagination.
5. `aws-archive.py` follows only the public Builders Library tag with `pageSize=100` and cursor completion.
6. `metadata.py` parses limited feeds and six article metadata pages; it does not read body prose.
7. `freeze.py` merges canonical metadata, records declared terminals, exclusions and unknown date coverage, and attaches the separately authored deep-read records.
8. `revalidate-provenance.py` records hashes/times for requested endpoints with response bodies discarded.
9. `source-provenance.py` records final hashes for the deep-read references and current-contract sources.

The deeply read article records are human research inputs to the freeze step. Metadata collectors do not generate those findings or mark an article as read. Manual failed endpoint probes from the original discovery pass are summarized in the frozen coverage file; a refresh need not repeat guesses that were ruled out.

The source is retained for inspectability, not as a generic web crawler. Each publisher's finite collection scope and terminal assumptions are explicit. `requests` and `beautifulsoup4` were already installed; no new dependencies were installed for this pass.
