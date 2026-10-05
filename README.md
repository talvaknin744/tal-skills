# tal-skills

[![Validate skills](https://github.com/talvaknin744/tal-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/talvaknin744/tal-skills/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Practical skills for building reliable backend and distributed systems with coding agents.

**49 skills · 15 specialist agents · 8 workflows · Codex and Claude adapters**

Use them to investigate stale reads, make retries safe, deploy long-running workers,
handle late events, measure performance, or review a system's recovery path.
Each skill has a specific trigger, a short workflow, conditional references,
and a result you can check against your code. Install the parts you need.

[Quick start](#quick-start) · [Choose a skill](#choose-a-skill) · [Agents and workflows](#agents-and-workflows) · [Evidence](#sources-and-verification) · [Contributing](CONTRIBUTING.md)

## Quick start

With Node.js **22.20 or later**, open the interactive skill picker from your
project's directory:

```sh
npx skills@latest add talvaknin744/tal-skills
```

Choose the skills and coding agents you want to install. For a focused selection:

```sh
npx skills@latest add talvaknin744/tal-skills --skill idempotency --skill graceful-draining
```

To inspect the available skills first:

```sh
npx skills@latest add talvaknin744/tal-skills --list
```

The [skills CLI](https://github.com/vercel-labs/skills) handles standalone skill
installation. Native specialist agents and complete workflows use the
[toolkit installer](docs/toolkit-usage.md#install-in-a-project), which also supplies
and tracks their dependencies. Its interactive picker supports all three types:

```sh
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills
```

For npm 12, which disables Git dependencies by default, add `--allow-git=all`
before `--package`. This is a command-scoped npm option; the launcher still asks
you to choose packages and review its plan. See the usage guide for copyable
commands, dry runs, and reproducible revision selection. If you want a combined
setup, use the toolkit installer from the start: it preserves existing unowned
skills by reporting collisions.

Keep each skill's complete package together when
copying manually. Reading instructions requires no repository dependency install;
implementation and examples use the target project's tools.

Then ask your agent for a concrete task. In Codex:

```text
Use $idempotency to review this webhook handler.
Check concurrent duplicates, changed payloads, and a crash after downstream success.
Cite the code and propose a regression that forces each important ordering.
```

In Claude, use `/idempotency` or request the skill by name. Hosts can also select
skills automatically from their descriptions. Existing model settings stay yours.

## Choose a skill

Start with the decision in front of you:

| Situation | Start here |
| --- | --- |
| A deployment repeatedly interrupts a 24-hour job | [graceful-draining](skills/engineering/graceful-draining/SKILL.md) |
| A timeout or duplicate delivery may repeat a business effect | [idempotency](skills/engineering/idempotency/SKILL.md) |
| Services disagree, a cache fill races a write, or updates are lost | [concurrency-correctness](skills/engineering/concurrency-correctness/SKILL.md) |
| Late events, replay, corrections, or joins change a streaming result | [stream-processing-design](skills/messaging/stream-processing-design/SKILL.md) |
| Backfills or compaction compete with serving traffic | [background-maintenance](skills/engineering/background-maintenance/SKILL.md) |
| Latency rose and the cause is unclear | [performance-diagnosis](skills/performance/performance-diagnosis/SKILL.md) |
| Offered load exceeds useful service capacity | [overload-control](skills/performance/overload-control/SKILL.md) |
| You need a safe service split or data migration | [microservice-boundaries](skills/engineering/microservice-boundaries/SKILL.md), [microservice-extraction](skills/engineering/microservice-extraction/SKILL.md) |
| A backup restored, but safe application recovery is unproven | [recovery-validation](skills/reliability/recovery-validation/SKILL.md) |
| A supported API or library needs retirement | [technical-deprecation](skills/engineering/technical-deprecation/SKILL.md) |

A routine local change can stay local. These skills are composable, and the
collection is not a required pipeline. The [task guide](docs/toolkit-usage.md)
explains when to use a skill, a specialist, or a coordinated workflow.

### Full catalog

| Concern | Skill | Use it for |
|---|---|---|
| Languages | [python-backend](skills/languages/python-backend/SKILL.md) | Python service boundaries, async ownership, cancellation and transactions |
| Languages | [typescript-backend](skills/languages/typescript-backend/SKILL.md) | Runtime validation, trusted context and owned asynchronous resources |
| Languages | [go-backend](skills/languages/go-backend/SKILL.md) | Context propagation, goroutine completion and transaction cleanup |
| Messaging | [stream-processing-design](skills/messaging/stream-processing-design/SKILL.md) | Event time, late arrivals, duplicates, revisions, streaming joins and bounded state |
| Messaging | [messaging-reliability](skills/messaging/messaging-reliability/SKILL.md) | Publication, acknowledgement, replay, ordering and bounded consumer failure |
| Infrastructure | [infrastructure-change-safety](skills/infrastructure/infrastructure-change-safety/SKILL.md) | Partial applies, identity-preserving changes, rollout and recovery |
| Reliability | [recovery-validation](skills/reliability/recovery-validation/SKILL.md) | Restored application contracts, accepted work, effects and recovery objectives |
| Testing | [failure-oriented-testing](skills/testing/failure-oriented-testing/SKILL.md) | Independent oracles, controlled fault schedules and meaningful regressions |
| Quality | [code-and-docs-cleanup](skills/quality/code-and-docs-cleanup/SKILL.md) | Evidence-backed simplification that preserves behavior and useful rationale |
| Protocols | [mcp-engineering](skills/protocols/mcp-engineering/SKILL.md) | Pinned MCP versions, authority, resource isolation and request lifecycle |
| Protocols | [a2a-engineering](skills/protocols/a2a-engineering/SKILL.md) | Pinned A2A versions, task ownership, observers and duplicate business effects |
| Performance | [overload-control](skills/performance/overload-control/SKILL.md) | Load shedding, admission budgets, bounded queues, tenant fairness and recovery |
| Performance | [performance-diagnosis](skills/performance/performance-diagnosis/SKILL.md) | Latency regressions, execution versus waiting, runtime limits and verified improvements |
| Performance | [load-testing](skills/performance/load-testing/SKILL.md) | Representative arrivals, generator limits, workload accounting and saturation evidence |
| Performance | [capacity-planning](skills/performance/capacity-planning/SKILL.md) | Resource-demand models, backlog drain, failure headroom, autoscaling and cost |
| Performance | [database-performance](skills/performance/database-performance/SKILL.md) | Query plans, workload impact, pool/lock waits and maintenance tradeoffs |
| Performance | [data-layout-performance](skills/performance/data-layout-performance/SKILL.md) | Measured Go/Python hot paths, locality, false sharing and bounded-structure correctness |
| Productivity | [learning-plan](skills/productivity/learning-plan/SKILL.md) | Feasible study schedules, actual progress, prerequisite triage and exam preparation |
| Productivity | [retrieval-coach](skills/productivity/retrieval-coach/SKILL.md) | Interactive recall, mathematical feedback and spaced review from observed attempts |
| Productivity | [learning-experiments](skills/productivity/learning-experiments/SKILL.md) | Diagnose a study bottleneck and test one bounded change against fresh performance |
| Engineering | [background-maintenance](skills/engineering/background-maintenance/SKILL.md) | Backfills, compaction and rebalancing alongside serving traffic |
| Engineering | [architecture](skills/engineering/architecture/SKILL.md) | Architecture planning and review, with optional independent specialists and book grounding |
| Engineering | [idempotency](skills/engineering/idempotency/SKILL.md) | Designing, implementing, and reviewing retry-safe APIs, webhooks, and queue workers |
| Engineering | [graceful-draining](skills/engineering/graceful-draining/SKILL.md) | Preserving long-running jobs through shutdown, handoff, and rolling deployment |
| Engineering | [concurrency-correctness](skills/engineering/concurrency-correctness/SKILL.md) | Diagnosing and fixing concurrent writes, stale caches, and replica-read races |
| Engineering | [microservice-boundaries](skills/engineering/microservice-boundaries/SKILL.md) | Choosing cohesive service boundaries and ownership |
| Engineering | [microservice-integration](skills/engineering/microservice-integration/SKILL.md) | Evolving service communication and API/event contracts |
| Engineering | [microservice-data](skills/engineering/microservice-data/SKILL.md) | Data ownership, distributed workflows, and query projections |
| Engineering | [microservice-extraction](skills/engineering/microservice-extraction/SKILL.md) | Staged service extraction, coexistence, and data cutover |
| Engineering | [microservice-testing](skills/engineering/microservice-testing/SKILL.md) | Tests that support independent service delivery |
| Engineering | [microservice-operations](skills/engineering/microservice-operations/SKILL.md) | Cross-service reliability, observability, and recovery |
| Engineering | [distributed-system-patterns](skills/engineering/distributed-system-patterns/SKILL.md) | Choosing and composing distributed topology patterns |
| Engineering | [legacy-code-changes](skills/engineering/legacy-code-changes/SKILL.md) | Characterizing untested behavior and isolating dependencies for a change |
| Engineering | [technical-deprecation](skills/engineering/technical-deprecation/SKILL.md) | Migrating consumers before retiring supported libraries, APIs, configuration, or tools |
| Engineering | [pragmatic-programming](skills/engineering/pragmatic-programming/SKILL.md) | Changeability, knowledge duplication, and feedback through working slices |
| Engineering | [enterprise-application-patterns](skills/engineering/enterprise-application-patterns/SKILL.md) | Domain logic, persistence mapping, and transaction boundaries |
| Engineering | [object-design-patterns](skills/engineering/object-design-patterns/SKILL.md) | Applying object patterns to concrete variation and coupling |
| Temporal | [temporal-reliability](skills/temporal/temporal-reliability/SKILL.md) | Activity effects, uncertain outcomes, compensation, and durable waits |
| Temporal | [temporal-safe-deployments](skills/temporal/temporal-safe-deployments/SKILL.md) | Replay compatibility, Worker deployments, history rollover, and migrations |
| Temporal | [temporal-production-readiness](skills/temporal/temporal-production-readiness/SKILL.md) | Capacity, backlog, data lifetime, isolation, and recovery evidence |
| Temporal | [temporal-ai-workflows](skills/temporal/temporal-ai-workflows/SKILL.md) | Durable agent loops, tool effects, context, budgets, and approvals |


Eight additional [adapted official Temporal skills](integrations/temporal/README.md)
cover SDK development, design review, Cloud, operations, worker tuning,
observability, serverless Workers, and Cloud setup. Their upstream revisions,
licenses, local corrections, and update path are recorded separately.

The [domain reading paths](docs/reading-paths.md) connect related skills and
conditional references. [Book-derived skills](docs/book-skills.md) and the
[learning skills](docs/productivity/research-synthesis.md) record their source scope,
including edition differences, excerpts, and supplied material.

## Agents and workflows

Skills contain technical guidance. [Agents](agents/README.md) define bounded
specialist assignments. [Workflows](workflows/README.md) coordinate ownership,
review, and acceptance across those assignments.

| Workflow | Outcome |
| --- | --- |
| `tal-backend-delivery` | A backend change with independent correctness review and meaningful checks |
| `tal-consistency-diagnosis` | A reconstructed race or stale-read history and a verified correction |
| `tal-messaging-evolution` | Explicit publication, replay, ordering, and event evolution contracts |
| `tal-worker-rollout` | A deployment path that preserves long-running work and separates maintenance from business failure |
| `tal-recovery-validation` | Evidence that restored application behavior and accepted work can resume safely |
| `tal-mcp-integration` | A pinned MCP integration with authority and lifecycle checks |
| `tal-a2a-integration` | A pinned A2A integration with task ownership and effect handling |
| `tal-cleanup-review` | A smaller maintenance burden with behavior and useful rationale preserved |

The main session chooses relevant specialists, assigns **one implementation owner
per overlapping file set**, and sends independent findings back to that owner.
The shared handoff carries the objective, files, invariants, and acceptance criteria.
Small tasks take a short path without the full roster.

To select one workflow without a checkout:

```sh
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills --host codex --workflow tal-worker-rollout --dry-run
npx --yes --package=github:talvaknin744/tal-skills -- tal-skills --host codex --workflow tal-worker-rollout
```

Add `--skill <name>` or `--agent <name>` to the same invocation. Explicit selections
describe the complete desired set, so inspect the dry run when updating a managed
installation. Run commands from the destination project or pass `--target`.

For a checkout-based installation, Node.js 22 or later is required:

```sh
git clone https://github.com/talvaknin744/tal-skills.git
cd tal-skills
npm ci --ignore-scripts
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-worker-rollout --dry-run
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-worker-rollout
```

Choose `claude` or `both` for the other host. The installer is project-local,
resolves dependencies, records owned files, and rejects conflicting or locally
edited files. It preserves existing host configuration. See the
[installation and invocation guide](docs/toolkit-usage.md) for selection updates,
recovery, native loading, and compatibility limits.

```text
Use $tal-worker-rollout to review our three-pod rolling deployment for 18-hour jobs.
Inspect admission, retained input, checkpoint ownership, and retry accounting.
Force successive maintenance handoffs and a genuine failure control.
```

## Sources and verification

Advice carries a trigger, failure mechanism, applicability limits, counterexample,
and verification method. Historical company accounts inform a design question;
they do not establish guarantees for a different system.

- [Research ledger](docs/research/engineering-toolkit/README.md): the 60-publisher survey, book access, selected readings, and adoption decisions.
- [October archive review](docs/research/engineering-toolkit/2026-10-01/README.md): 58,178 metadata URLs, 29 selected article-body readings, terminal collection evidence, and explicit historical/access gaps. Metadata enumeration is separate from article reading.
- [Performance research](docs/research/performance-capacity/README.md): measurement, capacity, overload, database work, and conditional Go/Python data-layout experiments.
- [Temporal story review](docs/temporal/README.md): all 70 customer-index entries, with written-story and talk-summary scope distinguished.
- [Runnable examples](examples/README.md): TypeScript, Python, and Go backend contracts plus messaging, cache races, worker handoffs, recovery, protocols, and retry coordination.
- [Worker rollout integration](docs/research/worker-rollout-integration/2026-10-02/README.md): signal and ownership evidence plus focused cache, schema, fairness and deadline guidance, with runtime and agent results reported separately.
- [Verification report](docs/research/engineering-toolkit/verification.md) and [evaluation guide](evals/README.md): deterministic checks, runtime observations, independently scored agent trials, and known host limitations.

Repository checks validate packaging, references, generated adapters, installer
behavior, fixtures, and evidence bindings. They do not run a model or prove
production reliability. Behavioral trials retain failed and blocked attempts and
state their environment limits. Native loading and configuration parsing are
reported separately from observed workflow execution.

## Repository layout

| Directory | Contents |
| --- | --- |
| [skills/](skills/) | Self-contained packages grouped by engineering concern |
| [agents/](agents/) | Canonical specialist roles and their shared contract |
| [workflows/](workflows/) | Task paths, stopping conditions, and handoff format |
| [adapters/](adapters/) | Generated Codex and Claude native files |
| [examples/](examples/) | Runnable experiments, commands, observations, and limits |
| [docs/](docs/) | Usage, reading paths, research, and provenance |
| [evals/](evals/) | Behavioral cases, isolated inputs, and published evidence |
| [tests/](tests/) | Deterministic regression and integrity checks |
| [scripts/](scripts/) | Installation, generation, validation, and evaluation tools |
| [integrations/temporal/](integrations/temporal/) | Official upstream attribution and local adaptation records |

## Contribute

Use [CONTRIBUTING.md](CONTRIBUTING.md) to add a focused skill or improve an existing
one. Maintainers run:

```sh
npm ci --ignore-scripts
npm run validate
```

Keep public skill names stable, references local to each installable package,
and completion criteria observable. Changes to agent instructions need behavioral
evidence in addition to structural checks.

See the [change log](CHANGELOG.md) for release scope.

## Attribution and license

Original instructions and repository tooling are [MIT-licensed](LICENSE).
Books, blog articles, illustrations, and source-site material are linked and
paraphrased; their copyrights remain with their authors.

The architecture skill began with [NanoClaw's Code Architect](https://github.com/nanocoai/nanoclaw-templates/tree/7d3cb40409a4a7b8f2cf562b0d80fceb612b941b/engineering/code-architect),
created by [zvi-fried](https://github.com/zvi-fried); its MIT notice is retained.
The idempotency work was prompted by [Dochia's article](https://blog.dochia.dev/blog/idempotency/).
Official Temporal adaptations retain their notices and `UPSTREAM.md` records.

Instruction design follows Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents):
precise activation, short workflows, conditional context, and instructions that
change useful behavior. This is an independent project; inclusion or citation
of another project's work does not imply endorsement.
