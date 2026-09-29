# Domain reading paths

Start with the failing behavior or pending decision. Read the skill's relevant
reference, then the source needed to check its assumptions. The research records
identify the edition, chapter or article actually inspected; a listed book does
not imply a complete reading or a transferable guarantee.

| Domain | Repository path | Next source and reason |
| --- | --- | --- |
| Backend ownership and transactions | Language skill → `microservice-boundaries` or `enterprise-application-patterns` when needed | *Architecture Patterns with Python*, chapters 6–7, for unit-of-work and aggregate boundaries; compare the target ORM/driver's actual contract |
| Python cancellation and lifecycle | `python-backend` | Guido van Rossum's semaphore article and current asyncio/Psycopg docs; task cancellation and resource completion are separate observations |
| SQLAlchemy sessions or query changes | `python-backend` → [sessions and query checks](../skills/languages/python-backend/references/sqlalchemy-sessions-and-queries.md) when SQLAlchemy is in scope | Current SQLAlchemy contracts and, where used, FastAPI dependency lifetimes; separate task/session ownership, transaction boundaries, SQL shape, and executed query semantics |
| TypeScript boundaries | `typescript-backend` | *Effective TypeScript* 2e selected author material and runtime schema/driver docs; static types do not validate external data |
| Go ownership and cancellation | `go-backend` | *Learning Go* 2e selected concurrency material and official context/pgx contracts; a clean race detector does not establish business invariants |
| Messaging and replay | `messaging-reliability` → `microservice-integration` for contract evolution | *Enterprise Integration Patterns* selected chapters/patterns and *Designing Event-Driven Systems* chapters 10–13; follow the actual broker's acknowledgement, retention and transaction scope |
| Stale reads and concurrent writes | `concurrency-correctness` → `microservice-data` | DDIA reviewed edition material, Meta's cache account, then the storage product's isolation and ordering guarantees |
| Long-running jobs and rollout | `graceful-draining` → `infrastructure-change-safety` | SRE rollout/recovery chapters and *Infrastructure as Code* 3e chapter 1; rehearse ownership changes and distinguish maintenance from business failure |
| Recovery and operations | `recovery-validation` → `microservice-operations` | SRE recovery material and *Release It!* source scope; validate application identities, accepted inputs, effects and derived state after restore |
| Failure-oriented tests | `failure-oriented-testing` | *Software Engineering at Google* testing chapters and the bounded *Effective Software Testing* material; use independent oracles and controlled histories |
| Cleanup without semantic drift | `code-and-docs-cleanup` → `legacy-code-changes` when characterization is needed | *Refactoring* 2e chapter 1 and Google's documentation/deprecation chapters; preserve behavior, useful rationale and independently evolving policy |
| Supported technical contract retirement | [technical-deprecation](../skills/engineering/technical-deprecation/SKILL.md) | *Software Engineering at Google* chapter 15 and the target's support policy; establish consumer transitions, replacement readiness, and removal/recovery gates |
| Agent protocols | `mcp-engineering` or `a2a-engineering` | Separately pinned normative specifications and SDK source; blogs provide use cases, not protocol authority |

Access and reading scope:

- [Language books](research/engineering-toolkit/books-languages.md).
- [Messaging, infrastructure and reliability books](research/engineering-toolkit/books-operations.md).
- [Quality and testing books](research/engineering-toolkit/books-quality.md).
- [Earlier book-derived skills and editions](book-skills.md).
- [Sixty-publisher survey and selected deep reads](research/engineering-toolkit/README.md).
- [Seventeen additional articles](research/engineering-toolkit/extensions/README.md): protected task retirement, snapshot/delete handoff, regional replay, stream ownership, recovery inputs and composed tool authority.
- [Technical-deprecation reading scope](research/engineering-toolkit/extensions/technical-deprecation.md) and [SQLAlchemy follow-up sources](research/engineering-toolkit/extensions/sqlalchemy-gotchas.md).

The survey is curated coverage, not a popularity ranking. Practices were adopted
with a trigger, failure mechanism, applicability limit, counterexample and
verification. Company scale and a successful case study do not make an approach
appropriate for every service. Complete legally accessible author/publisher text
was sought where useful; excerpts and inaccessible material remain labeled.
