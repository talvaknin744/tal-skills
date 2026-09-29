"""Real PostgreSQL ownership and query-oracle observations, not benchmarks."""

import asyncio
from importlib.metadata import version
import inspect
import json
import os
import platform
from pathlib import Path
import sys

from fastapi import FastAPI
from sqlalchemy import (
    Boolean, Column, ForeignKeyConstraint, Integer, MetaData, String, Table,
    and_, bindparam, event, func, insert, select, text, update,
)
from sqlalchemy.exc import DBAPIError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine


def require(condition, message):
    # Verification must still reject bad observations if Python uses -O.
    if not condition:
        raise AssertionError(message)


metadata = MetaData()
accounts = Table(
    "accounts", metadata,
    Column("tenant", String, primary_key=True), Column("id", Integer, primary_key=True),
    Column("label", String, nullable=False), Column("active", Boolean, nullable=False),
)
orders = Table(
    "orders", metadata,
    Column("tenant", String, primary_key=True), Column("id", Integer, primary_key=True),
    Column("account_id", Integer, nullable=False), Column("amount", Integer, nullable=False),
    ForeignKeyConstraint(["tenant", "account_id"], ["accounts.tenant", "accounts.id"]),
)
effects = Table("effects", metadata, Column("id", Integer, primary_key=True))
counter = Table("counter", metadata, Column("id", Integer, primary_key=True), Column("value", Integer))


class PoolObservation:
    def __init__(self, engine):
        self.active = self.peak = self.checkouts = self.checkins = 0
        event.listen(engine.sync_engine, "checkout", self.checkout)
        event.listen(engine.sync_engine, "checkin", self.checkin)

    def checkout(self, _connection, _record, _proxy):
        self.active += 1
        self.checkouts += 1
        self.peak = max(self.peak, self.active)

    def checkin(self, _connection, _record):
        self.active -= 1
        self.checkins += 1


async def seed(admin):
    async with admin.begin() as connection:
        await connection.run_sync(metadata.create_all)
        await connection.execute(insert(accounts), [
            {"tenant": "alpha", "id": 1, "label": "A B", "active": True},
            {"tenant": "alpha", "id": 2, "label": "AB", "active": False},
            {"tenant": "beta", "id": 1, "label": "Foreign", "active": True},
        ])
        await connection.execute(insert(orders), [
            {"tenant": "alpha", "id": 101, "account_id": 1, "amount": 10},
            {"tenant": "alpha", "id": 102, "account_id": 2, "amount": 20},
            {"tenant": "beta", "id": 201, "account_id": 1, "amount": 900},
        ])
        await connection.execute(insert(counter), {"id": 1, "value": 0})


async def effect_count(factory, effect_id):
    async with factory() as session:
        return await session.scalar(select(func.count()).select_from(effects).where(effects.c.id == effect_id))


async def rollback_interference(factory):
    async def run(shared, effect_id):
        inserted, rolled_back = asyncio.Event(), asyncio.Event()
        observations = {}

        async def writer(session):
            await session.execute(insert(effects), {"id": effect_id})
            inserted.set()
            await rolled_back.wait()
            await session.commit()
            observations["writer_commit_returned"] = True

        async def failing_reader(session):
            await inserted.wait()
            try:
                await session.execute(text("SELECT 1 / 0"))
            except DBAPIError as error:
                require(getattr(error.orig, "sqlstate", None) == "22012", "Expected division by zero")
                await session.rollback()
                observations["reader_rolled_back"] = True
            else:
                raise AssertionError("Control query unexpectedly succeeded")
            rolled_back.set()

        if shared:
            async with factory() as session:
                async with asyncio.TaskGroup() as group:
                    group.create_task(writer(session))
                    group.create_task(failing_reader(session))
        else:
            async def owned(fn):
                async with factory() as session:
                    await fn(session)
            async with asyncio.TaskGroup() as group:
                group.create_task(owned(writer))
                group.create_task(owned(failing_reader))
        observations["persisted_effects"] = await effect_count(factory, effect_id)
        return observations

    unsafe = await run(True, 9001)
    independent = await run(False, 9002)
    require(unsafe["writer_commit_returned"] and unsafe["persisted_effects"] == 0, "Missing shared rollback interference")
    require(independent["persisted_effects"] == 1, "Separate writer lost its independent transaction")
    return {"shared_session": unsafe, "task_owned_sessions": independent,
            "limit": "Separate sessions preserve independent transactions, not one atomic unit of work."}


