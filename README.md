# tal-skills

40 portable skills, 15 specialist agents, and eight engineering workflows,
organized by concern and backed by source records and executable failure scenarios.

Start with the [task-to-workflow guide and project-local installation](docs/toolkit-usage.md).
Use the [domain reading paths](docs/reading-paths.md) for deeper study and the
[research ledger](docs/research/engineering-toolkit/README.md) for the 60-publisher
survey, selected articles, book access records, and applicability limits.
The [verification report](docs/research/engineering-toolkit/verification.md)
separates repository checks, runtime experiments, skill trials, and native host observations.

## Agents and workflows

The canonical [agents](agents/) cover coordination, Python, TypeScript, Go,
boundaries, idempotency, consistency, durability, messaging, infrastructure,
reliability, failure testing, MCP, A2A, and cleanup. Generated adapters support
Codex and Claude while inheriting the user's model settings.

The eight [workflows](workflows/) handle backend delivery, consistency diagnosis,
messaging evolution, worker rollout, recovery validation, MCP integration, A2A
integration, and cleanup. The main session selects relevant specialists, assigns
one writer per overlapping file set, and returns independent findings to that
owner. Small changes use a short path.

```sh
npm ci --ignore-scripts
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-backend-delivery --dry-run
node scripts/install-toolkit.mjs --target /absolute/path/to/project --host codex --workflow tal-backend-delivery
```

Choose `claude` or `both` for the other host. Installation is project-local,
includes selected dependencies, tracks owned files, and stops on collisions.
The [usage guide](docs/toolkit-usage.md) explains selection updates, native
invocation, recovery and host limitations. [Runnable examples](examples/) test
backend contracts, messaging, stale cache fills, worker handoffs, restore
validation, infrastructure changes, cleanup and protocol boundaries.

## Skills

| Concern | Skill | Use it for |
|---|---|---|
| Languages | [python-backend](skills/languages/python-backend/SKILL.md) | Python service boundaries, async ownership, cancellation and transactions |
| Languages | [typescript-backend](skills/languages/typescript-backend/SKILL.md) | Runtime validation, trusted context and owned asynchronous resources |
| Languages | [go-backend](skills/languages/go-backend/SKILL.md) | Context propagation, goroutine completion and transaction cleanup |
| Messaging | [messaging-reliability](skills/messaging/messaging-reliability/SKILL.md) | Publication, acknowledgement, replay, ordering and bounded consumer failure |
| Infrastructure | [infrastructure-change-safety](skills/infrastructure/infrastructure-change-safety/SKILL.md) | Partial applies, identity-preserving changes, rollout and recovery |
| Reliability | [recovery-validation](skills/reliability/recovery-validation/SKILL.md) | Restored application contracts, accepted work, effects and recovery objectives |
| Testing | [failure-oriented-testing](skills/testing/failure-oriented-testing/SKILL.md) | Independent oracles, controlled fault schedules and meaningful regressions |
| Quality | [code-and-docs-cleanup](skills/quality/code-and-docs-cleanup/SKILL.md) | Evidence-backed simplification that preserves behavior and useful rationale |
| Protocols | [mcp-engineering](skills/protocols/mcp-engineering/SKILL.md) | Pinned MCP versions, authority, resource isolation and request lifecycle |
| Protocols | [a2a-engineering](skills/protocols/a2a-engineering/SKILL.md) | Pinned A2A versions, task ownership, observers and duplicate business effects |
| Productivity | [learning-plan](skills/productivity/learning-plan/SKILL.md) | Feasible study schedules, actual progress, prerequisite triage and exam preparation |
| Productivity | [retrieval-coach](skills/productivity/retrieval-coach/SKILL.md) | Interactive recall, mathematical feedback and spaced review from observed attempts |
| Productivity | [learning-experiments](skills/productivity/learning-experiments/SKILL.md) | Diagnose a study bottleneck and test one bounded change against fresh performance |
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
| Engineering | [pragmatic-programming](skills/engineering/pragmatic-programming/SKILL.md) | Changeability, knowledge duplication, and feedback through working slices |
| Engineering | [enterprise-application-patterns](skills/engineering/enterprise-application-patterns/SKILL.md) | Domain logic, persistence mapping, and transaction boundaries |
| Engineering | [object-design-patterns](skills/engineering/object-design-patterns/SKILL.md) | Applying object patterns to concrete variation and coupling |
| Temporal | [temporal-reliability](skills/temporal/temporal-reliability/SKILL.md) | Activity effects, uncertain outcomes, compensation, and durable waits |
| Temporal | [temporal-safe-deployments](skills/temporal/temporal-safe-deployments/SKILL.md) | Replay compatibility, Worker deployments, history rollover, and migrations |
| Temporal | [temporal-production-readiness](skills/temporal/temporal-production-readiness/SKILL.md) | Capacity, backlog, data lifetime, isolation, and recovery evidence |
| Temporal | [temporal-ai-workflows](skills/temporal/temporal-ai-workflows/SKILL.md) | Durable agent loops, tool effects, context, budgets, and approvals |

