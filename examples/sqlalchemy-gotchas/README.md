# SQLAlchemy session and query-testing gotchas

Eight controlled cases run against a new **PostgreSQL 18.6** container. The launcher uses the repository's existing image digest, a generated credential, loopback binding, and temporary database storage. It accepts no external database URL. The example owns and removes its container, closes sessions, joins child tasks, and awaits both engine disposals.

Set up the isolated environment once, then run:

```sh
python3 -m venv examples/sqlalchemy-gotchas/.venv
examples/sqlalchemy-gotchas/.venv/bin/python -m pip install -r examples/sqlalchemy-gotchas/requirements.lock
python3 examples/sqlalchemy-gotchas/verify.py
```

Pins: **CPython 3.14.3, SQLAlchemy 2.1.1, Psycopg/psycopg-binary 3.3.6, FastAPI 0.141.1**. [requirements.lock](requirements.lock) pins the complete installed application dependency set; [requirements.in](requirements.in) records the direct selections. Docker and the pinned Python runtime must already be available. The POSIX launcher does not create or change a global Python environment. `--python PATH` selects an already-prepared isolated interpreter; `--report PATH` selects fresh report output.

Expected results: **3 passing contracts, 5 observed unsafe controls, 0 failures**. An `observed-unsafe` result verifies an intentionally wrong ownership or testing assumption; it is not recommended application behavior. The unsafe query variants in the semantic case are additional controls inside that case, not extra counted cases.

| Case | Explicit boundary and observable result |
| --- | --- |
| Shared session rollback | A inserts, B observes that gate, executes a failing query and rolls back, then A's commit returns. The shared transaction has lost A's row. With independently owned sessions, A's row persists. |
| Owned ASGI fanout | An actual in-process FastAPI ASGI request runs four child session scopes. Two leases are held behind a gate; the other workers queue. All four return correct rows; peak worker leases is two and all are returned. |
| TaskGroup cancellation | A transaction holds a PostgreSQL advisory lock. The sibling fails only after `pg_stat_activity` confirms the worker's actual lock wait. Cancellation propagates, task/session cleanup is joined, and a fresh pool operation succeeds. |
| Snapshot boundary | First Repeatable Read query establishes snapshot 0. A separate writer commits value 1. Another session reads 1; the first transaction's sequential reread remains 0. |
| SQL text versus binds | Two generic compiled SQL strings match but bind different tenants. Target PostgreSQL/Psycopg dialect compilation exposes different bind values, and real results differ. |
| Whitespace collision | Removing all whitespace equates `SELECT 'a b'::text` with `SELECT 'ab'::text`; PostgreSQL returns different values. |
| Semantic result oracle | A tenant-scoped active-account query returns the declared row. Missing tenant-filter and missing composite-join predicates return foreign or duplicate rows and are rejected. Target-dialect and bind assertions supplement the result oracle. |
| Await omission | Calling an async query function creates a coroutine and executes no SQL. The control explicitly closes that unused coroutine; an awaited call produces one observed execution and the real result. |

The shared-session schedule establishes a cross-task ownership failure without assuming simultaneous wire operations, a universal driver error, or a performance improvement. Separate sessions are correct only for independent work: one task's commit can survive another task's failure. They do not provide a common transaction or snapshot. Coherent sequential reads in one explicit Repeatable Read transaction are demonstrated separately from safe fanout.

The worker pool has size two, zero overflow, and a finite acquisition timeout. A separate administrative pool of size two holds and observes controlled database boundaries; it is not included in the worker-pool count. There is no private session registry, scoped-session cleanup trick, or use of `id(current_task)`. The ASGI case executes the real framework but uses no network HTTP server, request-scoped session dependency, streaming response, or background task.

Each case has a 15-second bound; the driver also has finite connection, statement, and lock budgets. Polling checks explicit server state rather than assuming a sleep establishes order. Cleanup has an independent eight-second engine-disposal scope. The parent bounds the probe process at 150 seconds and removes the owned container even after failure or interruption. Process timeout escalates TERM to KILL for the owned process group; uncertain group observation is recorded, not called successful retirement. These fixture bounds are not latency benchmarks or guarantees about arbitrary uncooperative production cleanup.

The [run evidence](evidence/verified-run.json) records installed versions, source hashes, all case observations, zero remaining database clients after disposal, and confirmed container removal. The launcher forces Python assertions on, while checks use explicit exceptions; it rejects diagnostic errors and version drift. Asyncio debug's exact slow-callback timing notices are retained separately, without a timing-based pass/fail assertion; other stderr, including resource and never-awaited warnings, fails verification. Failed runs are retained as separate `failed-run-*.json` files. Source hashes must match before stored evidence is reused.

The two 2023 articles and their exact read scope are recorded in the [research ledger](../../research/engineering-toolkit/extensions/sqlalchemy-gotchas.json). These original examples test the identified boundaries rather than reproduce an author's database-manager implementation. Current contracts: [SQLAlchemy asyncio ownership](https://docs.sqlalchemy.org/en/21/orm/extensions/asyncio.html), [compilation FAQ](https://docs.sqlalchemy.org/en/21/faq/sqlexpressions.html), [PostgreSQL 18 isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [FastAPI 0.141.1 release](https://fastapi.tiangolo.com/release-notes/#01411-2026-07-29).

No execution-plan, throughput, authorization-system, ORM lazy-loading, external-effect, or all-interleavings guarantee follows from these checks.