async def asgi_fanout(factory, pool):
    pool.peak = 0
    started = 0
    admitted = 0
    all_started, first_two, release = asyncio.Event(), asyncio.Event(), asyncio.Event()
    pids = set()
    scopes = []
    app = FastAPI()

    async def reader(number):
        nonlocal started, admitted
        started += 1
        if started == 4:
            all_started.set()
        async with factory.begin() as session:
            scopes.append(number)
            pid = await session.scalar(text("SELECT pg_backend_pid()"))
            pids.add(pid)
            count = await session.scalar(select(func.count()).select_from(orders).where(orders.c.tenant == "alpha"))
            admitted += 1
            if admitted == 2:
                first_two.set()
            await release.wait()
            return {"worker": number, "count": count}

    @app.get("/fanout")
    async def endpoint():
        async with asyncio.TaskGroup() as group:
            tasks = [group.create_task(reader(number)) for number in range(4)]
        return [task.result() for task in tasks]

    observations = {}

    async def controller():
        await all_started.wait()
        await first_two.wait()
        require(pool.active == 2 and admitted == 2, "Pool admission exceeded two held leases")
        observations["held_leases_at_gate"] = pool.active
        release.set()

    messages = []
    request_delivered = False

    async def receive():
        nonlocal request_delivered
        if not request_delivered:
            request_delivered = True
            return {"type": "http.request", "body": b"", "more_body": False}
        await asyncio.Event().wait()  # No disconnect in this finite local request.

    async def send(message):
        messages.append(message)

    scope = {"type": "http", "asgi": {"version": "3.0", "spec_version": "2.3"},
             "http_version": "1.1", "method": "GET", "scheme": "http", "path": "/fanout",
             "raw_path": b"/fanout", "root_path": "", "query_string": b"", "headers": [],
             "server": ("local.fixture", 80), "client": ("127.0.0.1", 1)}
    try:
        async with app.router.lifespan_context(app):
            async with asyncio.TaskGroup() as group:
                group.create_task(controller())
                group.create_task(app(scope, receive, send))
    finally:
        release.set()
    status = next(message["status"] for message in messages if message["type"] == "http.response.start")
    body = b"".join(message.get("body", b"") for message in messages if message["type"] == "http.response.body")
    result = json.loads(body)
    require(status == 200 and result == [{"worker": n, "count": 2} for n in range(4)], "Incorrect ASGI fanout response")
    require(len(scopes) == 4 and len(pids) == 2 and pool.peak == 2 and pool.active == 0, "Session/pool ownership mismatch")
    return observations | {"asgi_executed": True, "http_status": status, "response": result,
                           "task_owned_session_scopes": len(scopes), "worker_backend_count": len(pids),
                           "worker_pool_peak": pool.peak, "returned_leases": pool.active == 0}


class PlannedSiblingFailure(Exception):
    pass


async def cancel_lock_wait(factory, admin, pool):
    pid_ready = asyncio.Event()
    evidence = {"cancellation_propagated": False, "server_lock_wait_observed": False}
    waiting_pid = None

    async def waiter():
        nonlocal waiting_pid
        try:
            async with factory.begin() as session:
                waiting_pid = await session.scalar(text("SELECT pg_backend_pid()"))
                pid_ready.set()
                await session.execute(text("SELECT pg_advisory_xact_lock(712345)"))
        except asyncio.CancelledError:
            evidence["cancellation_propagated"] = True
            raise

    async def sibling():
        await pid_ready.wait()
        while True:
            # A fresh short transaction avoids cached statistics snapshots.
            async with admin.connect() as connection:
                blocked = await connection.scalar(text(
                    "SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE pid=:pid AND wait_event_type='Lock')"
                ), {"pid": waiting_pid})
            if blocked:
                evidence["server_lock_wait_observed"] = True
                raise PlannedSiblingFailure("Fail only after the other task is actually blocked")
            await asyncio.sleep(0.01)  # Poll an explicit server state; not an ordering assumption.

    async with admin.begin() as blocker:
        await blocker.execute(text("SELECT pg_advisory_xact_lock(712345)"))
        caught = 0
        try:
            async with asyncio.TaskGroup() as group:
                waiting_task = group.create_task(waiter())
                group.create_task(sibling())
        except* PlannedSiblingFailure as failures:
            caught = len(failures.exceptions)
        require(caught == 1 and waiting_task.cancelled(), "Expected sibling cancellation was not joined")
        require(evidence["server_lock_wait_observed"] and evidence["cancellation_propagated"], "Missing actual cancellation boundary")
        require(pool.active == 0, "Canceled session retained a worker lease")
        async with admin.connect() as connection:
            remaining = await connection.scalar(text(
                "SELECT count(*) FROM pg_stat_activity WHERE pid=:pid AND wait_event_type='Lock'"
            ), {"pid": waiting_pid})
        require(remaining == 0, "Canceled backend still waits on the lock")
    async with factory() as session:
        require(await session.scalar(text("SELECT 1")) == 1, "Pool did not recover")
    return evidence | {"worker_joined": True, "remaining_server_lock_waits": remaining, "fresh_query_succeeded": True}


