# Draft publication repair audit — 2 October 2026

**PUB-01 and PUB-02 are repaired in this draft. Publication remains on hold.**
This follow-up covers artifact links, source provenance and archive integrity;
it does not close behavioral regression gates. The
[previous audit](history/publication-review-01/publication-review.md) and its
[byte-hash snapshot](history/publication-review-01/snapshot.json) are preserved.
The [current structured record](publication-review.json) binds this inspection.

## Repairs

**PUB-01 — artifact links.** The cache-incarnation archive was backed up and
re-exported from the same original trial and scorer directory. The exporter
checks that scorer projections contain the same bytes before rebasing links.
Only its public review and archive manifest changed; every original artifact
hash and both raw source trees stayed unchanged. The
[re-export record](cache-publication-reexport.json) records those identities.
The index's three root links now use the correct traversal depth. The local-link
scan resolved all 621 targets across the evaluation and integration-document
trees before this audit replacement; the new audit/history links are also
checked in the structured record.

**PUB-02 — historical review source.** The
[source-correction note](review-source-correction.md) preserves both the earlier
trimmed schema review and the full scorer source verbatim, binds their hashes,
and explains the evaluator-instruction prelude. The full source ends with the
entire earlier review byte-for-byte. The archive's changed original hash is
explicitly attributed to source selection. No score, rubric or raw review was
rewritten, and the schema result remains partial.

## Executed checks

All **21 archive tests passed**, with zero failures or skips. The archive checker
accepted **25 manifests, 973 published artifacts and 1,533 source bindings**.
All **22 current index rows** match their saved score/status/candidate/compliance
records. These results establish artifact consistency, not model correctness.
This reviewer ran no model, native host, database or container.

The permitted cache re-export and new preservation records were performed by
this reviewer. Their static verification is not described as an external review
of those edits. Raw trials, scores, fixtures, verifiers, rubrics and instruction
candidates remain untouched. The result index and root documentation are owned
by the parent task and were not edited here.

## Remaining scope

The current index still contains 22 rows. Native archive 23 exists separately;
its independent score is **partial**, with `ownership_and_review` and
`isolation_and_scope` unresolved and `case_compliant=false`. Root will update
the index after ongoing regression retakes. Earlier critical partials, invalid
metadata, native verification blocks and scorer-independence qualifications
remain historical evidence. This repair does not relabel them as passes.

Further retake scores, revised candidates and index changes need new binding
checks and a follow-up audit. The user's commit/publication hold remains in
force until the separate acceptance work is resolved.
