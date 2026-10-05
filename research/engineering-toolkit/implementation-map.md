# Implementation handoff

This map fixes repository boundaries after research. It supplements the
[approved scope](implementation-plan.md), [installation contract](installation-contract.md),
and [evaluation contract](evaluation-contract.md); it is not completion evidence.

## Write ownership

| Workstream | Owned paths |
| --- | --- |
| Native generation and installation | `scripts/toolkit/`, `scripts/generate-adapters.mjs`, `scripts/install-toolkit.mjs`, `scripts/check-toolkit.mjs`, `tests/toolkit/`, generated `adapters/` |
| Canonical coordination | `agents/`, `workflows/` |
| TypeScript | `skills/languages/typescript-backend/`, `examples/backend/typescript/` |
| Python | `skills/languages/python-backend/`, `examples/backend/python/` |
| Go | `skills/languages/go-backend/`, `examples/backend/go/` |
| Messaging | `skills/messaging/messaging-reliability/`, `examples/messaging/` |
| Infrastructure | `skills/infrastructure/infrastructure-change-safety/`, `examples/infrastructure/` |
| Recovery | `skills/reliability/recovery-validation/`, `examples/recovery/` |
| Testing and cleanup | `skills/testing/failure-oriented-testing/`, `skills/quality/code-and-docs-cleanup/`, `examples/quality/` |
| MCP | `skills/protocols/mcp-engineering/`, `examples/protocols/mcp/` |
| A2A | `skills/protocols/a2a-engineering/`, `examples/protocols/a2a/` |
| Temporal corrections | Audited `skills/temporal/` packages, their local provenance records, `integrations/temporal/`, relevant `tests/temporal/` |
| Controlled handoff example | `examples/draining/` |
| Cache ordering example | `examples/cache/` |
| Evaluation corpus and runner | Ten new `evals/<skill>/` packages, `evals/engineering-toolkit/`, `scripts/evals/`, `tests/engineering-toolkit/` |
| Integration coordinator | Root docs, package/lockfiles, CI, common backend schema and launcher, final evidence/publication |

Owners request a change from the current owner of shared files instead of editing
them concurrently. Reviewers return findings; the owner corrects and reruns the
affected checks. Generated adapters are changed through their canonical inputs
and generator, not hand-edited.

## Authoring constraints

Use Writing for Agents: precise activation, a short conditional workflow, and an
observable done condition. Keep technical guidance in the independently
installable skills. Preserve existing public names. Relative skill links stay
inside that package; reference optional siblings by name, without creating hidden
installation dependencies. Source notes retain exact editions, reading scope,
version pins, and limits. Do not copy source-book text or examples.

Canonical role/workflow names and metadata follow the installation contract.
Native wrappers are committed as `SKILL.md.template` and become `SKILL.md` only
inside the installed target. Existing skill packages are copied unchanged.
Model and permission settings remain inherited. The main session coordinates;
the coordinator role is available without requiring an extra nested layer.

Each workflow supports an appropriately short path. Additional specialists need
an independent bounded question; the roster is not a required pipeline. Bind
reviews and checks to the actual candidate. Preserve ownership and unfinished
effects across interrupted handoffs rather than redispatching blindly.

## Runnable examples

Backend implementations share the [reservation contract](backend-contract-review.md)
and [runtime findings](backend-runtime-feasibility.md). The coordinator owns the
common SQL and disposable PostgreSQL launcher. Each language owner supplies its
native API, dependency pins, verifier, and concise README. A small library-level
operation is sufficient; an HTTP framework is not required.

All runtime examples use synthetic local data and disposable resources by
default. Environment-dependent example verifiers must be named `verify.*` or
explicitly launched scripts, not automatically discovered `*.test.*` files.
`npm test` remains the deterministic repository test suite; explicit runtime
commands exercise Docker, language runtimes, and protocol peers separately.

Retain the research probes' distinctions: local database effects are not external
provider transactions; short worker processes do not establish 24-hour operation;
SDK interoperability is not full protocol conformance; synthetic principal maps
are not OAuth token validation. Failure cases pass only when the intended unsafe
result is rejected or accurately reported.

## Release evidence

Keep authored scenarios, structural checks, runtime observations, native host
behavior, and independent scores separate. The first required observations are
one positive and one nontrigger per new skill, plus actual native backend workflow
execution where host capabilities permit. The second positive remains authored
coverage unless run. Preserve failed attempts and blocked host cells.

Freeze candidate snapshots before trials. Any subsequent relevant edit needs
fresh verification; older results remain historical. Integration ends with
repository validation, independent reviews, committed artifacts, and publication
within the user's recorded eight-hour limit.
