# Corrected independent delivery judgment, revision 01

The independent grader's [corrected score](score.corrected-01.json) is **11/14,
partial**, including critical `broker-boundary` at 1/2. The major criteria
`minimal-allocation` and `verification` remain at 1/2. The
[corrected review](review.corrected-01.md) and preserved
[grader correction provenance](grading-correction-provenance-01.md) explain that
the sealed answer omits both original required detector inputs: current in-flight
share and recent processing-time share. No new threshold or criterion was added.

The [initial 12/14 score](score.initial-01.json) and
[initial review](review.initial-01.md) are retained as exact grader-preserved bytes.
The archive's original [score.json](score.json), [review.md](review.md),
[base manifest](archive-manifest.json) and every other existing artifact remain
unchanged. They describe the initial judgment, not the corrected result.
This append-only supplement makes the corrected judgment separately selectable
without silently replacing the historical record.

The [exact field comparison](grading-correction-diff-01.json) records only two
score JSON changes: `broker-boundary.score` from 2 to 1 and that criterion's
evidence observation. All other fields and all original rubric, candidate and
subject artifacts are unchanged. Source and published hashes are bound by the
[correction supplement manifest](grading-correction-01-supplement-manifest.json).
All five preserved grader files required no publication transformation.

This correction is the original independent grader's exact-rubric audit, not a
new subject run or an exporter-authored grade. Raw `case_compliant=false` and
filesystem read isolation limits remain unchanged. The review concerns proposed
checks and design reasoning; it supplies no live-host or production guarantee.
