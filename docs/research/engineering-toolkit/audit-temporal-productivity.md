# Temporal and productivity audit

Reviewed 2026-09-29 against baseline `7279a6654487d9a5f09d4a21d117dfa841c7130d`. All **12 Temporal and 3 productivity entrypoints** were read. The accompanying [JSON audit](audit-temporal-productivity.json) records inspected files, 20 actionable findings, source URLs, proposed corrections, and verification cases. No skill files were changed during this audit.

This is a complete entrypoint review with **sampled risk-bearing references**, not a line-by-line audit of the vendored Temporal libraries. `node scripts/check-skills.mjs` passed for the 30 existing skills; this establishes local packaging/link structure, not live Cloud behavior or technical correctness.

| Skill | Disposition | Boundary to preserve |
| --- | --- | --- |
| `temporal-ai-workflows` | Keep | Durable agent turns, tool effects, approvals |
| `temporal-cloud` | Fix | Cloud connection and configuration diagnosis |
| `temporal-cloud-setup` | Fix | Explicit provisioning and sample execution |
| `temporal-developer` | Fix | SDK implementation and primitive selection |
| `temporal-observability` | Fix | Telemetry collection and interpretation |
| `temporal-ops` | Fix | Authorized operational commands and diagnosis |
| `temporal-production-readiness` | Keep | Capacity, isolation, recovery acceptance evidence |
| `temporal-reliability` | Keep | Effect identity, uncertain outcomes, durable waits |
| `temporal-safe-deployments` | Keep | Replay, version transitions, state continuity |
| `temporal-serverless` | Fix | Explicit Lambda deployment using bundled references |
| `temporal-workertuning` | Fix | Measured runtime performance changes |
| `temporal-workflow-design-critic` | Keep | Independent design verdict |
| `learning-experiments` | Keep | A measurable study-habit experiment |
| `learning-plan` | Keep | Feasible preparation and next session |
| `retrieval-coach` | Keep | Attempt, error repair, review state |

## Corrections before expanding workflows

**Remove credential-printing diagnostics.** `temporal-ops/SKILL.md:169` and `references/triage/authentication.md:82` use a raw environment filter that prints the API key. `temporal-cloud-setup/SKILL.md:296` and `scripts/provision.sh:1951` expose the same problem in displayed gate commands. The setup script's actual preflight already reports variable names without values: reuse that behavior. A sentinel-key regression should prove that neither output nor command previews contain the value. This protects the secret-bearing [API-key authentication](https://docs.temporal.io/cloud/api-keys) path. Findings: `TP-OPS-01`, `TP-SETUP-01`.