async def snapshot_boundaries(worker, admin):
    factory = async_sessionmaker(worker.execution_options(isolation_level="REPEATABLE READ"), expire_on_commit=False)
    value_query = select(counter.c.value).where(counter.c.id == 1)
    async with factory.begin() as first:
        before = await first.scalar(value_query)  # This first query establishes its snapshot.
        async with admin.begin() as writer:
            await writer.execute(update(counter).where(counter.c.id == 1).values(value=1))
        # The writer's context has committed before the second reader starts.
        async with factory.begin() as second:
            independent = await second.scalar(value_query)
        same_transaction = await first.scalar(value_query)
    require([before, independent, same_transaction] == [0, 1, 0], "Snapshot schedule did not produce expected observations")
    return {"first_snapshot_before_writer_commit": before, "independent_snapshot_after_writer_commit": independent,
            "same_transaction_sequential_reread": same_transaction, "isolation": "REPEATABLE READ",
            "limit": "Task-owned parallel transactions do not establish a common snapshot."}


async def binds_not_sql_text(factory, worker):
    alpha = select(orders.c.id).where(orders.c.tenant == "alpha").order_by(orders.c.id)
    beta = select(orders.c.id).where(orders.c.tenant == "beta").order_by(orders.c.id)
    generic_equal = str(alpha.compile()) == str(beta.compile())
    compiled_alpha = alpha.compile(dialect=worker.sync_engine.dialect)
    compiled_beta = beta.compile(dialect=worker.sync_engine.dialect)
    require(generic_equal and compiled_alpha.params != compiled_beta.params, "Expected identical SQL with different bound intent")
    require(list(compiled_alpha.params.values()) == ["alpha"] and list(compiled_beta.params.values()) == ["beta"], "Incorrect bind assertion")
    async with factory() as session:
        alpha_rows = list((await session.scalars(alpha)).all())
        beta_rows = list((await session.scalars(beta)).all())
    require(alpha_rows == [101, 102] and beta_rows == [201], "Actual results did not distinguish binds")
    return {"generic_sql_equal": generic_equal, "target_dialect": worker.dialect.name,
            "target_driver": worker.dialect.driver, "alpha_binds": compiled_alpha.params,
            "beta_binds": compiled_beta.params, "alpha_rows": alpha_rows, "beta_rows": beta_rows}


async def whitespace_collision(factory):
    with_space = text("SELECT 'a b'::text")
    without_space = text("SELECT 'ab'::text")
    normalize = lambda statement: "".join(str(statement.compile()).split())
    require(normalize(with_space) == normalize(without_space), "Expected whitespace normalization collision")
    async with factory() as session:
        first = await session.scalar(with_space)
        second = await session.scalar(without_space)
    require(first == "a b" and second == "ab" and first != second, "Expected different PostgreSQL literal values")
    return {"normalized_sql_equal": True, "database_values": [first, second], "semantic_equal": False}


def business_query(*, omit_tenant=False, omit_join_tenant=False):
    join = orders.c.account_id == accounts.c.id
    if not omit_join_tenant:
        join = and_(join, orders.c.tenant == accounts.c.tenant)
    query = select(orders.c.id, accounts.c.label).select_from(orders.join(accounts, join)).where(accounts.c.active.is_(True))
    if not omit_tenant:
        query = query.where(orders.c.tenant == bindparam("tenant", type_=String))
    return query.order_by(orders.c.id, accounts.c.label)


async def semantic_query_oracle(factory, worker):
    good = business_query()
    compiled = good.params(tenant="alpha").compile(dialect=worker.sync_engine.dialect)
    require(compiled.params == {"tenant": "alpha"}, "Expected explicit typed tenant bind")
    variants = {"correct": good, "missing_tenant_filter": business_query(omit_tenant=True),
                "missing_tenant_join": business_query(omit_join_tenant=True)}
    results = {}
    async with factory() as session:
        for name, query in variants.items():
            rows = (await session.execute(query, {"tenant": "alpha"})).all()
            results[name] = [list(row) for row in rows]
    expected = [[101, "A B"]]
    require(results["correct"] == expected, "Correct query violates the business result oracle")
    require(results["missing_tenant_filter"] == [[101, "A B"], [201, "Foreign"]], "Missing-filter control was not detected")
    require(results["missing_tenant_join"] == [[101, "A B"], [101, "Foreign"]], "Missing-join control was not detected")
    return {"expected_business_rows": expected, "observed_rows": results,
            "unsafe_variants_rejected": ["missing_tenant_filter", "missing_tenant_join"],
            "limit": "Dialect/bind checks supplement the business oracle; SQL snapshots alone prove neither results nor plans."}


