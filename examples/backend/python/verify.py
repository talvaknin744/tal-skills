"""Explicit PostgreSQL integration verifier; never auto-discovered as a unit test."""

from __future__ import annotations

import asyncio
import importlib.metadata
import json
import os
import platform
import urllib.request
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row

from reservation import (
    InvalidInput, IntentConflict, Receipt, ReservationService,
    UnavailableInventory, UnknownOutcome, validate_command,
    _confirmed_commit_abort,
)


DATABASE_URL = os.environ.get("TAL_EXAMPLE_DATABASE_URL")
RUN_ID = uuid4().hex[:12]
RESULTS: list[dict] = []
CONTRACT = json.loads((Path(__file__).resolve().parents[1] / "scenarios.json").read_text())


class Gate:
    def __init__(self, phase: str):
        self.phase = phase
        self.reached = asyncio.Event()
        self.release = asyncio.Event()

    async def __call__(self, phase: str) -> None:
        if phase == self.phase:
            self.reached.set()
            await self.release.wait()


async def capture(operation: Awaitable):
    try:
        return await operation
    except Exception as exc:
        return exc


async def expect(error_type: type[BaseException], operation: Awaitable) -> BaseException:
    try:
        await operation
    except error_type as exc:
        return exc
    raise AssertionError(f"expected {error_type.__name__}")


async def eventually(predicate: Callable[[], Awaitable[bool]], label: str) -> None:
    try:
        async with asyncio.timeout(5):
            while not await predicate():
                # Poll a database/ownership fact; elapsed time is not the success oracle.
                await asyncio.sleep(0.005)
    except TimeoutError as exc:
        raise AssertionError(f"never observed: {label}") from exc


async def execute(connection, query: str, parameters: tuple) -> None:
    async with connection.cursor() as cursor:
        await cursor.execute(query, parameters)


@asynccontextmanager
async def fixture(case: str, *, available: int = 5, max_size: int = 4,
                  tenant_count: int = 1, database_url: str | None = None):
    tenants = [f"py-{RUN_ID}-{case}-{n}" for n in range(tenant_count)]
    app_name = f"tal-py-{RUN_ID}-{case}"
    observer = await psycopg.AsyncConnection.connect(
        DATABASE_URL, autocommit=True, row_factory=dict_row,
        application_name=f"tal-observer-{RUN_ID}",
    )
    try:
        for tenant in tenants:
            await execute(observer, "INSERT INTO inventory (tenant_id, sku, available) VALUES (%s, %s, %s)",
                          (tenant, "widget", available))
        async with ReservationService(database_url or DATABASE_URL, max_size=max_size,
                                      application_name=app_name) as service:
            yield service, observer, tenants, app_name
        async def no_sessions() -> bool:
            async with observer.cursor() as cur:
                await cur.execute("SELECT count(*) AS n FROM pg_stat_activity WHERE application_name = %s",
                                  (app_name,))
                return (await cur.fetchone())["n"] == 0
        await eventually(no_sessions, "application sessions closed")
    finally:
        # Only this run's synthetic tenants; no truncation or arbitrary database reset.
        try:
            for tenant in tenants:
                await execute(observer, "DELETE FROM reservations WHERE tenant_id = %s", (tenant,))
                await execute(observer, "DELETE FROM inventory WHERE tenant_id = %s", (tenant,))
        finally:
            await observer.close()


async def state(observer, tenant: str) -> tuple[int, int]:
    async with observer.cursor() as cur:
        await cur.execute(
            "SELECT available, (SELECT count(*) FROM reservations WHERE tenant_id = %s) AS count "
            "FROM inventory WHERE tenant_id = %s AND sku = 'widget'", (tenant, tenant),
        )
        row = await cur.fetchone()
        return row["available"], row["count"]


async def lock_wait(observer, app_name: str) -> None:
    async def waiting() -> bool:
        async with observer.cursor() as cur:
            await cur.execute("SELECT count(*) AS n FROM pg_stat_activity "
                              "WHERE application_name = %s AND wait_event_type = 'Lock'", (app_name,))
            return (await cur.fetchone())["n"] > 0
    await eventually(waiting, "observed PostgreSQL lock wait")