**Unify endpoint and authentication guidance.** Ops still requires Regional Endpoints for API keys, while its bundled authentication reference recommends Namespace Endpoints. Cloud calls Regional Endpoints HA-only and overgeneralizes Flexible Auth restrictions. Use namespace configuration and the documented exceptions: ordinary API-key connections can use the recommended Namespace Endpoint; the mixed-auth preview has a specific API-key endpoint restriction. A migration must establish namespace support and service-account access before swapping credentials. Verify API-key-only, mTLS, mixed-auth, and region-pinned cases. [Namespace documentation](https://docs.temporal.io/cloud/namespaces) supports the distinction. Findings: `TP-CLOUD-01/02`, `TP-OPS-02`.

**Do not diagnose stalled retries as healthy recovery.** `temporal-observability/SKILL.md:149` treats high Activity failures and low Workflow failures as healthy error handling. SDK attempt-failure telemetry can show this pattern while Activities retry and no business work finishes. Require completion within the business deadline, pending age, attempts, and retry/time budgets. The counterexample to test is an indefinitely running Workflow with repeatedly failing Activities; successfully recovered transient failures remain a healthy case. [Retry defaults](https://docs.temporal.io/encyclopedia/retry-policies) explain why the ratio alone is insufficient. Current service-health guidance repeats the heuristic; this finding adds an applicability limit rather than alleging that the upstream page changed. Finding: `TP-OBS-01`.

**Correct failure-detection and namespace assumptions.** `temporal-ops/references/triage/workflow-stuck.md:140-146` says heartbeats are the only dead-worker detection and permits neither close timeout. Current [ActivityOptions](https://typescript.temporal.io/api/interfaces/common.ActivityOptions) requires at least one close timeout; Start-To-Close detects noncompletion, while heartbeat timeout can detect it sooner. Server timeout also does not establish that an old physical attempt stopped, so verify effect safety under overlapping attempts. The same reference's cross-namespace child claim at line 153 needs a legacy/configuration qualification: the [current API](https://raw.githubusercontent.com/temporalio/api/master/temporal/api/command/v1/message.proto) deprecates the namespace field and notes the default disablement since server 1.30.1. Findings: `TP-OPS-03/04`.

**Separate submission deduplication from effect safety.** `temporal-developer/references/core/job-queue.md` promises free deduplication from a business Activity ID. That ID does not select the reuse policy or outlive retained execution records. Specify conflict/reuse policies, retention, and an operation identity; preserve external-effect idempotency after uncertain outcomes. Test a duplicate while running, after completion, after retention expiry, and a legitimate new operation for the same entity. The [Standalone Activity guide](https://docs.temporal.io/standalone-activity) defines these boundaries. Finding: `TP-DEV-02`.

**Refresh feature gates rather than assume latest capabilities.** The bundled Standalone Activity guide lists CLI 1.7.0/server 1.31.0; the [current feature prerequisites](https://docs.temporal.io/standalone-activity) list 1.9.1/1.32.0. The claim that Rust lacks support is contradicted by the [Rust SDK 1.0.0 feature guide](https://docs.temporal.io/develop/rust/activities/standalone-activities). Inspect installed capabilities and preserve an older-runtime fallback. Separately, `temporal-serverless/SKILL.md:20` must distinguish Lambda-only package coverage from platform availability: [current serverless documentation](https://docs.temporal.io/serverless-workers) includes Cloud Run Worker Pools and Bedrock AgentCore in pre-release. Do not advertise these as locally validated implementations or apply Lambda lifecycle limits to them. Findings: `TP-DEV-01`, `TP-SERVERLESS-01`.

**Make version and health evidence precise.** Cloud setup's claim that its extension has no meaningful versions is obsolete: [official releases](https://github.com/temporalio/cloud-cli/releases) include v0.1.1. Use the [documented installation source](https://github.com/temporalio/cloud-cli), then check required capabilities rather than always upgrading a working install. The [old tap migration](https://raw.githubusercontent.com/temporalio/homebrew-prerelease/main/tap_migrations.json) means its former install command is not necessarily broken. For serverless, task-queue binding proves a past successful poll, not that credentials, code, and permissions remain correct indefinitely. Revalidate current configuration after a subsequent failure. Test revoked credentials after successful binding. Findings: `TP-SETUP-02`, `TP-SERVERLESS-02`.

**Limit IAM conclusions to evidence actually collected.** `temporal-serverless/references/aws-lambda/iam.md:37` calls the policy simulator authoritative while omitting request resources and context. [AWS documents differences from live authorization](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_testing-policies.html). Supply relevant context, preserve missing-context outcomes, and distinguish a simulated allow from a successful authorized operation. The qualified-ARN wildcard explanation was checked and is correct: [Lambda's `:*` pattern excludes the unqualified ARN](https://docs.aws.amazon.com/lambda/latest/dg/lambda-api-permissions-ref.html). Finding: `TP-SERVERLESS-04`.

**Separate namespace quota from SDK defaults.** Worker tuning's configuration table puts namespace APS 400 in the Go row. The upstream quick-reference table repeats this presentation, but [Cloud capacity documentation](https://docs.temporal.io/cloud/capacity-modes) makes capacity a namespace property. Remove that column from language defaults and inspect actual namespace limits. Test Java and Python workers sharing the same budget. Finding: `TP-TUNING-01`.

## Agent-writing and packaging changes

Apply [Matt Pocock's guidance](https://www.aihero.dev/skills-writing-for-agents) behaviorally: retain instructions that change execution and move branch-specific detail behind precise pointers. Cloud setup's approximately 10,570-word entrypoint is the main candidate for extracting SDK gate templates; preserve its script contract and explicit provisioning boundary.

Remove worker tuning's mandatory promotional startup message. Normalize `skill-temporal-*` referrals to the actual public names and treat sibling packages as optional. Discover connected telemetry tools before assuming the user must run queries manually. Serverless must use an explicit working directory or absolute paths for every command; remove claims that shell state persists or that every host necessarily prompts for approval. Findings: `TP-SETUP-03`, `TP-TUNING-02`, `TP-OPS-05`, `TP-OBS-02`, `TP-SERVERLESS-03`.

The four focused Temporal additions already keep useful boundaries between agent execution, effect recovery, safe deployment, and production acceptance. Their sampled references distinguish business identity from execution identity and explicitly request failure evidence. Keep these public contracts. The new coordinator should select the relevant specialist instead of loading the entire Temporal roster.

The productivity skills also have useful independent scopes and explicit evidence limits. Their narrow claims align with the inspected [retrieval study](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf) and [spacing abstract](https://pubmed.ncbi.nlm.nih.gov/19076480/). This audit did not re-review every coaching transcript, video, or complete study; it found no concrete reason to rewrite these workflows or introduce backend dependencies.

## Verification boundary

The JSON file contains an acceptance case for every proposed change. Implementation should preserve upstream pins/licenses, record local corrections, run existing package checks, add targeted sentinel/capability regressions, and exercise single-package routing. No live Temporal Cloud/AWS provisioning, production change, SDK execution, or native-host behavior was verified in this audit. The external references were selectively checked, not exhaustively crawled. A keep verdict applies only to the inspected scope.
