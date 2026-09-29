# Engineering toolkit research

Research begun 29 September 2026 for the approved expansion of `tal-skills`.
The [session record](research-session.json) separates the research window, its
usage-limit interruption, and the later implementation and evaluation phases.
Do not infer completed implementation from a proposed practice or test below.

## Coverage and evidence

The [publisher survey](publisher-survey.json) contains **60 distinct engineering
publishers**, selected to cover six engineering concerns. This is a curated
survey, not a popularity ranking. Each lane verified ten publisher indexes and
deeply read four selected articles: **24 articles in total**. Index verification
does not mean an entire archive was read. The lane records distinguish article
reading from source-code inspection, current documentation, and inaccessible
material.

| Research lane | Findings | Structured sources |
| --- | --- | --- |
| Backend and architecture | [Backend](lanes/backend.md) | [Ledger](lanes/backend.json) |
| Storage and consistency | [Storage](lanes/storage.md) | [Ledger](lanes/storage.json) |
| Messaging and durable execution | [Messaging](lanes/messaging.md) | [Ledger](lanes/messaging.json) |
| Infrastructure and reliability | [Infrastructure](lanes/infra.md) | [Ledger](lanes/infra.json) |
| Quality and testing | [Quality](lanes/quality.md) | [Ledger](lanes/quality.json) |
| Agent systems and orchestration | [Agents](lanes/agents.md) | [Ledger](lanes/agents.json) |

Each article's adopted practice records a trigger, failure, mechanism,
applicability conditions, counterexample, and observable verification. A reported
company result is evidence about that system; it is not an expected result for
this toolkit or a reason to copy its scale and architecture.

The book records identify the exact edition and sections read:

- [Language books](books-languages.md): four books, with a separate
  [source ledger](books-languages.json).
- [Operations books](books-operations.md): infrastructure, messaging, and
  extensions to existing reliability/data research;
  [source ledger](books-operations.json).
- [Quality books](books-quality.md): testing, refactoring, and code review;
  [source ledger](books-quality.json).

Complete accessible text was sought where previews were insufficient. An
available complete book is not labeled completely read when only selected
chapters were read. Publisher samples, author articles, sample code, and draft
editions remain distinct. Copyrighted books and articles are linked rather than
bundled; the proposed instructions and examples are independently written.

## Decisions for implementation

1. **Correct existing advice before adding orchestration.** The
   [engineering audit](audit-engineering.md) reviewed all 15 engineering skills
   and 87 files. The [Temporal/productivity audit](audit-temporal-productivity.md)
   covered all remaining 15 entrypoints and sampled their risk-bearing
   references. Preserve public names and useful existing boundaries. Prioritize
   credential exposure, misleading retry health, timeout semantics, and outdated
   feature claims over speculative prose rewrites.
2. **Keep language specialists narrow.** Three new language skills implement
   established contracts using the project's runtime and framework. They do not
   require a repository/service-layer framework or replace the existing
   architecture, idempotency, concurrency, and draining skills.
3. **Teach failures with observable outcomes.** Messaging, infrastructure change
   safety, recovery validation, and failure testing must state which boundary
   was crossed, what survives interruption, and what evidence would distinguish
   the broken implementation from the corrected one.
4. **Make cleanup behavior-preserving.** Preserve public contracts, cancellation,
   tenant boundaries, operational signals, and useful rationale. Similar text or
   code does not by itself establish shared ownership or justify deduplication.
5. **Pin protocol contracts.** The public skill names remain `mcp-engineering`
   and `a2a-engineering`. [Protocol research](protocols.md) distinguishes released
   specification versions, wire versions, SDK support, and known discrepancies.
   These specialists build integrations; A2A is not required to run the native
   coding-agent team.
6. **Coordinate only the relevant specialists.** Canonical roles describe task
   boundaries, skill dependencies, required evidence, and return contracts.
   Workflows keep the main session in charge and assign one implementation owner
   per overlapping file set. Reviews refer to a stable candidate, and the owner
   resolves findings before evidence is accepted.
