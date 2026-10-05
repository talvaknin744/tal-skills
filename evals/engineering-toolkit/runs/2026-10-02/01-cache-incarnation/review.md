# Independent cache trial review

Result: **pass**. All six criteria score 2, including all five critical gates.
Reviewer: `/root/archive_quality`; authored neither the candidate skill nor the
response/cache fixture. The reviewer authored separate rollout fixtures.

The final [service.py](../../ARCHIVE.md)
uses the supplied atomic publication transition and one paired source snapshot.
It preserves the miss callback and cache-hit path. Protected literal-state checks
cover incarnation recreation, payload/token pairing, retained floors after JSON
restoration, per-key order, a competing publication and capture counts. The
overlapping read retains its captured result while its delayed fill leaves newer
cache state intact.

Candidate command `item_14` at `evidence/trace.jsonl:31` exits 0 with six passing
checks. The sealed [independent check](../../ARCHIVE.md) binds the same
run/candidate/final project and exits 0 without check-workspace changes. I also
ran `python3 -B verify.py` read-only from the scoring package's `final-project`:
`{"checks":6,"failures":[],"passed":6,"scope":"local specified adapters"}`.
Protected contract/model/verifier bytes match the originals. Only `service.py`
changed in the trial; no candidate/project/evidence file was modified during
this review.

`node scripts/evals/cli.mjs check-score --trial /TRIAL --rubric /SCORING/rubric.json --score /SCORING/score.json`
exited 0, returned `rubric_result: pass`, and accepted the matching
`independent-01` verifier. Detailed artifact and event locators are in
[score.json](score.json); template identity fields were retained.

Metadata discovery and the recorded entrypoint/cache-reference body reads are
separate observations. This is a single-skill implementation trial with
subagents disabled, not evidence of coordinator/native-role workflow behavior.
Host restrictions remain incompletely enforced, so `case_compliant: false`
stays visible despite the task pass. The checks establish use of trusted specified
in-process adapters and JSON serialization; they do not establish real
Redis/database atomicity, missing-notification recovery, metadata-loss safety,
multi-process execution or crash-safe persistence. The response explicitly bounds
its claims to those supplied adapters and contract scope.
