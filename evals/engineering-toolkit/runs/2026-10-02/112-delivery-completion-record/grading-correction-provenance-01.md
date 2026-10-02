# Score correction provenance

The original `score.json` and `review.md` were preserved byte-for-byte as `initial-score.json` and `initial-review.md` before correction.

Changed fields: `criteria[id=broker-boundary].score` changed from 2 to 1, and its evidence observation now records the omitted rubric clause; `review.md` row and critical-score/result summary were updated accordingly. Cause: exact-rubric audit found the observable answer (`evidence/answer.md`, line 3) does not mention either detector input required by the rubric: current in-flight share or recent processing-time share. The answer covers the remaining broker-boundary points, so this is partial. No threshold requirement was added. The raw trial and candidate artifacts were not changed.
