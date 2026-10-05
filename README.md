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

Skills begin with the failure that matters and lead to an observable check, so a recommendation can be challenged against the system's behavior.

[Idempotency](skills/engineering/idempotency/SKILL.md) makes uncertain retries safe by checking duplicate and conflicting effects. [Graceful draining](skills/engineering/graceful-draining/SKILL.md) protects long-running work through deployment handoffs and verifies ownership transfer.

[Concurrency correctness](skills/engineering/concurrency-correctness/SKILL.md) turns races such as stale cache fills and lost updates into explicit invariants and ordering checks. [Recovery validation](skills/engineering/recovery-validation/SKILL.md) tests whether a restore reaches usable application state and preserves business invariants.

## Choose a skill

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

## Reference

Architecture is user-invoked; the other 34 skills are model-invoked from their descriptions.

### Engineering (22)

**[architecture](skills/engineering/architecture/SKILL.md)** · **[a2a-engineering](skills/engineering/a2a-engineering/SKILL.md)** · **[background-maintenance](skills/engineering/background-maintenance/SKILL.md)** · **[code-and-docs-cleanup](skills/engineering/code-and-docs-cleanup/SKILL.md)** · **[concurrency-correctness](skills/engineering/concurrency-correctness/SKILL.md)** · **[distributed-system-patterns](skills/engineering/distributed-system-patterns/SKILL.md)** · **[failure-oriented-testing](skills/engineering/failure-oriented-testing/SKILL.md)** · **[graceful-draining](skills/engineering/graceful-draining/SKILL.md)** · **[idempotency](skills/engineering/idempotency/SKILL.md)** · **[infrastructure-change-safety](skills/engineering/infrastructure-change-safety/SKILL.md)** · **[legacy-code-changes](skills/engineering/legacy-code-changes/SKILL.md)** · **[mcp-engineering](skills/engineering/mcp-engineering/SKILL.md)** · **[messaging-reliability](skills/engineering/messaging-reliability/SKILL.md)** · **[microservice-boundaries](skills/engineering/microservice-boundaries/SKILL.md)** · **[microservice-data](skills/engineering/microservice-data/SKILL.md)** · **[microservice-extraction](skills/engineering/microservice-extraction/SKILL.md)** · **[microservice-integration](skills/engineering/microservice-integration/SKILL.md)** · **[microservice-operations](skills/engineering/microservice-operations/SKILL.md)** · **[microservice-testing](skills/engineering/microservice-testing/SKILL.md)** · **[recovery-validation](skills/engineering/recovery-validation/SKILL.md)** · **[stream-processing-design](skills/engineering/stream-processing-design/SKILL.md)** · **[technical-deprecation](skills/engineering/technical-deprecation/SKILL.md)**

### Performance (6)

**[capacity-planning](skills/performance/capacity-planning/SKILL.md)** · **[data-layout-performance](skills/performance/data-layout-performance/SKILL.md)** · **[database-performance](skills/performance/database-performance/SKILL.md)** · **[load-testing](skills/performance/load-testing/SKILL.md)** · **[overload-control](skills/performance/overload-control/SKILL.md)** · **[performance-diagnosis](skills/performance/performance-diagnosis/SKILL.md)**

### Languages (3)

**[go-backend](skills/languages/go-backend/SKILL.md)** · **[python-backend](skills/languages/python-backend/SKILL.md)** · **[typescript-backend](skills/languages/typescript-backend/SKILL.md)**

### Temporal (4)

**[temporal-ai-workflows](skills/temporal/temporal-ai-workflows/SKILL.md)** · **[temporal-production-readiness](skills/temporal/temporal-production-readiness/SKILL.md)** · **[temporal-reliability](skills/temporal/temporal-reliability/SKILL.md)** · **[temporal-safe-deployments](skills/temporal/temporal-safe-deployments/SKILL.md)**

[Miscellaneous packages](skills/misc/README.md) are installable but unpromoted; [Temporal integrations](integrations/temporal/README.md) retain upstream notices and require the skills CLI's `--full-depth` option.

## Agents and workflows

[Specialist agents](agents/README.md) handle bounded assignments; [workflows](workflows/README.md) coordinate owners, review, and acceptance across them. See the [advanced toolkit guide](docs/advanced-toolkit.md) for installation, selection, and host limits.

## How it's built

Research and source scope are recorded in the [research ledger](research/engineering-toolkit/README.md); behavioral cases, scoring, and host limitations are documented in [evals](evals/README.md). Repository validation covers packaging and generated artifacts; it does not establish production reliability or behavior on an unavailable host.

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
