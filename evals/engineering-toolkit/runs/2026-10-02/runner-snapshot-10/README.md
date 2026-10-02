# Schema and fairness freezes 14 and 15

This directory retains the integration and regression freeze 14 and freeze 15 files
as exact byte copies, with the unchanged runner and dependency files from
[runner-snapshot-09](../runner-snapshot-09/snapshot.json).
[Snapshot metadata](snapshot.json) records hashes, modes, distinct candidate
identities and checks against unchanged raw cases, prompts, rubrics and fixtures.

Freeze 14 records the infrastructure reader-floor change. Freeze 15 retains the
later fairness-bounds change separately. Neither replaces earlier results or
grants acceptance. Candidate bodies remain bound to original trials; no model,
host run, grading or candidate rewrite occurs here.
