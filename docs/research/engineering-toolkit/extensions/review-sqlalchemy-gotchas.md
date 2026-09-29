# Independent review: SQLAlchemy session and query probes

Reviewed 2026-09-29. **No actionable findings remain in the frozen candidate below.** The reviewer did not author or edit `examples/sqlalchemy-gotchas/`. Review covered all probe, launcher, dependency, documentation, and retained evidence files, followed by an independent database run and two launcher failure checks. No model calls or production database connections were used.

## Actual verification

From the repository root:

```sh
PYTHONOPTIMIZE=1 python3 examples/sqlalchemy-gotchas/verify.py \
  --report /tmp/tal-sqla-review-20260929-01.json
```

The fresh run exited zero: **3 passing contracts, 5 observed unsafe controls, 0 failures**. It used CPython 3.14.3, SQLAlchemy 2.1.1, Psycopg/psycopg-binary 3.3.6, FastAPI 0.141.1, and PostgreSQL 18.6. All installed distribution versions matched `requirements.lock`. The launcher forced child optimization level zero despite the optimized parent environment. Direct execution with `python -O probe.py` separately exited one at the explicit optimization guard, before database initialization.

The database image was `postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`. The reviewer run created its own loopback-bound, temporary-storage container, accepted no external DSN, and removed that container. A second, independent Docker inventory query confirmed its absence. Probe cleanup recorded 25 worker checkouts and 25 checkins, zero remaining leases, zero pending tasks, both engines disposed, and zero remaining database client backends. There were no diagnostic errors; one retained asyncio scheduler timing notice was classified separately.

| Case | Oracle reviewed and independently observed |
| --- | --- |
| Shared-session rollback | Controlled insert → sibling error/rollback → writer commit loses the shared transaction's row; an independent writer session preserves its own row. No universal concurrent-driver error is assumed. |
| ASGI fanout | A real in-process FastAPI request starts four session scopes; an explicit gate holds two worker leases, and all four workers eventually return the expected count. The separate administrative pool is disclosed. |
| Cancellation | PostgreSQL first reports the target worker waiting on a lock. A sibling then fails, cancellation propagates through joined task/session cleanup, the server lock wait disappears, and a fresh pool query succeeds. |
| Snapshot boundary | The first Repeatable Read query establishes its snapshot before the writer commits. A second transaction sees the new value while the first transaction's reread retains the old value. |
| Compiled SQL and binds | Equal generic SQL text hides different tenant bind values; target-dialect bind inspection and actual results distinguish the queries. |
| Whitespace collision | Two normalized SQL strings compare equal while PostgreSQL returns different string-literal values. |
| Semantic query oracle | Independently specified expected rows reject both missing tenant filtering and an incomplete composite join. Colliding account IDs across tenants make the join error observable. |
| Missing await | An unawaited coroutine produces zero cursor executions and is explicitly closed; the awaited call produces one observed execution and the expected result. |

These boundaries agree with the current primary contracts: [SQLAlchemy task/session ownership](https://docs.sqlalchemy.org/en/21/orm/extensions/asyncio.html#using-asyncsession-with-concurrent-tasks), [compiled expressions and bound parameters](https://docs.sqlalchemy.org/en/21/faq/sqlexpressions.html#rendering-bound-parameters-inline), and [PostgreSQL 18 snapshot establishment](https://www.postgresql.org/docs/18/transaction-iso.html#XACT-REPEATABLE-READ). Article provenance and the distinction between historical examples and current guidance are retained in the [research ledger](sqlalchemy-gotchas.json).

## Failure-path checks

The reviewer imported the unmodified launcher's `command()` into an isolated scratch test. Its process-group leader exited on TERM while a descendant ignored TERM and had closed inherited output pipes. The timeout path still sent KILL. An independent `ps` query found the descendant absent. The group's signal-zero observation returned `PermissionError` on this host; the launcher accurately recorded `group_disappearance_observed: false` and cleanup uncertainty instead of overstating that observation. Descendants that deliberately leave the owned group remain outside the stated contract.

A temporary interpreter wrapper passed the real isolated-interpreter preflight, then deliberately returned exit 73, malformed probe evidence, and a synthetic `RuntimeWarning`. The unchanged launcher failed, retained the diagnostic as an error, removed its newly created database container, and returned nonzero. Another successful Docker inventory query confirmed removal. The wrapper was deleted afterward. This checks launcher failure containment; it is not an additional SQLAlchemy case or a cancellation guarantee.

During development review, an earlier run had passed all case oracles but failed solely on an asyncio debug slow-callback timing notice. The author corrected that load-sensitive acceptance rule before freezing the candidate: only the exact scheduler-notice line format is separated, raw stderr is retained, and other warnings/errors still fail. The independent fresh run exercised this classification. Earlier failed artifacts remain preserved and are not counted as passes.

## Source and evidence binding

All five source hashes matched both the author's [stored successful report](../../../../examples/sqlalchemy-gotchas/evidence/verified-run.json) and the independent run, and still matched after review:

| Source | SHA-256 |
| --- | --- |
| `README.md` | `d054bae17e2d0b84ac403199526324d1c38d0ec2b1a818058e02eb2986dc3eb5` |
| `requirements.in` | `3512ad62d9ee968e7bb70baced384034edcbf92174aee7a130bfe6409b8cdc96` |
| `requirements.lock` | `e74b74537a100bae64642c1096c8f92cd3eb2efeba38915df9d8888554045204` |
| `probe.py` | `faa3b3fc4a473bf1eee9d1093ffb787c38d92b8e52a3bbb6080edff946b205eb` |
| `verify.py` | `eb8d54e75d247ab755e06e5891d5bca35ff996e7133b00fefb124dc92b43e078` |

Independent scratch evidence, not additional committed example artifacts:

| Artifact | SHA-256 |
| --- | --- |
| `/tmp/tal-sqla-review-20260929-01.json` | `718f2a532a636537bd7745125a0015d37657304ceff132998fb8f8455d6fbded` |
| `/tmp/tal-sqla-process-review-20260929.json` | `377e44114803c9519bbd79ee56a8559d920f4424d9425aa71d5cf80bb21ed6a2` |
| `/tmp/tal-sqla-review-negative-20260929.json` | `f6aca75ae88052bc28f27c04fe31c8a4d6a8959c056208f9a0f5dc30d115457a` |

The cases establish these controlled observations, not all possible schedules. They do not prove production throughput, request-dependency/streaming/background-task lifetimes, ORM lazy-load behavior, query plans, a complete authorization system, or remote-effect rollback. The tenant fixtures validate query predicates, not the whole security boundary. Independent sessions provide independent transactions, not one atomic transaction or a common snapshot. Successful cleanup in these runs is not a global guarantee about arbitrary drivers or uncooperative production processes.
