# Uber publisher refresh, 2026-10-14

Current official US English Engineering category, including its subcategories, across all 65 declared archive pages.

Page 65 contains three records, total reported 771, with no Next link. Pages 1 through 64 each contain twelve records.

The current crawl frontier contains 771 URL identities. 771 have a frontier disposition, 771 were attempted over article HTTP, 771 have a fetched response or published body import, 771 have automatic body extraction, 0 are fetched without substantive extraction, and 0 remain pending. Deliberate reading covers 2 articles or explicitly named body sections. Automatic extraction and metadata discovery are not article reading.

[MCP Gateway](https://www.uber.com/us/en/blog/designing-mcp-gateway/) supplies a concrete missing branch for `mcp-engineering`: discovered or generated tools begin disabled, owners review definition changes, approved versions have rollback, and runtime discovery loads server, tool and schema information incrementally. This separates discovery from publication and from caller authority. A focused evaluation should reject automatic enablement after schema discovery, preserve a usable prior version while review is pending, and keep runtime discovery from granting permission.

[Retry storm protection](https://www.uber.com/us/en/blog/protecting-against-retry-storms/) adds causal error ownership to ordinary retry budgets. A propagated failure should not invite another retry at every ancestor. Missing context and coincidental failures of optional dependencies require explicit handling before suppressing a legitimate retry. The article's simplified recovery math assumes independent failures, which does not justify availability claims under correlated overload. Existing retry and overload skills may absorb this mechanism if their boundary cases are evaluated.

The companion JSON binds counts to the external crawler summary hash, verified historical inventory and coverage hashes, source terminal receipts, collector identities and deliberate reading evidence. Raw bodies, crawl logs and prior attempts remain outside the source tree.

Remaining limits:

- Completeness is relative to current official US English Engineering category, including its subcategories. Removed or uncategorized history remains unresolved.
- The first collector attempt stripped slash redirects and produced redirect loops. Failed receipts are preserved. The corrected transport was resumed against every unresolved identity.
- Early collector run hashes were recorded without an exact source snapshot. Later cache finalization archives executed collector source, while early implementation reconstruction remains a gap.