async def sequential_duplicate() -> dict:
    async with fixture("sequential") as (service, observer, tenants, _):
        first = await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2})
        second = await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2.0})
        assert first == second
        assert await state(observer, tenants[0]) == (3, 1)
        return {"same_receipt": True, "available": 3, "reservations": 1}


async def legitimate_repeat() -> dict:
    async with fixture("repeat") as (service, observer, tenants, _):
        a = await service.reserve(tenants[0], "key-a", {"sku": "widget", "quantity": 1})
        b = await service.reserve(tenants[0], "key-b", {"sku": "widget", "quantity": 1})
        assert a.reservation_id != b.reservation_id
        assert await state(observer, tenants[0]) == (3, 2)
        return {"distinct_receipts": True, "available": 3, "reservations": 2}


async def contention(conflict: bool = False) -> dict:
    async with fixture("conflict" if conflict else "duplicate") as (service, observer, tenants, app):
        gate = Gate("after-insert")
        async with asyncio.TaskGroup() as tasks:
            a = tasks.create_task(service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2}, hook=gate))
            await gate.reached.wait()
            b = tasks.create_task(capture(service.reserve(tenants[0], "key", {
                "sku": "widget", "quantity": 3 if conflict else 2,
            })))
            await lock_wait(observer, app)
            gate.release.set()
        if conflict:
            assert isinstance(b.result(), IntentConflict)
        else:
            assert a.result() == b.result()
        assert await state(observer, tenants[0]) == (3, 1)
        return {"database_lock_wait_observed": True, "conflict": conflict, "available": 3, "reservations": 1}


async def tenant_scope() -> dict:
    async with fixture("scope", tenant_count=2) as (service, observer, tenants, _):
        a = await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        assert await service.lookup(tenants[1], "key") is None
        b = await service.reserve(tenants[1], "key", {"sku": "widget", "quantity": 2})
        assert a.reservation_id != b.reservation_id
        assert await service.lookup(tenants[0], "key") == a
        assert await service.lookup(tenants[1], "key") == b
        assert await state(observer, tenants[0]) == (4, 1)
        assert await state(observer, tenants[1]) == (3, 1)
        return {"lookup_scoped": True, "independent_receipts": True}


async def last_item() -> dict:
    async with fixture("last", available=1) as (service, observer, tenants, app):
        gate = Gate("after-effect")
        async with asyncio.TaskGroup() as tasks:
            a = tasks.create_task(service.reserve(tenants[0], "key-a", {"sku": "widget", "quantity": 1}, hook=gate))
            await gate.reached.wait()
            b = tasks.create_task(capture(service.reserve(tenants[0], "key-b", {"sku": "widget", "quantity": 1})))
            await lock_wait(observer, app)
            gate.release.set()
        assert isinstance(a.result(), Receipt)
        assert isinstance(b.result(), UnavailableInventory)
        assert await state(observer, tenants[0]) == (0, 1)
        return {"database_lock_wait_observed": True, "available": 0, "reservations": 1}


async def failure_gate(phase: str) -> dict:
    async with fixture(phase, max_size=1) as (service, observer, tenants, _):
        async def fail(selected: str) -> None:
            if selected == phase:
                raise RuntimeError("synthetic pre-commit interruption")
        await expect(RuntimeError, service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2}, hook=fail))
        assert await state(observer, tenants[0]) == (5, 0)
        await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2})
        assert await state(observer, tenants[0]) == (3, 1)
        return {"rollback_observed": True, "pool_size_one_recovered": True}


async def not_observed() -> dict:
    async with fixture("not-observed") as (service, observer, tenants, _):
        gate = Gate("after-effect")
        async with asyncio.TaskGroup() as tasks:
            a = tasks.create_task(service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1}, hook=gate))
            await gate.reached.wait()
            assert await service.lookup(tenants[0], "key") is None
            gate.release.set()
        assert await service.lookup(tenants[0], "key") == a.result()
        return {"uncommitted_lookup": "NotObserved", "later_receipt_observed": True}


