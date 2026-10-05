# tal-skills

[![skills.sh](https://skills.sh/b/talvaknin744/tal-skills)](https://skills.sh/talvaknin744/tal-skills)
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
| Late events, replay, corrections, or joins change a streaming result | [stream-processing-design](skills/engineering/stream-processing-design/SKILL.md) |
| Backfills or compaction compete with serving traffic | [background-maintenance](skills/engineering/background-maintenance/SKILL.md) |
| Latency rose and the cause is unclear | [performance-diagnosis](skills/performance/performance-diagnosis/SKILL.md) |
| Offered load exceeds useful service capacity | [overload-control](skills/performance/overload-control/SKILL.md) |
| You need a safe service split or data migration | [microservice-boundaries](skills/engineering/microservice-boundaries/SKILL.md), [microservice-extraction](skills/engineering/microservice-extraction/SKILL.md) |
| A backup restored, but safe application recovery is unproven | [recovery-validation](skills/engineering/recovery-validation/SKILL.md) |
| A supported API or library needs retirement | [technical-deprecation](skills/engineering/technical-deprecation/SKILL.md) |

A routine local change can stay local. These skills are composable, and the
collection is not a required pipeline. The [task guide](docs/toolkit-usage.md)
explains when to use a skill, a specialist, or a coordinated workflow.

### Full catalog

Promoted skills are grouped by package bucket and invocation. Architecture is user-invoked; the other promoted skills are model-invoked.


#### Engineering

##### User-invoked

- [architecture](skills/engineering/architecture/SKILL.md) — Plan software architecture or assess existing systems and proposed designs. Use for architecture decisions, migrations, and architecture reviews; exclude routine implementation, debugging, and ordinary PR review.

##### Model-invoked

- [a2a-engineering](skills/engineering/a2a-engineering/SKILL.md) — Build or review Agent2Agent (A2A) clients and servers, including discovery, task continuation, streaming, cancellation, caller isolation, and duplicate delivery. Use for A2A protocol integrations; ordinary local coding-agent delegation does not require A2A.
- [background-maintenance](skills/engineering/background-maintenance/SKILL.md) — Design, review, or tune compaction, reclamation, rebalancing, backfills, and index maintenance sharing foreground resources. Use for poor yield, shifting distributions, resource pressure, or unsafe resume; exclude finite local cleanup.
- [code-and-docs-cleanup](skills/engineering/code-and-docs-cleanup/SKILL.md) — Use for explicit code or documentation cleanup, refactoring, unused-code removal, or stale-instruction repair, or an evidenced maintenance obstacle requiring behavior-preserving restructuring. Exclude routine feature implementation, bug fixes, spelling, and formatting without a separate cleanup task.
- [concurrency-correctness](skills/engineering/concurrency-correctness/SKILL.md) — Diagnose, design, or fix race conditions across processes, including lost updates, write skew, stale cache fills, replica read-your-writes, and obsolete owners. Use when concurrent operations violate an invariant or freshness contract; exclude broad service decomposition and duplicate retries alone.
- [distributed-system-patterns](skills/engineering/distributed-system-patterns/SKILL.md) — Select and compose distributed topology patterns when deciding between colocated helpers, replicated or sharded serving, scatter/gather, ownership election, and coordinated batch stages. Exclude broad production-readiness reviews and isolated retry or duplicate-handling changes.
- [failure-oriented-testing](skills/engineering/failure-oriented-testing/SKILL.md) — Design or strengthen tests for injected faults, adversarial execution orders, generated inputs, and recovery. Use when happy-path checks miss a suspected failure or an invariant needs a discriminating oracle; exclude settled low-risk edits already covered by meaningful tests.
- [graceful-draining](skills/engineering/graceful-draining/SKILL.md) — Design, implement, or review service shutdown and job handoff during deployment, scale-down, or maintenance. Use when long-running work loses progress, is repeatedly interrupted across workers, exhausts retries during rollouts, or needs a bounded drain with safe ownership transfer.
- [idempotency](skills/engineering/idempotency/SKILL.md) — Design, implement, or review duplicate-safe APIs, webhook handlers, and queue workers. Use for idempotency keys, conflicting retries, concurrent execution, and recovery after uncertain side effects; exclude generic backoff tuning and pure read-only requests.
- [infrastructure-change-safety](skills/engineering/infrastructure-change-safety/SKILL.md) — Plan, implement, or review infrastructure changes when resource replacement, Terraform state ownership, mixed-version rollout, or partial apply can interrupt service or lose data.
- [legacy-code-changes](skills/engineering/legacy-code-changes/SKILL.md) — Change or assess untested legacy code using characterization tests and minimal dependency isolation. Use when missing behavioral coverage makes a requested change risky or constructors, globals, or hidden collaborators obstruct testing; exclude greenfield work and routine changes already covered by focused tests.
- [mcp-engineering](skills/engineering/mcp-engineering/SKILL.md) — Implement or review MCP servers and clients when protocol versions, tool contracts, caller authorization, private caching, or cancellation affect correctness. Use for building MCP integrations, rather than merely calling an available tool.
- [messaging-reliability](skills/engineering/messaging-reliability/SKILL.md) — Diagnose or implement reliable broker consumers, acknowledgements, retry and quarantine paths, event replay, and schema evolution. Use for lost or duplicate effects, out-of-order events, poison messages, and unsafe consumer checkpoints; exclude in-process collection transformations.
- [microservice-boundaries](skills/engineering/microservice-boundaries/SKILL.md) — Choose or review microservice boundaries, assess a proposed service split, or diagnose a distributed monolith's coupling. Use for business capability decomposition and service ownership; exclude routine module refactoring and general architecture reviews.
- [microservice-data](skills/engineering/microservice-data/SKILL.md) — Design or review data ownership across services, cross-service invariants and sagas, or reporting and query projections over service-owned data. Use when splitting shared tables or replacing cross-service transactions and joins; exclude single-database tuning and single-operation retry deduplication.
- [microservice-extraction](skills/engineering/microservice-extraction/SKILL.md) — Plan, review, or implement an incremental extraction from a monolith into a microservice. Use for migration seams, code/data separation, coexistence, and cutover recovery; exclude deciding service boundaries from scratch and ordinary deployments.
- [microservice-integration](skills/engineering/microservice-integration/SKILL.md) — Design or change service-to-service communication, evolve API and event contracts, or diagnose consumer coupling and chatty service calls. Use for request-response versus messaging decisions and BFF aggregation across services; exclude generic architecture reviews and single-operation retry deduplication.
- [microservice-operations](skills/engineering/microservice-operations/SKILL.md) — Assess or improve operational readiness across microservice boundaries. Use for cascading failures, cross-service observability, independent deployment and recovery, or service-specific capacity and trust boundaries; exclude generic CI setup and single-process troubleshooting.
- [microservice-testing](skills/engineering/microservice-testing/SKILL.md) — Design or review tests for independently deployable microservices. Use for consumer-driven contracts, service isolation, cross-service test coverage, or end-to-end suites that couple service releases; exclude ordinary unit-test work inside one application.
- [recovery-validation](skills/engineering/recovery-validation/SKILL.md) — Validate backup recovery or disaster-recovery claims by rehearsing restores, measuring recoverable data loss and time to application usability, and checking restored state against business invariants. Use for restore runbooks, recovery drills, failed restores, or RPO/RTO evidence; ordinary backup scheduling alone does not require a recovery drill.
- [stream-processing-design](skills/engineering/stream-processing-design/SKILL.md) — Design or review continuously maintained stream computations when choosing event-time windows, late-data handling, duplicate and correction semantics, temporal joins, output finality, or retained state. Exclude broker acknowledgement repairs and bounded in-process collection edits.
- [technical-deprecation](skills/engineering/technical-deprecation/SKILL.md) — Plan, implement, or review retirement of a supported library, API, configuration option, or internal tool when consumers must migrate. Use for replacement readiness, stalled deprecations, and removal gates; exclude private unused-helper cleanup, worker draining, and public-product shutdown policy.

#### Languages

##### Model-invoked

- [go-backend](skills/languages/go-backend/SKILL.md) — Implement or review Go services when context cancellation, goroutine ownership, resource cleanup, runtime input validation, or database transactions affect backend correctness.
- [python-backend](skills/languages/python-backend/SKILL.md) — Implement or review Python services when async cancellation, database transactions, resource ownership, or mutable request state can change backend correctness.
- [typescript-backend](skills/languages/typescript-backend/SKILL.md) — Implement or debug TypeScript services when runtime input validation, asynchronous resource ownership, request cancellation, or database transaction boundaries affect correctness. Use for backend handlers and workers, not browser UI styling or type-only library changes.

#### Performance

##### Model-invoked

- [capacity-planning](skills/performance/capacity-planning/SKILL.md) — Model backend or infrastructure capacity for traffic growth, workload changes, backlog recovery, rollouts, and failure headroom. Use for fleet or pool sizing, autoscaling plans, downstream limits, and cost per useful operation; deployment inventory alone needs no sizing analysis.
- [data-layout-performance](skills/performance/data-layout-performance/SKILL.md) — Assess or optimize measured Go and Python hot paths affected by data layout, CPU-cache locality, allocation, or shared-line contention. Use for AoS/SoA choices, hot/cold splitting, false sharing, and bounded ring/cache proposals; ordinary backend changes and dependency waiting keep their existing route.
- [database-performance](skills/performance/database-performance/SKILL.md) — Diagnose database workload latency or throughput and validate query, index, transaction-lifetime, pool, or maintenance improvements. Use for expensive queries, plan regressions, contention, and database saturation; duplicate-effect or isolation correctness alone has its existing route.
- [load-testing](skills/performance/load-testing/SKILL.md) — Build or assess backend load tests and benchmark evidence for representative demand, saturation, overload, and recovery. Use for workload models, generator limits, misleading throughput or percentile claims, and capacity experiments; ordinary unit-test assertions have their existing route.
- [overload-control](skills/performance/overload-control/SKILL.md) — Design, implement, or review load shedding, admission limits, tenant fairness, bounded queues, and adaptive concurrency when demand or dependency slowdown exhausts service resources. Use for overload containment and recovery; replica forecasting and duplicate-effect correctness have separate workflows.
- [performance-diagnosis](skills/performance/performance-diagnosis/SKILL.md) — Diagnose backend latency regressions, throughput plateaus, or resource saturation and validate a bounded improvement. Use for unexplained slowness, profiling, pool waits, container throttling, and distributed critical paths; capacity forecasts and workload construction have separate workflows.

#### Temporal

##### Model-invoked

- [temporal-ai-workflows](skills/temporal/temporal-ai-workflows/SKILL.md) — Design, implement, or review Temporal AI and agent workflows. Use for durable model/tool boundaries, bounded reasoning loops, shared conversation state, human approvals, and agent recovery; exclude generic prompt tuning and AI tasks without Temporal.
- [temporal-production-readiness](skills/temporal/temporal-production-readiness/SKILL.md) — Assess Temporal production readiness before a launch, migration, or capacity change. Use for schedule backlogs, fan-out limits, history growth, tenant isolation, and recovery evidence; complements SDK tuning and deployment guidance.
- [temporal-reliability](skills/temporal/temporal-reliability/SKILL.md) — Design, review, or fix Temporal failure paths involving duplicate Activity effects, ambiguous timeouts, saga compensation, or durable waits and cancellation. Use for payments, provisioning, and other business mutations; generic SDK setup and worker tuning belong elsewhere.
- [temporal-safe-deployments](skills/temporal/temporal-safe-deployments/SKILL.md) — Evolve Temporal applications safely across Workflow code changes, Worker rollouts, payload schemas, Continue-As-New boundaries, and workload migrations. Use when existing executions must survive a change or recover from a bad deployment.

[Miscellaneous packages](skills/misc/README.md) are public and installable but unpromoted, and are excluded from the plugin and documentation-page catalogs. The eight [Temporal integrations](integrations/temporal/README.md#install-or-list-these-packages) remain installable with the skills CLI’s `--full-depth` option.

[Eight adapted official Temporal integration packages](integrations/temporal/README.md) are catalogued separately.

The [domain reading paths](docs/reading-paths.md) connect related skills and conditional references. [Book-derived skills](docs/book-skills.md) and the [learning skills](docs/productivity/research-synthesis.md) record their source scope, including edition differences, excerpts, and supplied material.

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

- [Research ledger](research/engineering-toolkit/README.md): the 60-publisher survey, book access, selected readings, and adoption decisions.
- [October archive review](research/engineering-toolkit/2026-10-01/README.md): 58,178 metadata URLs, 29 selected article-body readings, terminal collection evidence, and explicit historical/access gaps. Metadata enumeration is separate from article reading.
- [Performance research](research/performance-capacity/README.md): measurement, capacity, overload, database work, and conditional Go/Python data-layout experiments.
- [Temporal story review](docs/temporal/README.md): all 70 customer-index entries, with written-story and talk-summary scope distinguished.
- [Runnable examples](examples/README.md): TypeScript, Python, and Go backend contracts plus messaging, cache races, worker handoffs, recovery, protocols, and retry coordination.
- [Worker rollout integration](research/worker-rollout-integration/2026-10-02/README.md): signal and ownership evidence plus focused cache, schema, fairness and deadline guidance, with runtime and agent results reported separately.
- [Verification report](research/engineering-toolkit/verification.md) and [evaluation guide](evals/README.md): deterministic checks, runtime observations, independently scored agent trials, and known host limitations.

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
