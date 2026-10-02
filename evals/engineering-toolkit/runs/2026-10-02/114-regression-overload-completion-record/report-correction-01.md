# Report filename correction, revision 01

The [actual independent narrative](review.corrected-01.md) is now available as a
separate, versioned report. The [literal original filename copy](lowercasereview.original-01.md)
retains the same narrative bytes. The [score](score.json) remains **10/10** with no
changed field, criterion, candidate, rubric or subject result.

The coordinating instruction mistakenly named the narrative file
`lowercasereview.md`. The grader used that literal filename, which was already
present before the initial export. The exporter expected `review.md`; on the
case-insensitive host it addressed the same file as `REVIEW.md`, still containing
the original grader instructions. Consequently the initial archive's
[review.md](review.md) is an instruction document, not the independent narrative.
It and all other initial artifacts remain unchanged to preserve that defect.
The [original grader instructions](grader-instructions.original.txt) also remain.

After notification, the grader copied the exact narrative from the literal
`lowercasereview.md` source to the expected `review.md` source. Publication then
retained both as new versioned artifacts. Their identical SHA-256 is
`b346311e398fd7e7fede22cec62197f696b476058e688e8d42b600d6da161aef`.
The original and current raw score SHA-256 remains
`c54e69e5c97ccfde001348d732f140c48821928913535edad1a4dc68f4b87be0`.
The [supplement manifest](report-correction-01-supplement-manifest.json) binds
these bytes to the unchanged [initial manifest](archive-manifest.json).

This is a report-location correction only. No new model execution or scoring
occurred. The preserved narrative's wording and reviewer self-description are
unchanged. Its proposed-check and host-isolation limitations remain applicable;
raw `case_compliant=false` and filesystem read isolation limits were not altered.