async def cancellation_in_query() -> dict:
    async with fixture("cancel-query", max_size=1) as (service, observer, tenants, app):
        # Statistics observation stays outside the lock holder's transaction;
        # otherwise pg_stat_activity snapshots can remain cached between polls.
        async with await psycopg.AsyncConnection.connect(
            DATABASE_URL, autocommit=True, application_name=f"tal-locker-{RUN_ID}",
        ) as locker:
            async with locker.transaction():
                await execute(locker, "SELECT * FROM inventory WHERE tenant_id = %s FOR UPDATE", (tenants[0],))
                task = asyncio.create_task(service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1}))
                try:
                    await lock_wait(observer, app)
                    task.cancel()
                    cancellation = await expect(asyncio.CancelledError, task)
                    assert cancellation.operation_outcome == "no-commit-requested"
                finally:
                    if not task.done():
                        task.cancel()
                        await expect(asyncio.CancelledError, task)
        assert await state(observer, tenants[0]) == (5, 0)
        await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        return {"native_cancelled_error": True, "observed_sql_wait": True, "fresh_request_completed": True}


async def cancellation_in_pool() -> dict:
    async with fixture("cancel-pool", max_size=1) as (service, observer, tenants, _):
        async with service.pool.connection():
            task = asyncio.create_task(service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1}))
            try:
                async def waiting() -> bool:
                    return service.pool.get_stats().get("requests_waiting", 0) > 0
                await eventually(waiting, "pool waiter queued")
                task.cancel()
                cancellation = await expect(asyncio.CancelledError, task)
                assert cancellation.operation_outcome == "not-dispatched"
            finally:
                if not task.done():
                    task.cancel()
                    await expect(asyncio.CancelledError, task)
        assert await state(observer, tenants[0]) == (5, 0)
        await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        return {"native_cancelled_error": True, "pool_wait_observed": True, "fresh_request_completed": True}


async def cancellation_after_effect() -> dict:
    async with fixture("cancel-effect", max_size=1) as (service, observer, tenants, _):
        gate = Gate("after-effect")
        task = asyncio.create_task(service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1}, hook=gate))
        try:
            await gate.reached.wait()
            task.cancel()
            error = await expect(asyncio.CancelledError, task)
            assert error.operation_outcome == "no-commit-requested"
        finally:
            if not task.done():
                task.cancel()
                await expect(asyncio.CancelledError, task)
        assert await state(observer, tenants[0]) == (5, 0)
        await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        return {"effect_rolled_back": True, "fresh_request_completed": True}


async def response_loss() -> dict:
    async with fixture("response-loss", max_size=1) as (service, observer, tenants, _):
        gate = Gate("after-commit")
        task = asyncio.create_task(service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2}, hook=gate))
        try:
            await gate.reached.wait()
            # The sole application lease is still held. Observe through a fresh client.
            async with ReservationService(DATABASE_URL, max_size=1) as fresh:
                original = await fresh.lookup(tenants[0], "key")
            assert original is not None
            task.cancel()
            cancellation = await expect(asyncio.CancelledError, task)
            assert cancellation.operation_outcome == "committed"
        finally:
            if not task.done():
                task.cancel()
                await expect(asyncio.CancelledError, task)
        async with ReservationService(DATABASE_URL, max_size=1) as fresh:
            replay = await fresh.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2})
        assert replay == original
        assert await state(observer, tenants[0]) == (3, 1)
        return {"fault": "application-response-loss-after-confirmed-commit", "original_receipt_replayed": True}


async def validation() -> dict:
    invalid = [
        {}, {"sku": "widget"}, {"sku": "widget", "quantity": 1, "tenant": "forged"},
        {"sku": "widget", "quantity": float("nan")},
        {"sku": "widget", "quantity": float("inf")},
        {"sku": "widget", "quantity": -float("inf")}, {"sku": "bad sku", "quantity": 1},
        {"sku": "", "quantity": 1}, {"sku": "é", "quantity": 1},
        {"sku": "x" * 129, "quantity": 1}, {"sku": "widget\x7f", "quantity": 1},
        *({"sku": "widget", "quantity": quantity} for quantity in CONTRACT["invalid_quantities"]),
    ]
    async with fixture("validation") as (service, observer, tenants, _):
        for command in invalid:
            await expect(InvalidInput, service.reserve(tenants[0], "key", command))
        for key in ("", "bad key", "é", "x" * 129, 1):
            await expect(InvalidInput, service.reserve(tenants[0], key, {"sku": "widget", "quantity": 1}))
        for quantity in CONTRACT["valid_quantities"]:
            assert validate_command({"sku": "widget", "quantity": quantity}) == ("widget", int(quantity))
        assert validate_command(json.loads('{"sku":"widget","quantity":1e0}')) == ("widget", 1)
        for sku in ("!", "~" * 128):
            assert validate_command({"sku": sku, "quantity": 1}) == (sku, 1)
        assert await state(observer, tenants[0]) == (5, 0)
        return {"invalid_cases_rejected": len(invalid) + 5, "integral_float_normalized": True,
                "shared_vectors_consumed": True, "visible_ascii_endpoints_accepted": True}


