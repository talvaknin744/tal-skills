# Historical schema-review source correction

The first unpublished schema-partial archive contained a trimmed reviewer body.
Its later export used the full scorer review file, including the evaluator
instructions before that same body. This is a source-selection correction;
it is not evidence that every archived review retained identical original bytes.
Root identified a case-insensitive `REVIEW.md`/`review.md` scoring-file alias.

Both versions are preserved verbatim as historical text:

- [Earlier trimmed source](history/schema-review-source-correction/trimmed-review.original.txt), SHA-256 `20cfc1210f8790003f08b8661b4c72776f6dcbbbeadebcf83df7c214c23e2207`.
- [Full scorer source](history/schema-review-source-correction/full-scorer-review.original.txt), SHA-256 `ae0ca99f4d86b64540db180e18d4724b0ac5cfa73399b6121d5a7f00084bf199`.

The full source ends with the complete trimmed source byte-for-byte. These text
snapshots retain their historical local locators and are not executable links.
The [current archive review](../../../evals/engineering-toolkit/runs/2026-10-02/02-schema-rollout-partial/review.md)
uses the full source identity and rebases its public artifact link separately.
The [structured correction](review-source-correction.json) binds both source
versions, the archive manifest and the public copy.

No raw evaluation input, score or rubric was changed. The original partial
outcome and its critical gates remain partial. Publication is still on hold
while the separate behavioral regression gates are addressed.
