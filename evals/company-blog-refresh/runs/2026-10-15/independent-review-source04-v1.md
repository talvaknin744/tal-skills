# Independent messaging review, source04, version 1

Source04 completes ten Codex native attempts, with eight rubric passes and two
partials. All 34 critical criteria score 2. The new registry capabilities pass
their seven selected attempts, including three repetitions of each positive.
The original regression set does not meet acceptance because its two substantive
cases omit concrete concurrency fault checks. New capability success does not
establish preservation of those checks.

The [bound report](report-source04-v1.json) and [independent audit](audit-source04-v1.json)
identify exact bytes. The uncommitted messaging package is
`e1c1a5f1300cbae8be83ea7f6e398c465d289cdae86837137f1277e1b5a82d2b`.
Canonical source04 is
`ca7b50830d3713a23a87bb08601584808f0a08d4c91f247bea8361eb17e0b604`.
The original corpus and new corpus retain their frozen bytes. Source HEAD is
context, not a release identity.

| Case | Attempts | Harness result | Weighted noncritical score | Candidate body reads |
| --- | --- | --- | --- | --- |
| [reordered-account-events](scores/source04/source04-messaging-reordered-account-events-01.json) | 1 | Partial | 50 percent | 1 of 1 |
| [commit-before-ack](scores/source04/source04-messaging-commit-before-ack-01.json) | 1 | Partial | 50 percent | 1 of 1 |
| [local-observer-callback](scores/source04/source04-messaging-local-observer-callback-01.json) | 1 | Pass | 100 percent | 0 of 1 |
| v2-contextual-id-collision | 3 | Three passes | 100 percent each | 3 of 3 |
| v2-registry-restore-identity-gap | 3 | Three passes | 100 percent each | 3 of 3 |
| [v2-local-json-format](scores/source04/source04-messaging-v2-local-json-format-01.json) | 1 | Pass | 100 percent | 0 of 1 |

The acceptance policy requires every critical score to be 2 and each case's
weighted noncritical score to reach 80 percent. Major criteria have weight 2,
minor criteria weight 1. Critical criteria are separate gates. The frozen
harness labels any criterion score 1 as partial, and its exact labels are
preserved. An aggregate of 98 out of 100 criterion points does not close the two
case gaps.

For `reordered-account-events`, the answer gives an atomic, account scoped
revision contract and one audit for the retained revision. Its saved in-memory
SQLite command checks sequential duplication, reordering, commit followed by
lost acknowledgement, and rollback. It omits a concrete concurrent delivery
schedule and expected state/effect counts as a fault check. For
`commit-before-ack`, the answer correctly couples a durable claim, debit and
outbox while preserving uncertain provider delivery. Its local checks omit
concurrent duplicate claims and do not define the complete notification and
acknowledgement crash outcome matrix. These two major criteria remain score 1.
Clearly proposed concrete schedules can satisfy the review task when the actual
integration harness is unavailable, provided they state expected outcomes and
remain labeled unexecuted. The observed answers lack those concrete checks.

Each score contains literal answer quotations, line locators and relevant trace
locations. All ten grading packets equal their sealed evidence, all workspaces
equal their baselines, and actual skill/reference reads resolve staged paths and
return matching source bytes. Both new positives achieve the observed activation
threshold of at least two body reads in three normal discovery attempts. Both
selected nontriggers have zero observed body reads. No hidden injection or
future activation guarantee is inferred.

The executor used Codex CLI 0.160.1 with inherited `gpt-6.1-sol` and `xhigh`,
without model or reasoning overrides, and at most two native slots. The raw
source04 execution seal binds 914 files and was independently rechecked. A
staging failure from missing suite registration and a runner startup failure
from the absent YAML dependency are preserved. Both preceded native model
invocation and are preparation failures, with zero behavioral attempts credited.
The supplied installed YAML 2.9.1 runtime was independently checked against its
receipt before score validation. All ten frozen harness score checks pass.

`case_compliant` remains false for every attempt. Broad filesystem access,
inherited guidance, MCP and shell network surfaces are not an enforced isolation
boundary, despite disabled native web search. No actual external or delegation
event was observed. This is one independent grader and a limited selected case
set. No blinded or randomized comparison, production replay, real registry/client
verification, current source Claude host run, marketplace installation or dual
host guarantee is claimed. Source04 scores and preparation failures remain
intact for any later candidate report.
