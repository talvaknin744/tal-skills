# tal-skills

Portable agent skills, organized by concern and backed by realistic evaluation cases.

## Skills

| Concern | Skill | Use it for |
|---|---|---|
| Engineering | [architecture](skills/engineering/architecture/SKILL.md) | Architecture planning and review, with optional independent specialists and book grounding |
| Engineering | [idempotency](skills/engineering/idempotency/SKILL.md) | Designing, implementing, and reviewing retry-safe APIs, webhooks, and queue workers |

## Install

Using the [skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add talvaknin744/tal-skills --skill architecture
npx skills@latest add talvaknin744/tal-skills --skill idempotency
```

Alternatively, copy a complete `skills/<concern>/<skill-name>` directory into your agent's supported skills directory. Keep its references and `agents` directory together. The instructions require no npm installation, API key, specific model, or NanoClaw runtime. Optional panels need subagents; source verification needs access to relevant sources. Implementation work uses the tools and dependencies of the target project.

## Use

Invoke `$architecture` or `$idempotency` in Codex, or use your agent's skill invocation mechanism. Hosts supporting automatic discovery can select a skill when its description matches the request.

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

The architecture skill excludes routine implementation, debugging, and ordinary PR review. The idempotency skill handles focused design, review, and implementation of duplicate-suppression and recovery behavior. Reviews stay read-only unless execution is already authorized; implementation requests authorize their scoped changes. Required capabilities or evidence that are missing remain explicit limitations.

## Design principles

- Keep triggers specific and the common workflow short; load conditional references only when relevant.
- Work from concrete project evidence and preserve the user's scope and technology choices.
- Give failure and recovery paths an observable outcome instead of claiming unsupported guarantees.
- Test behavior with realistic inputs; distinguish deterministic repository checks from agent evaluations.

Source citations, remembered patterns, and agreement between agents do not prove a system works in production.

## Repository map

Skills are grouped by concern: `skills/<concern>/<skill-name>/`. The current
concern is `engineering`. Add other concerns only when a real skill needs them;
keep each skill self-contained and its name unique across the repository.

```text
skills/
└── engineering/
    ├── architecture/
    └── idempotency/
evals/
├── README.md
├── architecture/
└── idempotency/
scripts/
├── check-skills.mjs
└── architecture/
tests/
├── architecture/
└── idempotency/
```

| Path | Purpose |
|---|---|
| [skills/engineering](skills/engineering) | Self-contained skills: each has SKILL.md, optional references, and UI metadata |
| [scripts](scripts) | Shared packaging checks and skill-specific maintainer tools |
| [tests](tests) | Deterministic regression and fixture-integrity tests, grouped by skill |
| [evals](evals) | Behavioral scenarios and isolated project fixtures, grouped by skill |

## Validate changes

Maintainers need Node.js 22 or later:

```sh
npm ci --ignore-scripts
npm run validate
```

CI checks packaging, local reference resolution, metadata, contract structure, replacement semantics, and evaluation fixture integrity. These deterministic checks do not execute a model or prove the quality of its advice. Follow [evals/README.md](evals/README.md) for independent behavioral trials and report observed results separately from authored expectations.

When changing instructions, compare behavior on the affected scenarios. Remove repetition only when the receiving agent still has the necessary context. Keep the user's scope and requested output intact.

See [CONTRIBUTING.md](CONTRIBUTING.md) for adding the next skill.

## Attribution and license

The architecture skill is revised from [NanoClaw's Code Architect](https://github.com/nanocoai/nanoclaw-templates/tree/7d3cb40409a4a7b8f2cf562b0d80fceb612b941b/engineering/code-architect), created by [zvi-fried](https://github.com/zvi-fried), under the MIT license. Its upstream copyright notice is retained in [LICENSE](LICENSE).

The idempotency skill was prompted by Dochia's [Idempotency Is Easy Until the Second Request Is Different](https://blog.dochia.dev/blog/idempotency/). Its independently written instructions link to [primary technical references](skills/engineering/idempotency/references/sources.md); the article is not bundled or relicensed.

Instruction design follows the principles described in Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents): precise routing, progressive disclosure, observable completion, and removing instructions that do not change useful behavior. This repository is an independent revision and is not endorsed by those projects.