7. **Treat installation and native execution as separate claims.** The
   [native compatibility probes](native-compatibility.md) identify actual loader
   paths, installed versions, and execution limits. Generated configuration can
   be structurally valid while trust, authentication, or model compatibility
   prevents execution. Preserve the user's model and host configuration.

The [approved implementation plan](implementation-plan.md) remains the scope:
ten new independently installable skills, fifteen canonical roles, eight
workflows, project-local native installation, three language examples, and
separately reported evaluations. Research recommendations using tentative names
do not override those public names.

## Contradictions and experiments

Independent crosschecks paired lanes rather than asking each author to approve
their own claims:

- [Backend reviews quality](crosscheck-backend-quality.md) and
  [quality reviews backend](crosscheck-quality-backend.md).
- [Infrastructure reviews storage](crosscheck-infra-storage.md) and
  [storage reviews messaging](crosscheck-storage-messaging.md).
- [Messaging reviews agents](crosscheck-messaging-agents.md) and
  [agents review infrastructure](crosscheck-agents-infra.md).

Corrections include version-dependent retry counts, persistence versus broker
acknowledgement, state events versus delta events, historical platform shutdown
limits, and the difference between a restored database and an operationally
recovered application. Current specifications and runtime contracts take
precedence over historical examples when they conflict.

The [backend contract review](backend-contract-review.md) specifies an original
inventory-reservation example for TypeScript, Python, and Go. A real disposable
PostgreSQL experiment [recorded separately](storage-probe-results.json) dropped a
COMMIT reply, observed the committed effect, and recovered the original receipt
with the same operation key. It also reproduced a concurrent insert-or-select
visibility trap. These are observed database behaviors; replication failover,
disk-loss recovery, and arbitrary remote effects were not tested by that probe.

The final research pass also executed bounded feasibility experiments:

| Experiment | Evidence to carry into implementation |
| --- | --- |
| [Backend runtimes](backend-runtime-feasibility.md) | Driver-specific cancellation, transaction outcome, and cleanup ownership in all three languages |
| [Worker handoff](draining-feasibility.md) | Three maintenance handoffs, stale-owner rejection, committed-effect recovery, finite business retries and deadlines |
| [Cache ordering](cache-feasibility.md) | Two service processes, atomic Redis fill checks, value eviction, floor expiry, and the remaining database/cache gap |
| [Broker redelivery](messaging-feasibility.md) | Real RabbitMQ delivery after commit/ack gaps, duplicate republication, and the ack-before-commit failure control |
| [Infrastructure changes](infrastructure-feasibility.md) | Actual local Terraform partial apply, repair, stale-plan rejection, move, and retained removal |
| [Recovery](recovery-feasibility.md) | Restore success versus application identity, business invariants, interrupted restore, and acknowledged-operation loss |
| [MCP peers](mcp-feasibility.md) | Real cross-language SDK exchange, cancellation, malformed inputs, and synthetic caller/cache isolation |
| [A2A peers](a2a-feasibility.md) | Task lifecycle, duplicate effects, observer/worker ownership, semantic validation gaps and bounded mitigations |
| [Evaluation host](evaluation-host-feasibility.md) | Fresh native Codex selection and nontrigger traces, with filesystem-isolation limits |

Each report links a machine-readable record with versions, commands, observations,
and limitations. Research records preserve unsafe control cases and uncovered SDK
gaps; they do not turn those into passing application guarantees. The
[recovery/cache and canary crosscheck](recovery-caches-and-canaries.md) adds
conditional guidance for surviving consumers and complete long-running work units.

Final examples, skill trials, independent scores, installation checks, and native
workflow runs belong to the subsequent evaluation record. A research feasibility
probe is not a passed evaluation of artifacts that do not yet exist.
