# Temporal skill smoke observations — 2026-09-29

Four of the twelve authored cases were sampled once each using fresh Codex
subagents. Each received only its exact case prompt, a copied candidate skill,
and its isolated project. Rubrics and prior conclusions were withheld.

These are qualitative smoke observations, not a complete evaluation, controlled
baseline comparison, or proof of production Temporal behavior. The exact model
build, sampling settings, elapsed time, and token usage were not captured.
Web/subagent/external-call restrictions were supplied as instructions rather than
removed from the tool surface; the observed runs reported local-only work.
There is no claim of runner-enforced capability compliance.

| Case | Observed behavior | Actual execution |
|---|---|---|
| `bounded-charge-activity-edit` | Changed the adapter to `invoice-charge:<tenantId>:<invoiceId>`; preserved receipt, error, and audit behavior. | `node --test charge.test.mjs`: five tests passed. Four reproduced the original defect before the fix. The reviewer inspected the resulting adapter and tests. |
| `replay-and-worker-retirement` | Distinguished command compatibility from routing, rejected idle-time retirement, retained sleeping executions, and separated rollback of new traffic from recovery of already pinned runs. | Static review only; no history replay, SDK execution, or deployment. Fixture bytes remained unchanged. |
| `backlog-versus-vendor-quota` | Identified arrivals above shared provider capacity, rejected replica-only relief, preserved document accounting, and proposed aggregate controls and measurable recovery. | Static review and capacity arithmetic only; no load test or service calls. Fixture bytes remained unchanged. |
| `ai-graph-retry-and-budget` | Separated recorded model/tool boundaries, preserved order identity, reserved a durable five-call worst-case budget, and retained uncertainty after lost responses. | Static review only; no model, supplier, or Temporal execution. Fixture bytes remained unchanged. |

The adapter test uses a contract-faithful local provider model. It checks repeated
and distinct obligations, response loss after provider acceptance, audit failure,
and rejection without auditing. It cannot establish a real provider's retention
or concurrency guarantees. Tests and edits occurred in the temporary project;
the deliberately flawed source fixture remains unchanged.

Candidate fingerprints below are SHA-256 of each copied skill's sorted relative
file paths and contents, with a NUL after each path and contents. They identify
the tested draft independently of the later publication commit.

| Skill | Candidate fingerprint |
|---|---|
| temporal-reliability | `03b7bbe8d9c11211342af6e4804d00429a3f0a3c5a820630b22e5a0631066ab2` |
| temporal-safe-deployments | `78710e909cff8f009db0c9fa1c092b135febf4f933d5cfa90d46f3a790db7adb` |
| temporal-production-readiness | `c2d72092043d743511c4010a13ab42f17269ce4e00ee773c4958d5902aac4d78` |
| temporal-ai-workflows | `a0a424fa57421ae180fbd5d19d0786ab70066732e5d4c0f24ab189a209c2375a` |

After the trials, independent review sharpened the reliability skill's reference
pointer to include Activity retry, timeout, and heartbeat changes. This routing
clarification was not rerun as a separate behavioral trial. The other eight
cases, automatic skill selection, and the bundled official skills were not
behaviorally evaluated by these four runs. Complete traces remain in the authoring
session; this file records observations rather than a fully reproducible run.
