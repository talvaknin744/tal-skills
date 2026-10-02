# Native grading history and metadata corrections

The [initial 15/16 score](score.initial-15-16.json) and
[initial review](review.initial-15-16.md) are retained. The grader's
[current 16/16 review](review.md) adds separately authorized bounded source/config
qualification to the same original eight criteria. The qualification uses the
same binary version/hash, a different Linux image, and does not enumerate every
runtime tool or prove production behavior. Raw `case_compliant=false` remains.

The [16/16 root-schema original](score.root-schema-original.json) precedes the
[one-field root correction](metadata-correction.json). The
[pre-binding score](score.schema-original.json) then precedes the
[explicit evidence-binding addition](metadata-bindings-correction.json).
The root correction changes only `trial_root`; the binding correction adds only
`bindings`. All numerical grades, criteria, trial inputs and inventory remain
unchanged through those metadata corrections. The earlier grading reassessment
is recorded separately and is not described as a metadata-only change.

The [original rubric](rubric.original.json) and [current score](score.json) are
retained with the original trial. These records do not rerun or regrade a model.
All original file hashes and published hashes appear in the
[supplement manifest](grading-history-supplement-manifest.json). Public copies
normalize local paths only; raw scorer originals remain unchanged at their
recorded sources. Host and production limitations remain in the review.