Also bundled: **eight adapted official Temporal skills** for SDK development, design review, Cloud, operations, worker tuning, observability, serverless Workers, and Cloud setup. See the [official skill catalog and local corrections](integrations/temporal/README.md).

The four focused Temporal skills draw on a [review of all 70 customer-index entries](docs/temporal/README.md), with source-by-source evidence limits and current primary documentation. Talk summaries are labeled separately from complete written stories.

The eleven [book-derived engineering skills](docs/book-skills.md) are independently usable workflows built from the supplied sources using Writing for Agents. Each carries its own conditional references, source locators, and observable completion criteria. The catalog records edition differences and the limited scope of the supplied Legacy Code draft.

The two distributed-correctness skills are backed by [primary-source research, an eight-repository skill audit, and a book shortlist](docs/research/README.md). They focus on concrete interruption and race histories, with [isolated evaluation fixtures](evals/distributed-correctness/README.md).

## Install

Using the [skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add talvaknin744/tal-skills --skill architecture
npx skills@latest add talvaknin744/tal-skills --skill idempotency
npx skills@latest add talvaknin744/tal-skills --skill graceful-draining
npx skills@latest add talvaknin744/tal-skills --skill concurrency-correctness
npx skills@latest add talvaknin744/tal-skills --skill microservice-extraction
npx skills@latest add talvaknin744/tal-skills --skill temporal-reliability
npx skills@latest add talvaknin744/tal-skills --skill temporal-developer
```

Alternatively, copy a complete `skills/<concern>/<skill-name>` directory into your agent's supported skills directory. Keep its references, scripts, license, and metadata together. Reading a skill requires no package installation or particular model. Execution uses the target project's tools and dependencies; Temporal operations and setup may require its CLI, credentials, and explicitly requested infrastructure. Optional architecture panels need subagents.

Choose the skills relevant to your work. If an upstream Temporal skill with the same name is already installed, choose which version to retain rather than installing conflicting copies. Bundled adaptations and upstream update instructions are documented in the catalog.

## Use

For studying, use `$learning-plan` to plan, `$retrieval-coach` to practise, or `$learning-experiments` to improve a habit. The skills include Hebrew study prompts and conditional Infi 2 guidance, while remaining usable for other subjects and everyday learning. Their [research provenance and coverage](docs/productivity/research-synthesis.md) distinguish reviewed transcript advice from independent evidence. They do not activate reminders merely by producing a plan or prompt.

Invoke a skill by name, such as `$architecture` or `$temporal-reliability` in Codex, or use your agent's skill invocation mechanism. Hosts supporting automatic discovery can select a skill when its description matches the request.

```text
Use $architecture to review our checkout architecture.
Prioritize data consistency and recovery. Cite the code behind each risk.
```

```text
Use $idempotency to review this webhook handler.
Check concurrent deliveries, changed payloads, and crashes after downstream success.
```

```text
Use $idempotency to fix duplicate invoice creation in this endpoint.
Preserve its public contract and add regression tests in the existing framework.
```

```text
Use $architecture to evaluate this design against the named book and edition.
Strictly verify each attribution and report anything you cannot substantiate.
```

```text
Use $temporal-safe-deployments to review this Workflow change.
Account for open executions, old Worker versions, and rollback.
```

```text
Use $temporal-ai-workflows to review our refund agent.
Check duplicate tool calls, approval expiry, and the budget across Continue-As-New.
```

The architecture skill excludes routine implementation, debugging, and ordinary PR review. The idempotency skill handles focused design, review, and implementation of duplicate-suppression and recovery behavior. Reviews stay read-only unless execution is already authorized; implementation requests authorize their scoped changes. Required capabilities or evidence that are missing remain explicit limitations.

Choose one book-derived skill for the decision at hand; the collection is not a required pipeline. For example:

```text
Use $microservice-boundaries to assess this proposed service split.
Compare it with retaining modules in the current application.
```

```text
Use $microservice-extraction to plan extracting fulfillment.
Account for old workers, shared data, and recovery after the new service accepts writes.
```

```text
Use $legacy-code-changes to add this behavior to the untested importer.
First establish the existing behavior and isolate the external dependency.
```

```text
Use $graceful-draining to review our 24-hour import workers.
Explain how rolling replacements preserve progress without consuming the business retry budget.
```

```text
Use $concurrency-correctness to fix this stale-cache race.
Reconstruct the competing operations and force the failing ordering in a regression.
```

## Design principles

- Keep triggers specific and the common workflow short; load conditional references only when relevant.
- Work from concrete project evidence and preserve the user's scope and technology choices.
- Give failure and recovery paths an observable outcome instead of claiming unsupported guarantees.
- Test behavior with realistic inputs; distinguish deterministic repository checks from agent evaluations.

Source citations, remembered patterns, and agreement between agents do not prove a system works in production.

## Repository map

Skills are grouped by concern: `skills/<concern>/<skill-name>/`. Current
concerns include languages, engineering, messaging, infrastructure, reliability,
testing, quality, protocols, productivity and Temporal. Add concerns when a real skill needs them;
keep each skill self-contained and its name unique across the repository.

```text
skills/
├── languages/
├── messaging/
├── infrastructure/
├── reliability/
├── testing/
├── quality/
├── protocols/
├── engineering/
│   ├── architecture/
│   ├── idempotency/
│   ├── graceful-draining/
│   ├── concurrency-correctness/
│   └── <book-derived-skill>/
├── productivity/
│   ├── learning-plan/
│   ├── retrieval-coach/
│   └── learning-experiments/
└── temporal/
    └── <skill-name>/
agents/                 Canonical roles grouped by concern
workflows/              Eight task paths and a shared handoff
adapters/               Generated native agent files and workflow templates
examples/               Explicit runnable runtime experiments
docs/
├── research/
├── book-skills.md
└── temporal/
integrations/
└── temporal/
evals/
├── distributed-correctness/
├── README.md
├── architecture/
├── idempotency/
├── <book-derived-skill>/
└── temporal/
scripts/
├── check-skills.mjs
├── architecture/
└── lib/
tests/
├── distributed-correctness/
├── architecture/
├── idempotency/
├── book-skills/
└── temporal/
```

| Path | Purpose |
|---|---|
| [agents](agents/) | Canonical bounded specialist roles and shared execution contract |
| [workflows](workflows/) | Task routing, ownership, review and acceptance paths |
| [adapters](adapters/) | Generated Codex and Claude definitions; installed through the toolkit installer |
| [examples](examples/) | Pinned runtime scenarios, commands, observations and limitations |
| [skills/engineering](skills/engineering) | Self-contained skills: each has SKILL.md, optional references, and UI metadata |
| [skills/temporal](skills/temporal) | Focused Temporal skills and attributed adaptations of official skills |
| [docs/temporal](docs/temporal) | Customer-story coverage, observations, inferences, and evidence limits |
| [docs/research](docs/research) | Architecture/programming source audits, book reading scope, and focused additions |
| [integrations/temporal](integrations/temporal) | Official upstream revisions, licenses, and documented local corrections |
| [scripts](scripts) | Shared packaging checks and skill-specific maintainer tools |
| [tests](tests) | Deterministic regression and fixture-integrity tests, grouped by skill |
| [evals](evals) | Behavioral scenarios and isolated project fixtures, grouped by skill |

## Validate changes

Maintainers need Node.js 22 or later:

```sh
npm ci --ignore-scripts
npm run validate
```

CI checks packaging, local references, metadata, provenance, generated native adapters, installer behavior, evaluation fixtures, and published evidence hashes and bindings. These deterministic checks do not execute a model or prove the quality of its advice. Follow [evals/README.md](evals/README.md) for independent behavioral trials and report observed results separately from authored expectations.

When changing instructions, compare behavior on the affected scenarios. Remove repetition only when the receiving agent still has the necessary context. Keep the user's scope and requested output intact.

See [CONTRIBUTING.md](CONTRIBUTING.md) for adding the next skill.

## Attribution and license

The architecture skill is revised from [NanoClaw's Code Architect](https://github.com/nanocoai/nanoclaw-templates/tree/7d3cb40409a4a7b8f2cf562b0d80fceb612b941b/engineering/code-architect), created by [zvi-fried](https://github.com/zvi-fried), under the MIT license. Its upstream copyright notice is retained in [LICENSE](LICENSE).

The idempotency skill was prompted by Dochia's [Idempotency Is Easy Until the Second Request Is Different](https://blog.dochia.dev/blog/idempotency/). Its independently written instructions link to [primary technical references](skills/engineering/idempotency/references/sources.md); the article is not bundled or relicensed.

The book-derived skills draw on works by Sam Newman, Brendan Burns, Michael Feathers, Andrew Hunt and David Thomas, Martin Fowler and contributors, and the authors of *Head First Design Patterns*. [Source copies and scope](docs/book-skills.md) are documented separately. The original skill instructions are MIT-licensed; the books, illustrations, and examples are not bundled or relicensed.

Temporal customer stories are linked and paraphrased, not redistributed. Official Temporal skill adaptations retain their MIT notices and carry an `UPSTREAM.md` describing the source revision and modifications. Their inclusion does not imply endorsement by Temporal.

Instruction design follows the principles described in Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents): precise routing, progressive disclosure, observable completion, and removing instructions that do not change useful behavior. This repository is an independent revision and is not endorsed by those projects.
