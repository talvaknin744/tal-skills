# Schema evolution cases

These cases belong to the optional `worker-rollout-integration` suite and target
`infrastructure-change-safety`. The three original entries remain preserved;
the fourth is a versioned input correction. They do not replace the historical
evaluation corpus.

| Case | Mode | Boundary |
| --- | --- | --- |
| `backfill-recreated-identity` | Implementation | Split source reads and a revision reused after delete/recreate |
| `shard-publication-rollback-floor` | Review | Partial shard publication, old writers, rollback representability and equal-count errors |
| `migration-comment-only` | Nontrigger with a bounded edit | A SQL comment correction with no migration/deployment request |
| `shard-publication-rollback-floor-v2` | Review | The original shard/writer/row evidence plus an authoritative status-code contract |

The runner copies only each declared `fixtures/` tree into its project workspace.
Prompts and the grading rubric live in [cases.json](cases.json); the rubric and
this corpus's calibration records are excluded from the copied raw workspace.
Implementation cases preserve the protected contract, authority and verifier
files and permit only the declared application/comment edit.

[calibration.json](calibration.json) records actual local baseline and scratch
control runs. Both editable baselines fail their protected check; bounded repairs
in temporary copies pass. These are evaluator-authored calibration controls,
with zero model trials. The backfill verifier compares literal complete row sets
including deleted identities and unrelated rows; it does not call the migration
code to derive expectations. Its authority is in-memory, and the review history
is synthetic. No online DDL, database isolation, replication or production
migration was executed or validated.

After an authorized candidate run, execute `python3 -B verify.py` independently
inside the copied implementation project and inspect edit/protected-file evidence.
For the review case, reconcile the definitive commit ledger and complete derived
set at the declared cut in both directions. A passed local verifier or a correct
review does not establish an engine's production migration guarantees.

## Versioned encoding contract

The original `shard-publication-rollback-floor` input identifies `refund_pending`
as code 2 but supplies no independent encoding for `pending` or `paid`. The
numeric value oracle was therefore underdetermined. Its input and historical
partial results stay preserved; adding the missing specification to that same
case would change what those attempts were asked to establish.

The separate `shard-publication-rollback-floor-v2` copies all five original raw
files byte for byte and adds `status-code-contract.json`: `pending` is 0, `paid`
is 1, and `refund_pending` is 2. The contract keeps the generation-specific
supported values in `versions.csv`. Its prompt points to that domain input; its
five rubric entries retain the exact original wording. Expected rows, verdicts,
calibration and preservation records stay outside the staged project.

[correction-record-v2.json](correction-record-v2.json) records the input change.
[The original cases snapshot](history/cases-v1-before-status-contract-v2.json)
and [preservation manifest](history/schema-v1-inputs-manifest.json) bind the
original file, serialized case fragments, eleven original raw files and unchanged
original calibration. The current case file appends the new entry after the
original three objects without reserializing them.

[calibration-v2.json](calibration-v2.json) records a local evaluator oracle run.
The private [calibration helper](calibrate-v2.py) derives expected live rows from
definitive commits through cut 207 and the new contract before reading the
derived observation. It compares complete rows and both identity directions;
equal counts still conceal missing 43 and extra deleted 99. Separate controls
detect wrong codes, source/mapped revisions and incarnations with equal counts.
This is synthetic input calibration with no model trial, grade, database or
migration execution. Root freezes and executes any later candidate evaluation.