async def unknown_commit() -> dict:
    proxy = os.environ.get("TAL_EXAMPLE_PROXY_URL")
    if not proxy:
        raise AssertionError("unknown-commit requires TAL_EXAMPLE_PROXY_URL from the common launcher")
    control = os.environ.get("TAL_EXAMPLE_PROXY_CONTROL_URL")

    async def counters() -> dict:
        if not control:
            return {}
        def read() -> dict:
            with urllib.request.urlopen(control, timeout=3) as response:
                return json.load(response)
        return await asyncio.to_thread(read)

    before = await counters()
    async with fixture("unknown-commit", database_url=proxy, max_size=1) as (service, observer, tenants, _):
        error = await expect(UnknownOutcome, service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2}))
        assert error.operation_identity == (tenants[0], "reserve-v1", "key")
        assert await state(observer, tenants[0]) == (3, 1)
        async with ReservationService(DATABASE_URL, max_size=1) as direct:
            original = await direct.lookup(tenants[0], "key")
            replay = await direct.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2})
        assert original is not None and replay == original
        assert await state(observer, tenants[0]) == (3, 1)
    after = await counters()
    evidence = {"unknown_reported": True, "committed_receipt_replayed": True,
                "fault": "proxy-dropped-postgresql-COMMIT-reply", "reservations": 1}
    if control:
        dropped = after["commits_dropped"] - before["commits_dropped"]
        assert dropped >= 1
        evidence["commit_replies_dropped"] = dropped
    return evidence


async def resource_recovery() -> dict:
    async with fixture("recovery", max_size=1) as (service, observer, tenants, _):
        await expect(UnavailableInventory, service.reserve(tenants[0], "too-many", {"sku": "widget", "quantity": 6}))
        await expect(UnavailableInventory, service.reserve(tenants[0], "missing", {"sku": "missing", "quantity": 1}))
        first = await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        await expect(IntentConflict, service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 2}))
        async with service.pool.connection():
            deadline = asyncio.get_running_loop().time() + 0.1
            failure = await expect(TimeoutError, service.reserve(tenants[0], "wait", {"sku": "widget", "quantity": 1}, deadline=deadline))
            assert failure.operation_outcome == "not-dispatched"
        replay = await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        assert first == replay
        assert await state(observer, tenants[0]) == (4, 1)
        stats = service.pool.get_stats()
        assert stats["pool_available"] == stats["pool_size"] == 1
        assert stats.get("requests_waiting", 0) == 0
        return {"pool_size": 1, "available_connections": 1, "waiting_requests": 0,
                "errors_recovered": ["unavailable", "missing-inventory", "intent-conflict", "pool-deadline"]}


async def cleanup_retirement() -> dict:
    async with fixture("cleanup-retire", max_size=1) as (service, observer, tenants, app):
        gate = Gate("after-effect")
        deadline = asyncio.get_running_loop().time() + 2
        task = asyncio.create_task(service.reserve(
            tenants[0], "key", {"sku": "widget", "quantity": 1}, deadline=deadline, hook=gate,
        ))
        rollback_attempts = []
        original = psycopg.AsyncConnection._exec_command

        def guard_rollback(connection, command, *args, **kwargs):
            if isinstance(command, bytes) and command.startswith(b"ROLLBACK"):
                rollback_attempts.append(command.decode())
                raise AssertionError("rollback handshake attempted after cancellation")
            return original(connection, command, *args, **kwargs)

        try:
            await gate.reached.wait()
            async with observer.cursor() as cur:
                await cur.execute("SELECT pid FROM pg_stat_activity WHERE application_name = %s", (app,))
                original_pid = (await cur.fetchone())["pid"]
            # Pin-specific instrumentation rejects the problematic handshake.
            # This is not described as a network blackhole experiment.
            with patch.object(psycopg.AsyncConnection, "_exec_command", guard_rollback):
                error = await expect(TimeoutError, task)
            assert error.operation_outcome == "no-commit-requested"
            assert rollback_attempts == []
        finally:
            if not task.done():
                task.cancel()
                await expect(asyncio.CancelledError, task)

        async def old_backend_gone() -> bool:
            async with observer.cursor() as cur:
                await cur.execute("SELECT count(*) AS n FROM pg_stat_activity WHERE pid = %s", (original_pid,))
                return (await cur.fetchone())["n"] == 0
        await eventually(old_backend_gone, "retired backend removed")
        assert await state(observer, tenants[0]) == (5, 0)
        await service.reserve(tenants[0], "key", {"sku": "widget", "quantity": 1})
        return {"deadline_expired_after_effect": True, "rollback_dispatch_attempts": 0,
                "retired_backend_removed": True, "primary_timeout_preserved": True,
                "fresh_request_completed": True,
                "instrumentation": "pinned driver rollback dispatch guard; no network-blackhole claim"}


