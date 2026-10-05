# Temporal safe deployments

## What it does

Guides code, Worker, payload, and workload changes while existing Temporal executions remain active. It preserves the business process across code that reconstructs it.

## When to reach for it

Use [temporal-safe-deployments](../../skills/temporal/temporal-safe-deployments/SKILL.md) when open or sleeping runs, pending Activities, handlers, child Workflows, or continued runs may encounter a deployment or migration. Production routing, resets, termination, and migration need authorization for those operations.

Invocation: automatic

## It's working if

- Affected execution classes and their compatibility requirements are identified.
- Each class has a justified progression strategy, required retained artifacts or Workers, and a recovery path.
- Representative histories are replayed against the exact candidate when histories may encounter it.
- Changed Activity effects are verified separately from replay compatibility.
- The rollout or assessment names stop and restore conditions, evidence gaps, and old-code retirement conditions.

## Where it fits

This skill owns execution compatibility and rollout continuity. Pair it with [reliability](temporal-reliability.md) when external effects can repeat, and [production readiness](temporal-production-readiness.md) when capacity or operational evidence gates the change. Use [AI workflows](temporal-ai-workflows.md) for model/tool lifecycle concerns. The official Temporal catalog contains SDK and deployment-specific guidance; this skill is an assessment and workflow, not a replacement tuning manual.

## Sources

# Sources and interpretation

Reviewed 2026-09-29. This skill contains original engineering instructions.
Customer stories identify useful failure boundaries; the guidance inferred
from them is not a claim that a customer implemented every safeguard below.
Read the relevant current SDK documentation when selecting concrete APIs.

## Official mechanics

- [Workflow Definition](https://docs.temporal.io/workflow-definition): command determinism and replay constraints.
- [Worker Versioning](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning): deployment capabilities, pinned versus Auto-Upgrade behavior, and infrastructure prerequisites.
- [SDK patch lifecycle, TypeScript example](https://docs.temporal.io/develop/typescript/workflows/versioning): add, deprecate, and remove patches according to history compatibility. Use the corresponding guide for the project's SDK.
- [Safe deployments](https://docs.temporal.io/develop/safe-deployments): representative histories, candidate-artifact replay, sensitive payload handling, and eager-start routing caveat.
- [Tasks](https://docs.temporal.io/tasks): replay consumes recorded results; repeatedly failing Workflow Tasks can leave executions open.
- [Retiring Worker versions](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning/sunset-and-gc): drainage evidence and closed-Workflow Queries.
- [Recovering pinned Workflows](https://docs.temporal.io/production-deployment/worker-deployments/recover-pinned-workflows): restoring routing does not move existing pinned runs; recovery selection and repeated-reset hazards.
- [Continue-As-New](https://docs.temporal.io/develop/typescript/workflows/continue-as-new): explicit state input, handler completion, history-pressure hints, and accelerated rollover testing.
- [Go message passing](https://docs.temporal.io/develop/go/workflows/message-passing) and [handling messages](https://docs.temporal.io/handling-messages): buffered Signals, handler lifecycle, and Update deduplication scope.
- [Upgrading at Continue-As-New](https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning/upgrade-on-continue-as-new): explicit upgrade configuration, input compatibility, and current preview/support status.
- [Child Workflows](https://docs.temporal.io/child-workflows): Parent Close Policy and continued-parent lifecycle.

Stable business-effect identity across resets or new runs, cohort ownership,
reconciliation, schema test matrices, and rollout thresholds are application
design recommendations derived from these boundaries. Temporal does not
automatically supply those contracts.

## Customer evidence

| Story | Published evidence | Inference used here |
| --- | --- | --- |
| [ShareChat](https://temporal.io/resources/case-studies/sharechat) | Reports cycle-level configuration, Workflow versioning, and a staged subscription migration. | Preserve policy per business cycle and expand migration cohorts using observed outcomes. |
| [Mews](https://temporal.io/resources/case-studies/mews) | Describes patching and replay tests while evolving payment webhook processing. | Verify old histories alongside the changed business behavior. |
| [Attentive](https://temporal.io/resources/case-studies/attentive-migrates-temporal-cloud-infra-cost-savings) | Reports persistence compatibility problems and a team-by-team managed migration through lower environments. | Check environment compatibility and migration eligibility; its assisted result is not a universal migration guarantee. |
| [Trendyol](https://temporal.io/resources/case-studies/trendyol-database-scaling-temporal) | Describes provisioning that can wait for days with Activities and durable timers. | Sleeping executions and repeated polling must be covered by deployment and history-growth planning. |
| [Nordstrom](https://temporal.io/resources/on-demand/orchestrating-kafka-migration-nordstrom) | Talk abstract describes readiness assessment, replication, and coordination during a Kafka migration. | Use explicit readiness and cutover criteria. |
| [Linus Health](https://temporal.io/resources/on-demand/transitioning-durable-workflows-cognitive-healthcare) | Talk abstract describes introducing Temporal alongside legacy paths and cross-language concerns. | Keep ownership and serialized contracts explicit during coexistence. |
| [Block](https://temporal.io/resources/on-demand/block-real-world-payments) | Talk abstract names Workflow Replayer in delivery pipelines and several child Workflow patterns. | Gate compatible changes with replay and test child lifecycle separately. |
| [Netflix: team boundaries](https://temporal.io/resources/on-demand/netflix-future-durable-execution-namespace-boundaries) | Talk abstract describes team-owned namespaces and service contracts. | Include external callers and ownership in compatibility analysis. |
| [Netflix: Plato](https://temporal.io/resources/on-demand/netflix-plato-durable-workflows) | Talk abstract discusses typed state and contracts in media processing. | Verify payload decoding, not only command order. |
| [Salesforce](https://temporal.io/resources/on-demand/salesforces-temporal-success-story) | Talk abstract describes automated namespace provisioning. | Include reproducible environment configuration in migration readiness. |

Talk entries above were reviewed as published abstracts, not watched or
transcribed. They establish the stated themes, not undocumented algorithms or
current API behavior. Performance, cost, and reliability claims remain
customer reports and are not used as acceptance thresholds.
