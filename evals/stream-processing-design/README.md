# stream-processing-design evaluation cases

These original fixtures are evaluation inputs, not behavioral results. Follow
the repository's [evaluation procedure](../README.md), exposing only the selected
prompt, isolated fixtures, candidate skill, and stated capabilities. Keep this
guide and cases.json outside the evaluated agent's workspace. The nontrigger
uses normal discovery with no explicit skill invocation.

All three cases are read-only and need no internet or services. Capture the
answer, tool trace, and workspace diff; an independent scorer uses the rubric.
Keep proposed engine checks distinct from actual observations.

- `window-finality`: Out-of-order events, repeated identity, correction,
  old-revision replay, conflict, and late input compose with required partition
  progress and immutable output.
- `historical-enrichment`: Historical lookup differs from latest lookup and
  maintained-current joins; dimension corrections/deletion require output and
  retained-history semantics.
- `local-date-group-nontrigger`: Completed local row grouping preserves intended
  duplicate rows without introducing streaming operators or lateness policy.

Corpus integrity and package validation do not establish behavioral quality.