async def commit_error_classification() -> dict:
    uncertain = [psycopg.errors.StatementCompletionUnknown(), psycopg.errors.AdminShutdown(),
                 psycopg.OperationalError(), psycopg.errors.ConnectionFailure()]
    confirmed = [psycopg.errors.SerializationFailure(), psycopg.errors.DeadlockDetected(),
                 psycopg.errors.UniqueViolation(), psycopg.errors.CheckViolation()]
    assert all(not _confirmed_commit_abort(error) for error in uncertain)
    assert all(_confirmed_commit_abort(error) for error in confirmed)
    return {"unknown_sqlstates": [error.sqlstate for error in uncertain],
            "confirmed_abort_sqlstates": [error.sqlstate for error in confirmed],
            "scope": "classification using real pinned driver exception classes, not injected server failures"}


async def run_case(case_id: str, action: Callable[[], Awaitable[dict]]) -> None:
    async with asyncio.timeout(20):
        evidence = await action()
    RESULTS.append({"id": case_id, "status": "passed", "evidence": evidence})
    print(f"PASS {case_id}", flush=True)


async def main() -> None:
    if not DATABASE_URL:
        raise SystemExit("Set TAL_EXAMPLE_DATABASE_URL using the disposable backend launcher.")
    cases = [
        ("sequential-duplicate", sequential_duplicate),
        ("legitimate-repeat", legitimate_repeat),
        ("concurrent-duplicate", contention),
        ("conflicting-intent", lambda: contention(True)),
        ("cross-tenant", tenant_scope),
        ("last-item", last_item),
        ("rollback-before-mutation", lambda: failure_gate("after-insert")),
        ("rollback-before-commit", lambda: failure_gate("before-commit")),
        ("unknown-commit", unknown_commit),
        ("not-observed-inflight", not_observed),
        ("cancellation-query", cancellation_in_query),
        ("cancellation-acquire", cancellation_in_pool),
        ("resource-recovery", resource_recovery),
        ("boundary-validation", validation),
        ("native-cancellation-after-effect", cancellation_after_effect),
        ("commit-response-loss", response_loss),
        ("cleanup-retirement", cleanup_retirement),
        ("commit-error-classification", commit_error_classification),
    ]
    required = {case["id"] for case in CONTRACT["scenarios"]}
    assert required <= {case_id for case_id, _ in cases}, "shared scenarios missing from verifier"
    report = {
        "language": "python", "runtime": platform.python_version(),
        "drivers": {name: importlib.metadata.version(name) for name in ("psycopg", "psycopg-binary", "psycopg-pool")},
        "scenarios": RESULTS,
        "limitations": ["Single authoritative PostgreSQL database and local transactional effects only.",
                        "No external-provider, replica, failover, power-loss, or disaster-recovery guarantee."],
    }
    try:
        for case_id, action in cases:
            try:
                await run_case(case_id, action)
            except BaseException as exc:
                RESULTS.append({"id": case_id, "status": "failed", "error": type(exc).__name__})
                raise
    finally:
        if output := os.environ.get("TAL_EXAMPLE_REPORT"):
            Path(output).write_text(json.dumps(report, indent=2) + "\n")


if __name__ == "__main__":
    asyncio.run(main())
