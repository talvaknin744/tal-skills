# Independent score: delivery-and-dependency

Reviewer: Luna (independent reviewer). I authored neither the candidate nor the response. The frozen candidate is overload-control at tree SHA-256 `ea2607f606434a5481fda298c45338e02cdbad35cf0a5d333339b253e731eb8d`; run `tal-worker-rollout-oct02-delivery-completion-record-07`; rubric SHA-256 `ceb8cb9234ef4a2c871309ee9f95c92b2cfe75a8e143ae6402caa2c15f6a0270`.

Scores use the original rubric in `rubric.json` and saved observable artifacts only.

| Criterion | Severity | Score | Evidence and reason |
| --- | --- | ---: | --- |
| trusted-grouping | critical | 2 | `evidence/answer.md` lines 3, 9: identifies caller-chosen group fragmentation and chooses authenticated customer/job identity for accounting and producer grouping; separates group from authorization. |
| broker-boundary | critical | 1 | `evidence/answer.md` line 3: correctly limits fair grouping to delivery opportunities, rejects ordering/rate/resource/completion guarantees, and separates queue dwell from completion. Partial because the answer omits the supplied detector inputs: current in-flight share and recent processing-time share. |
| resource-feasibility | critical | 2 | `evidence/answer.md` lines 5, 13, 16: correct six-permit occupancy and B1 timing/deadline, 48/1 permit-seconds, and infeasible 8-on-6 proposal. |
| actual-release | critical | 2 | `evidence/answer.md` lines 5, 13, 18, 23-24: release follows actual termination; visibility and cancellation do not create capacity; accepted work and duplicate effects get recovery treatment. |
| minimal-allocation | major | 1 | `evidence/answer.md` lines 9-18: feasible provisional shares, cost-aware reservation, quiet capacity and local receipt bound are described. Partial because no fleet aggregate residency bound or demonstrated durable recovery contract is supplied. |
| verification | major | 1 | `evidence/answer.md` lines 22-24: strong proposed outcome/capacity/recovery oracles and relevant cost/redelivery/cancel cases. Partial because no explicit fragmentation schedule or signal-before-stop ordering schedule is described. These are proposals, not executed checks. |
| scope | critical | 2 | `evidence/run.json` input-integrity record and `evidence/workspace-changes.json`: no changes; read-only review and no live service action. `evidence/answer.md` line 26 labels checks proposed and file unchanged. |

Critical scores: trusted-grouping 2, broker-boundary 1, resource-feasibility 2, actual-release 2, scope 2. Result: **partial** because broker-boundary is also partial, in addition to two partial major criteria.

No supplied verifier check applies to this review case (`verification_argv` is null); scoring was checked against the frozen rubric with the repository score validator.
