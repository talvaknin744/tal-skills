# tal-skills

Portable agent skills for practical software architecture decisions.

The first skill, **architecture**, plans new designs and reviews existing systems. It starts with the user's question and the available evidence. Independent specialists and book grounding are available when they improve the decision or are explicitly requested.

## Install

Using the [skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add talvaknin744/tal-skills --skill architecture
```

Alternatively, copy the entire `skills/engineering/architecture` directory into your agent's supported skills directory. Keep its references and `agents` directory together. The skill instructions require no npm installation, API key, specific model, or NanoClaw runtime. Optional independent panels need a host with subagents; current-source and book verification need access to relevant sources.

## Use

Invoke `$architecture` in Codex, or use your agent's skill invocation mechanism. It can also be selected for architecture requests by hosts supporting automatic discovery.

```text
Use $architecture to review our checkout architecture.
Prioritize data consistency and recovery. Cite the code behind each risk.
```

```text
Use $architecture to plan a modular monolith for this product.
We have two engineers and six weeks. Preserve the existing public API.
```

```text
Use $architecture with independent security and reliability perspectives.
State disagreements and the evidence that would resolve them.
```

```text
Use $architecture to evaluate this design against the named book and edition.
Strictly verify each attribution and report anything you cannot substantiate.
```

Routine implementation, debugging, and ordinary PR review are outside this skill's trigger. Architecture analysis is read-only unless implementation is authorized. A strict requirement remains explicitly unresolved when the necessary capability or evidence is unavailable.

## What changed from the original

- Direct evidence-based analysis is the default; specialist panels scale with material risks.
- Research is tied to relevant changing facts. Ordinary reviews have no book quota.
- Every correction or replacement stage has a bounded retry and a stated failure outcome.
- The final answer leads with the decision, useful strengths, risks, and next steps.
- Book replacement responses and complete accepted collections have separate contracts and stable IDs.
- Structural checks and contract regressions run in CI; behavioral cases use real miniature fixtures and observable rubrics.

The skill preserves the original's useful separation between architectural direction and operational proof. Source citations and agreement between agents do not prove a system works in production.

## Repository map

Skills are grouped by concern: `skills/<concern>/<skill-name>/`. The current
concern is `engineering`. Add other concerns only when a real skill needs them;
keep each skill self-contained and its name unique across the repository.

```text
skills/
└── engineering/
    └── architecture/
        ├── SKILL.md
        ├── LICENSE
        ├── agents/
        └── references/
evals/
├── README.md
└── architecture/
    ├── cases.json
    └── fixtures/
scripts/
├── check-skills.mjs
└── architecture/
tests/
└── architecture/
```

| Path | Purpose |
|---|---|
| [skills/engineering/architecture/SKILL.md](skills/engineering/architecture/SKILL.md) | Entry point and shared workflow |
| [skills/engineering/architecture/references](skills/engineering/architecture/references) | Planning, review, panels, book grounding, and book contracts |
| [scripts/architecture](scripts/architecture) | Maintainer validation tools |
| [tests/architecture](tests/architecture) | Deterministic regression and fixture-integrity tests |
| [evals/architecture](evals/architecture) | Behavioral scenarios, source fixtures, and evaluation procedure |

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

Revised from [NanoClaw's Code Architect](https://github.com/nanocoai/nanoclaw-templates/tree/7d3cb40409a4a7b8f2cf562b0d80fceb612b941b/engineering/code-architect), created by [zvi-fried](https://github.com/zvi-fried), under the MIT license. The upstream copyright notice is retained in [LICENSE](LICENSE).

Instruction design follows the principles described in Matt Pocock's [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents): precise routing, progressive disclosure, observable completion, and removing instructions that do not change useful behavior. This repository is an independent revision and is not endorsed by those projects.
