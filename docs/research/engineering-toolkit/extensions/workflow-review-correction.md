# Post-deployment retirement ownership

The first additional ECS case received a partial task score. It correctly held
unsafe retirement, checked confirmed protection expiry, distinguished deployment
completion from job completion, retained compatible recovery dependencies and
identified capacity limits. It did not identify an accountable operational role
for the drain and retirement period after deployment completion. Per-job workers'
execution ownership did not satisfy that separate responsibility. The unchanged
[original independent score](../../../../evals/engineering-toolkit/runs/2026-09-29/native-extension/tal-extension-native-worker-rollout-20260929-01/independent-score.json)
records the gap; it was not regraded after seeing the result.

The platform reference already called for a cleanup deadline and recovery owner.
The canonical `tal-worker-rollout` workflow now carries that requirement into its
transition and final result: when old work outlives deployment completion, name the
accountable operational role, deadline/escalation and release evidence. If the
actual assignment is unknown, propose a role and keep retirement blocked pending
assignment. This is an operational recommendation, not an AWS API requirement.
It does not invent personnel, require another agent or authorize live changes.

An independent reviewer who did not author this correction checked its scope,
the existing planning/authorization boundary, both native entrypoints, and
deterministic generation. No findings remained. The 46-adapter generation check
passed; native wrapper bytes did not change because they load the canonical
workflow installed with the package.

Reviewed identities:

| Artifact | SHA-256 |
| --- | --- |
| Canonical workflow | `d710250cfd6b2cbd5f815869441c5fb8cee069f4704668144c9832eda2123b5d` |
| Codex entrypoint | `3b243a18203dd8b1348800f93bf0b3c5927d4f61eb624d13994fc271129ac67e` |
| Claude entrypoint | `82fa31fa6975bf983ed4e478fcbcfcc5d7bff2af2d0381fb8034a2a913921e65` |

The correction is frozen at commit
[`d3a591f`](https://github.com/talvaknin744/tal-skills/commit/d3a591f10bbb9b121b309c95c13d4f99c2a2d6e2).
A fresh native run uses the same protected case and rubric. Source review and
adapter generation do not by themselves establish that the model supplies the
required owner. The [new independent result](../../../../evals/engineering-toolkit/runs/2026-09-29/native-extension/tal-extension-native-worker-rollout-20260929-02/independent-score.json)
passes the task and native-behavior criteria (17/18 overall, with isolation still
partial). It explicitly proposes the service on-call role, acknowledges that no
actual assignment is evidenced, and blocks retirement pending acceptance. This
is not an accepted real operational assignment. All 103 baseline/final file
hashes and modes matched, including the revised installed workflow.
