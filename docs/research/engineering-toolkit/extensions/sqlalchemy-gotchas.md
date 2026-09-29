# SQLAlchemy gotchas: article review and Python guidance

Reviewed 2026-09-29. Both user-provided Medium articles were available in full
through normal web access; no paywall bypass was used. Main text and code examples
were read, excluding reader comments. The [structured record](sqlalchemy-gotchas.json)
lists exact sources, dates, versions, decisions, and proposed probes.

The existing `python-backend` skill already covers task ownership, independent
transactions, cancellation, and database assertions. These articles justify a
conditional [SQLAlchemy reference](../../../../skills/languages/python-backend/references/sqlalchemy-sessions-and-queries.md),
reachable from its async and transaction references. A new broad skill or agent
would duplicate existing coverage; the entry `SKILL.md` remains unchanged.

## What to keep and what to correct

[FastAPI, SQLAlchemy, and Parallel Queries Walk Into a Bar…](https://medium.com/@lironbenyeda/fastapi-sqlalchemy-and-parallel-queries-walk-into-a-bar-86dfe40aa878)
by Liron Ben Yeda, May 10, 2023, describes independent queries sharing a request
session. Keep the ownership lesson. Do not adopt its scoped-manager implementation
as the required fix: explicit task-owned sessions preserve ordinary dependency
injection without private registry enumeration. The reported timing is one
historical workload, not a promised speedup.

[Stop the SQLAlchemy Magic: A Guide to Effective Query Testing](https://medium.com/@lironbenyeda/stop-the-sqlalchemy-magic-a-guide-to-effective-query-testing-6f1a4f607bbb)
by the same author, November 25, 2023, makes generated SQL visible in review.
Keep that purpose, with independent result assertions. As printed, its test calls
an async function without awaiting it, its generic compiler omits a target
dialect, and its comparison removes all whitespace. These are limits of the
published snippets; the unseen original test suite was not inspected.

| Decision | Reason and verification boundary |
|---|---|
| Prefer a session inside each independent task | SQLAlchemy sessions are mutable transaction state. A bad shared-session schedule may serialize, raise, or mix transaction actions depending on driver and phase; do not require one universal error. |
| Preserve one sequential transaction for atomic work | Separate workers have separate rollback and visibility. Even sequential PostgreSQL Read Committed statements can see different snapshots. |
| Retain scoped sessions only with their documented lifecycle | Closing is not scope removal. Parent cleanup does not imply each child scope was removed. Numeric task IDs and private registry traversal are unnecessary defaults. |
| Treat SQL snapshots as review aids | Text equality misses wrong bind values, result semantics, later lazy loads, and execution plans. Removing literal whitespace can hide changed SQL meaning. |
| Execute only the checks needed by the query contract | Tenant isolation, outer-join missing rows, cardinality, pagination, and loading behavior need representative data and explicit expected results. |

The current [SQLAlchemy concurrency/lifecycle documentation](https://docs.sqlalchemy.org/en/21/orm/session_basics.html)
and [asyncio guidance](https://docs.sqlalchemy.org/en/21/orm/extensions/asyncio.html)
support these ownership distinctions. [PostgreSQL 18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html)
defines the snapshot limits. The explicit-session recommendation does not imply
that the article's request-local manager necessarily retains memory forever.

[SQLAlchemy compilation](https://docs.sqlalchemy.org/en/21/faq/sqlexpressions.html)
requires the relevant dialect for dialect-specific SQL and handles binds separately;
[AsyncMock](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.AsyncMock)
distinguishes calling from awaiting. Use query execution and loading observations
for correctness, then [profiling](https://docs.sqlalchemy.org/en/21/faq/performance.html)
and [EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html) for performance.
`EXPLAIN ANALYZE` executes the statement, so a plan probe must use authorized data.

FastAPI [dependency scopes](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/#early-exit-and-scope)
and [background-resource guidance](https://fastapi.tiangolo.com/advanced/advanced-dependencies/#background-tasks-and-dependencies-with-yield-technical-details)
must match the installed version and actual response lifetime. A streaming or
background consumer cannot simply inherit an arbitrary request session lifetime.

## Versions and bounded verification proposals

Official pages displayed SQLAlchemy **2.1.1** (September 25, 2026), with **2.0.54**
the maintenance series. FastAPI [release notes](https://fastapi.tiangolo.com/release-notes/#01411-2026-07-29)
displayed **0.141.1** (July 29, 2026). These are documentation observations, not
automatic upgrade instructions. The inspected system interpreter was Python
**3.14.3**, without SQLAlchemy, FastAPI, pytest, asyncpg, aiosqlite, or Psycopg
installed. Existing backend requirement files pin Psycopg **3.3.6** and
psycopg-pool **3.3.3**; other environments were not treated as that interpreter.

Proposed probes were handed to the example owner, but none was executed by this
research/reference update:

1. Shared-session sibling rollback versus task-owned independent sessions; record
   committed rows through another connection and keep the atomicity distinction.
2. Bounded pool acquisition and cancellation with controlled gates, awaited
   cleanup, and a fresh operation proving usable capacity afterward.
3. Two independently established Repeatable Read snapshots versus sequential
   reads in one transaction; measure the intended visibility, not task timing.
4. Wrong binds with unchanged compiled SQL, changed literal whitespace, missing
   tenant predicates, and outer-join cardinality. Pair compiler observations with
   actual database results, and show that an unawaited call performs no query.

Use generated data and the actual selected driver/database. A local compiler,
mock, SQLite result, or single database probe must retain its own scope; none
establishes production throughput, all cancellation schedules, or framework
streaming behavior unless those boundaries are separately exercised.
