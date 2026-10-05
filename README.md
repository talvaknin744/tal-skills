# tal-skills

Backend and distributed-systems skills that turn failure scenarios into checks you can run.

[![skills.sh](https://skills.sh/b/talvaknin744/tal-skills)](https://skills.sh/talvaknin744/tal-skills) [![Validate skills](https://github.com/talvaknin744/tal-skills/actions/workflows/validate.yml/badge.svg)](https://github.com/talvaknin744/tal-skills/actions/workflows/validate.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Install in 30 seconds

```sh
npx skills@latest add talvaknin744/tal-skills
```

<details>
<summary>Claude Code plugin commands</summary>

```sh
claude plugin marketplace add talvaknin744/tal-skills
claude plugin install tal-skills@tal-skills
```

</details>

For the complete toolkit, including specialists and coordinated workflows, see the [advanced guide](docs/advanced-toolkit.md).

## Why these skills

Skills turn failure scenarios into observable checks against system behavior.

[Idempotency](skills/engineering/idempotency/SKILL.md) makes uncertain retries safe by checking duplicate and conflicting effects. [Graceful draining](skills/engineering/graceful-draining/SKILL.md) protects long-running work through deployment handoffs and verifies ownership transfer.

[Concurrency correctness](skills/engineering/concurrency-correctness/SKILL.md) turns races such as stale cache fills and lost updates into explicit invariants and ordering checks. [Recovery validation](skills/engineering/recovery-validation/SKILL.md) tests whether a restore reaches usable application state and preserves business invariants.

## Reference

Architecture is user-invoked; the other 34 skills are model-invoked from their descriptions.

### Engineering (22)

- **[architecture](skills/engineering/architecture/SKILL.md)**: evidence-based system decisions
- **[a2a-engineering](skills/engineering/a2a-engineering/SKILL.md)**: Agent2Agent interoperability
- **[background-maintenance](skills/engineering/background-maintenance/SKILL.md)**: resource-bounded storage and index upkeep
- **[code-and-docs-cleanup](skills/engineering/code-and-docs-cleanup/SKILL.md)**: behavior-preserving cleanup
- **[concurrency-correctness](skills/engineering/concurrency-correctness/SKILL.md)**: correct concurrent histories
- **[distributed-system-patterns](skills/engineering/distributed-system-patterns/SKILL.md)**: topology choices under constraints
- **[failure-oriented-testing](skills/engineering/failure-oriented-testing/SKILL.md)**: reproducible failure checks
- **[graceful-draining](skills/engineering/graceful-draining/SKILL.md)**: recoverable work during shutdown
- **[idempotency](skills/engineering/idempotency/SKILL.md)**: duplicate-safe business effects
- **[infrastructure-change-safety](skills/engineering/infrastructure-change-safety/SKILL.md)**: safe infrastructure transitions
- **[legacy-code-changes](skills/engineering/legacy-code-changes/SKILL.md)**: testable legacy changes
- **[mcp-engineering](skills/engineering/mcp-engineering/SKILL.md)**: MCP protocol integrations
- **[messaging-reliability](skills/engineering/messaging-reliability/SKILL.md)**: broker delivery and recovery
- **[microservice-boundaries](skills/engineering/microservice-boundaries/SKILL.md)**: capability ownership seams
- **[microservice-data](skills/engineering/microservice-data/SKILL.md)**: cross-service data consistency
- **[microservice-extraction](skills/engineering/microservice-extraction/SKILL.md)**: incremental service extraction
- **[microservice-integration](skills/engineering/microservice-integration/SKILL.md)**: service contract design
- **[microservice-operations](skills/engineering/microservice-operations/SKILL.md)**: service operation readiness
- **[microservice-testing](skills/engineering/microservice-testing/SKILL.md)**: service-level integration evidence
- **[recovery-validation](skills/engineering/recovery-validation/SKILL.md)**: usable application restore evidence
- **[stream-processing-design](skills/engineering/stream-processing-design/SKILL.md)**: event-time result semantics
- **[technical-deprecation](skills/engineering/technical-deprecation/SKILL.md)**: safe supported-interface retirement.

### Performance (6)

- **[capacity-planning](skills/performance/capacity-planning/SKILL.md)**: workload capacity estimates
- **[data-layout-performance](skills/performance/data-layout-performance/SKILL.md)**: measured Go/Python memory-layout tuning
- **[database-performance](skills/performance/database-performance/SKILL.md)**: database bottleneck diagnosis
- **[load-testing](skills/performance/load-testing/SKILL.md)**: reproducible load evidence
- **[overload-control](skills/performance/overload-control/SKILL.md)**: bounded admission under overload
- **[performance-diagnosis](skills/performance/performance-diagnosis/SKILL.md)**: evidence-led latency diagnosis.

### Languages (3)

- **[go-backend](skills/languages/go-backend/SKILL.md)**: safe Go backend changes
- **[python-backend](skills/languages/python-backend/SKILL.md)**: correct Python backend changes
- **[typescript-backend](skills/languages/typescript-backend/SKILL.md)**: reliable TypeScript backend changes.

### Temporal (4)

- **[temporal-ai-workflows](skills/temporal/temporal-ai-workflows/SKILL.md)**: bounded durable agent workflows
- **[temporal-production-readiness](skills/temporal/temporal-production-readiness/SKILL.md)**: workload-specific launch evidence
- **[temporal-reliability](skills/temporal/temporal-reliability/SKILL.md)**: safe effects and recovery
- **[temporal-safe-deployments](skills/temporal/temporal-safe-deployments/SKILL.md)**: compatible workflow rollouts.

[Miscellaneous packages](skills/misc/README.md) are installable but unpromoted. [Temporal integrations](integrations/temporal/README.md) retain upstream notices and require the skills CLI's `--full-depth` option.

## Agents and workflows

[Specialist agents](agents/README.md) handle bounded assignments; [workflows](workflows/README.md) coordinate review and acceptance. The [advanced guide](docs/advanced-toolkit.md) covers installation, selection, and host limits.

## How it's built

The [research ledger](research/engineering-toolkit/README.md) records sources; [evals](evals/README.md) documents behavioral cases, scoring, and host limits. Repository validation covers packaging and generated artifacts, not production reliability or unavailable hosts.

## Contributing

Use [CONTRIBUTING.md](CONTRIBUTING.md) to add a focused skill or improve an existing one. Keep public names stable, packages self-contained, and completion criteria observable. See the [change log](CHANGELOG.md) for release scope.

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
