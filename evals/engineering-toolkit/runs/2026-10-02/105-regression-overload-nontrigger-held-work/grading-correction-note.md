# Preserved nontrigger grading correction

The independent grader retained its [initial score](initial-score.json) and
[initial review](initial-review.md), then corrected its judgment after auditing
the unchanged original criterion. The [correction provenance](correction-provenance.json)
binds the original and corrected raw hashes and explains the reassessment.

The initial judgment was 5/6, with nontrigger 1/2. The [corrected score](score.json)
is 6/6, with nontrigger 2/2. The [corrected review](review.md) explains why requiring
universal proof of no unrecorded loading added a condition absent from the
original rubric. This note records the grader's reassessment; it does not rescore
the response or alter trial inputs, candidate instructions or rubric.

The owner's provenance summarizes two score fields. Independent publication
comparison finds four changed paths within the same nontrigger criterion: score,
evidence observation, evidence artifact and evidence locator. The
[supplement manifest](grading-correction-supplement-manifest.json) records every
actual before/after value. No other score JSON field changed. The owner's source
provenance remains byte-for-byte unchanged; this supplement makes its summary
complete without rewriting the original record.

The initial review's original wording is retained, including its claim that it
added no stricter requirement; the later correction explains the disagreement.
Captured activation remains `not_observed`, filesystem read isolation remains
false and raw `case_compliant=false` remains unchanged. The corrected behavioral
judgment does not establish universal nonloading or host isolation.
