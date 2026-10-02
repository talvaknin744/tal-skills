# Native grading metadata correction

The [pre-binding score](score.schema-original.json) is retained alongside the
[metadata correction record](metadata-bindings-correction.json). The correction
adds only the explicit `bindings` field with hashes of copied raw evidence files;
all other score fields are unchanged. The independent score remains 22/22.
Original and final edited-file hashes remain distinct in `original_inputs`, and
runner/source qualification references remain separate from copied bindings.

The [original rubric](rubric.original.json) and [current score](score.json) are
retained with the original trial. These records do not rerun or regrade a model.
All original file hashes and published hashes appear in the
[supplement manifest](grading-history-supplement-manifest.json). Public copies
normalize local paths only; raw scorer originals remain unchanged at their
recorded sources. Host and production limitations remain in the review.