async def await_omission(factory, worker):
    executions = 0

    def observe(_conn, _cursor, statement, _parameters, _context, _executemany):
        nonlocal executions
        if "await_oracle" in statement:
            executions += 1

    async def count_orders(session):
        return await session.scalar(text("SELECT count(*) FROM orders WHERE tenant=:tenant /* await_oracle */"), {"tenant": "alpha"})

    event.listen(worker.sync_engine, "before_cursor_execute", observe)
    try:
        async with factory() as session:
            forgotten = count_orders(session)
            require(inspect.iscoroutine(forgotten) and executions == 0, "Unawaited async body unexpectedly executed")
            forgotten.close()  # Repair the deliberate control; suppressing a warning is not the oracle.
            actual = await count_orders(session)
            require(actual == 2 and executions == 1, "Awaited query did not produce its actual result")
        return {"unawaited_call_executions": 0, "unused_coroutine_explicitly_closed": True,
                "awaited_call_executions": executions, "awaited_result": actual}
    finally:
        event.remove(worker.sync_engine, "before_cursor_execute", observe)


async def main():
    require(sys.flags.optimize == 0, "Run probe with assertions enabled")
    require(os.environ.get("TAL_SQLA_FIXTURE") == "disposable-postgres", "Use the disposable launcher")
    dsn = os.environ["TAL_SQLA_FIXTURE_URL"]
    options = {"connect_timeout": 5, "options": "-c statement_timeout=8000 -c lock_timeout=6000 -c idle_in_transaction_session_timeout=20000"}
    worker = create_async_engine(dsn, pool_size=2, max_overflow=0, pool_timeout=4,
                                 connect_args=options | {"application_name": "tal_sqla_worker"})
    admin = create_async_engine(dsn, pool_size=2, max_overflow=0, pool_timeout=4,
                                connect_args=options | {"application_name": "tal_sqla_admin"})
    pool = PoolObservation(worker)
    factory = async_sessionmaker(worker, expire_on_commit=False)
    report = {"runtime": platform.python_version(), "optimization_level": sys.flags.optimize,
              "distributions": {line.split("==")[0]: version(line.split("==")[0])
                                for line in (Path(__file__).parent / "requirements.lock").read_text().splitlines() if "==" in line},
              "scenarios": [], "cleanup": {},
              "limitations": ["Local PostgreSQL and in-process ASGI only; no network HTTP, throughput, or general scheduling claim.",
                              "Independent task transactions are not one atomic unit or one common snapshot.",
                              "No private session registry, ORM lazy-load coverage, execution-plan proof, or external effects."]}
    try:
        async with admin.connect() as connection:
            report["server_version"] = await connection.scalar(text("SHOW server_version"))
        await seed(admin)
        cases = [
            ("shared-session-cross-task-rollback", "observed-unsafe", lambda: rollback_interference(factory)),
            ("task-owned-asgi-fanout-pool-budget", "pass", lambda: asgi_fanout(factory, pool)),
            ("taskgroup-cancel-real-lock-wait", "pass", lambda: cancel_lock_wait(factory, admin, pool)),
            ("independent-sessions-not-common-snapshot", "observed-unsafe", lambda: snapshot_boundaries(worker, admin)),
            ("generic-sql-hides-bound-intent", "observed-unsafe", lambda: binds_not_sql_text(factory, worker)),
            ("whitespace-normalizer-changes-literals", "observed-unsafe", lambda: whitespace_collision(factory)),
            ("semantic-oracle-rejects-filter-and-join", "pass", lambda: semantic_query_oracle(factory, worker)),
            ("unawaited-query-does-not-execute", "observed-unsafe", lambda: await_omission(factory, worker)),
        ]
        for case_id, expected_status, run in cases:
            try:
                async with asyncio.timeout(15):
                    evidence = await run()
                require(pool.active == 0, "A case retained a worker lease")
                async with factory() as session:
                    require(await session.scalar(text("SELECT 1")) == 1, "Fresh operation failed after case")
                require(pool.active == 0, "Recovery operation retained a lease")
                evidence["worker_leases_after_cleanup"] = pool.active
                evidence["fresh_operation_after_case"] = True
                report["scenarios"].append({"id": case_id, "status": expected_status, "evidence": evidence})
            except Exception as error:
                report["scenarios"].append({"id": case_id, "status": "fail", "evidence": {"error": repr(error)}})
                break
    finally:
        async with asyncio.timeout(8):
            await worker.dispose()
            await admin.dispose()
        report["cleanup"] = {"engines_disposed": True, "worker_leases": pool.active,
                             "worker_checkouts": pool.checkouts, "worker_checkins": pool.checkins}
    pending = [task for task in asyncio.all_tasks() if task is not asyncio.current_task()]
    require(not pending, f"Unjoined tasks remain: {pending!r}")
    report["cleanup"]["pending_tasks"] = 0
    print(json.dumps(report))
    return int(len(report["scenarios"]) != 8 or any(case["status"] == "fail" for case in report["scenarios"]))


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
