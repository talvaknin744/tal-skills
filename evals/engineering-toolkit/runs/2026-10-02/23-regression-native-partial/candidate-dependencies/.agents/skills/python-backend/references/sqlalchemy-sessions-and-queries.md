# SQLAlchemy sessions and query checks

Read only for SQLAlchemy ownership, FastAPI database lifetimes, or query changes.
Check the installed SQLAlchemy, driver, FastAPI, Python, and database versions.
The source review used SQLAlchemy 2.1 documentation; do not silently upgrade a
project or copy framework-era examples.

## Session and task boundaries

An `AsyncSession` contains mutable transaction state. Concurrent tasks must not
share it: sharing can interfere with transaction outcomes or produce driver/state
errors, not merely serialize queries. Keep the application-owned engine/factory;
create a context-managed session inside each independent worker task. Sequential
helpers can receive that task's session explicitly. A request-scoped dependency
is still suitable for a sequential unit of work; dependency injection is not the
bug. [SQLAlchemy concurrency contract](https://docs.sqlalchemy.org/en/21/orm/session_basics.html#is-the-session-thread-safe-is-asyncsession-safe-to-share-in-concurrent-tasks)

Choose the transaction before introducing parallelism. `async with factory()`
closes a session; `async with factory.begin()` also owns a committing transaction.
Sibling sessions do not share rollback, uncommitted writes, or necessarily one
snapshot. For one atomic unit, keep one session/transaction and sequential SQL.
For one coherent read, select the required isolation or combine the query:
PostgreSQL Read Committed can change snapshots between statements, and separately
started Repeatable Read transactions need not match. Bound fan-out against pool
and database capacity, including concurrent requests. Measure useful throughput
and pool wait; more tasks are not evidence of speedup.
[Session contexts](https://docs.sqlalchemy.org/en/21/orm/extensions/asyncio.html#sqlalchemy.ext.asyncio.async_sessionmaker.begin),
[PostgreSQL isolation](https://www.postgresql.org/docs/18/transaction-iso.html)

Prefer explicit sessions to introducing `async_scoped_session`. If an existing
task-scoped registry remains, follow its documented lifecycle: with `current_task`
scope, await `remove()` in the owning task's outermost cleanup. Closing a session
does not remove its registry entry, and parent-task removal does not clear every
child scope. Avoid copying private registry enumeration or numeric task-ID keys.
This is not a claim that every request-local registry necessarily leaks forever.
[Scoped-session guidance](https://docs.sqlalchemy.org/en/21/orm/extensions/asyncio.html#using-asyncio-scoped-session)

For FastAPI, align dependency teardown with its actual consumer. Current request
scope ends after response sending; function scope ends before sending. Streaming
must retain needed resources through iteration. Background work creates its own
session and receives identifiers/data rather than a request session or dependent
ORM objects. Await child completion and cleanup before closing their owner.
[Dependency scopes](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/#early-exit-and-scope),
[background resources](https://fastapi.tiangolo.com/advanced/advanced-dependencies/#background-tasks-and-dependencies-with-yield-technical-details)

**Verify:** gate two tasks at the affected transaction boundary; demonstrate the
bad shared-state history and the intended independent or atomic behavior. Cancel
during acquisition/work, await cleanup, then complete a fresh operation through
the same bounded pool. Record actual sessions/connections and effects; task count
or elapsed time alone does not prove concurrent execution or leak freedom.

## Query checks with an observable oracle

Use generated SQL to expose an important join, filter, ordering, loading, or
dialect decision. A reviewed SQL snapshot is supplemental evidence; do not add a
snapshot for every query or blindly approve a changed snapshot as correct.

- Compile with the target engine/dialect and inspect bound parameters separately,
  including values supplied at execution. Identical SQL text can select another
  tenant with different binds. Keep execution parameterized; literal rendering is
  a limited debugging aid, not a way to execute untrusted SQL.
- Preserve SQL meaning when formatting. Removing all whitespace can equate
  distinct literals such as `'a b'` and `'ab'`. Prefer exact reviewed output or a
  SQL-aware formatter; compiler aliases and rendering can legitimately change
  across versions. [Compilation and binds](https://docs.sqlalchemy.org/en/21/faq/sqlexpressions.html)
- Await the query function in an async test. With `AsyncMock`, assert the awaited
  interaction where relevant; being called is different from being awaited.
  Mocks validate wiring, not database semantics.
  [Await assertions](https://docs.python.org/3/library/unittest.mock.html#unittest.mock.AsyncMock)
- Execute meaningful cases on the target engine: tenant separation, null/empty
  results, outer-join missing rows, duplicate child rows, and deterministic
  pagination as applicable. Assert independently specified results. Include the
  faulty filter/join/bind variant as a negative control when it explains the bug.
- For ORM loading regressions, exercise the result consumption path and count
  emitted queries; compiling one statement cannot reveal later N+1 loads.
  [Loading behavior](https://docs.sqlalchemy.org/en/21/orm/queryguide/relationships.html#preventing-unwanted-lazy-loads-using-raiseload)

For a performance claim, examine a representative plan and workload separately
from SQL-string equality. `EXPLAIN ANALYZE` executes the statement, including side
effects; use authorized disposable data. Small fixtures do not establish
production latency. **Done:** report which assertions cover SQL shape/binds,
executed result semantics, loading, and performance, with untested layers explicit.
[SQLAlchemy profiling](https://docs.sqlalchemy.org/en/21/faq/performance.html),
[PostgreSQL EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html)
