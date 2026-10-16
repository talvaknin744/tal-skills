# Independent messaging review, source05, version 1

Source05 completes ten fresh Codex native attempts, with eight rubric passes and
two original major partials. All 34 critical criteria score 2. The new registry
capabilities pass all seven selected attempts. Both new positives have three
observed candidate body reads in three normal discovery attempts. The selected
original and new nontriggers have zero messaging body reads.

The [bound report](report-source05-v1.json), [independent audit](audit-source05-v1.json)
and [score publication receipt](source05-score-publication-receipt-v1.json)
identify source05 separately from the unchanged [source04 report](report-source04-v1.json).
The messaging package is
`a1baf91a4be399ff0086d660739bd34f98209a28f37758cf12c93c6ba079f247`.
Canonical source05 is
`ce79566599736a5a1845e7e26a9baac9f3f84b0bb96be8b20cf72071a7e4a864`.
These exact uncommitted bytes are authoritative. Source HEAD is context, not a
published release identity.

| Case | Attempts | Harness result | Weighted noncritical score | Messaging body reads |
| --- | --- | --- | --- | --- |
| [reordered-account-events](scores/source05/source05-messaging-reordered-account-events-01.json) | 1 | Partial | 50 percent | 1 of 1 |
| [commit-before-ack](scores/source05/source05-messaging-commit-before-ack-01.json) | 1 | Partial | 50 percent | 1 of 1 |
| [local-observer-callback](scores/source05/source05-messaging-local-observer-callback-01.json) | 1 | Pass | 100 percent | 0 of 1 |
| v2-contextual-id-collision | 3 | Three passes | 100 percent each | 3 of 3 |
| v2-registry-restore-identity-gap | 3 | Three passes | 100 percent each | 3 of 3 |
| [v2-local-json-format](scores/source05/source05-messaging-v2-local-json-format-01.json) | 1 | Pass | 100 percent | 0 of 1 |

Every critical criterion must score 2, and each case must achieve at least
80 percent on weighted noncritical criteria, with major weight 2 and minor
weight 1. Critical criteria are excluded from that denominator. The exact
frozen harness labels remain intact. Source05 does not meet governing
acceptance because both original substantive cases retain major score 1.

The commit case now executes a controlled local overlapping unique-claim model,
with one winner, one debit of 50 and one notification intent. Its full
notification and acknowledgement crash/restart matrix remains incomplete. The
reordered case provides sequential model checks and a generic proposal to
overlap deliveries, but no concrete concurrent contenders, interleaving and
expected state/audit counts. These are distinct from the correctly stated
atomic processing contracts. Proposed concrete schedules with explicit outcomes
can satisfy the review task where an integration harness is unavailable, without
being described as executed runtime validation.

All ten score records have literal answer quotes and trace locators, and pass
the frozen harness checks. Independent audit verifies all 875 sealed raw files,
233 YAML receipt files, unchanged workspaces and actual staged source bytes.
The callback nontrigger reads inherited `codebase-design` guidance, while leaving
messaging unloaded. This inherited guidance remains visible as an isolation
limit. Three derived public scores redact personal home prefixes in command
observations, with original/public digests and original command hashes retained.
Raw trace and literal answer quotes remain unchanged.

The executor used Codex CLI 0.160.1, inherited `gpt-6.1-sol` and `xhigh`, no model
or reasoning overrides, the unchanged wrapper and at most two slots. A
post-execution finalizer pointer filename error is retained and corrected
additively, without behavioral rerun or packet changes. The source04 preparation
failures and all source04 partials remain preserved. Together source04 and
source05 retain 20 actual completed attempts, 16 passes and four major partials.
No new-feature pass closes those original regression gaps.

All attempts retain `case_compliant: false`. Filesystem, inherited guidance, MCP
and shell network isolation are unenforced despite disabled native web search.
No actual external or delegation event was recorded. The selected matrix uses
one independent grader, with single original/nontrigger attempts and three
attempts for each new positive. It is not blinded or randomized. No causal
improvement, production replay, real registry/client acceptance, current source
Claude run, marketplace installation or dual host guarantee is claimed.
