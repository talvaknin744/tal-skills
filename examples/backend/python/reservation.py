"""One local PostgreSQL effect with durable, tenant-scoped replay identity."""

from __future__ import annotations

import asyncio
import math
from collections.abc import Awaitable, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool, PoolTimeout


class InvalidInput(ValueError):
    pass


class IntentConflict(Exception):
    pass


class UnavailableInventory(Exception):
    pass


class DatabaseFailure(Exception):
    pass


class UnknownOutcome(Exception):
    """COMMIT may have happened. Resolve with the original tenant/key/intent."""


@dataclass(frozen=True)
class Receipt:
    reservation_id: str
    sku: str
    quantity: int


PhaseHook = Callable[[str], Awaitable[None]]


def _identifier(value: object, label: str) -> str:
    if not isinstance(value, str) or not 1 <= len(value) <= 128:
        raise InvalidInput(f"{label} must contain 1–128 visible ASCII characters")
    if any(not 0x21 <= ord(char) <= 0x7E for char in value):
        raise InvalidInput(f"{label} must contain 1–128 visible ASCII characters")
    return value


def validate_command(command: object) -> tuple[str, int]:
    if not isinstance(command, dict) or set(command) != {"sku", "quantity"}:
        raise InvalidInput("command must have exactly sku and quantity")
    sku = _identifier(command["sku"], "sku")
    quantity = command["quantity"]
    if isinstance(quantity, bool) or not isinstance(quantity, (int, float)):
        raise InvalidInput("quantity must be a finite integral number")
    if isinstance(quantity, float) and not math.isfinite(quantity):
        raise InvalidInput("quantity must be finite")
    if not 1 <= quantity <= 1_000_000 or quantity != int(quantity):
        raise InvalidInput("quantity must be integral and between 1 and 1000000")
    return sku, int(quantity)


def _receipt(row: dict[str, Any]) -> Receipt:
    return Receipt(str(row["reservation_id"]), row["sku"], row["quantity"])


def _confirmed_commit_abort(error: BaseException) -> bool:
    # A SQLSTATE alone is not proof of rollback: 40003 and connection-fatal
    # errors such as 57P01 leave completion uncertain after COMMIT dispatch.
    return isinstance(error, psycopg.Error) and error.sqlstate in {
        "40001", "40P01", "23502", "23503", "23505", "23514", "23P01",
    }


@asynccontextmanager
async def _transaction_or_retire(conn: psycopg.AsyncConnection):
    async def retire(primary: BaseException) -> None:
        try:
            # With the pinned driver and close_returns=False, close finishes
            # libpq locally. It does not wait for a ROLLBACK acknowledgement.
            await conn.close()
        except BaseException as cleanup:
            primary.add_note(f"secondary retirement error: {type(cleanup).__name__}")
            raise primary from cleanup

    try:
        async with conn.transaction():
            try:
                yield
            except BaseException as primary:
                # Retire before transaction __aexit__ can start a new rollback
                # wait after the request's cancellation timer has already fired.
                await retire(primary)
                raise
    except BaseException as primary:
        # Also cover interrupted BEGIN/COMMIT before the pool's context exits.
        await retire(primary)
        raise


class ReservationService:
    """The caller owns this service and awaits close after all requests finish.

    `tenant` is already authenticated context, not a command field. Hooks are
    awaited test instrumentation; no business action belongs in them.
    """

    def __init__(self, database_url: str, *, max_size: int = 4,
                 application_name: str = "tal-python-backend") -> None:
        self.pool = AsyncConnectionPool(
            database_url, min_size=0, max_size=max_size, open=False,
            close_returns=False,
            timeout=5, kwargs={"autocommit": True, "row_factory": dict_row,
                               "application_name": application_name},
        )

    async def __aenter__(self) -> ReservationService:
        await self.pool.open()
        return self

    async def __aexit__(self, *exc: object) -> None:
        await self.pool.close()

    @staticmethod
    def _remaining(deadline: float) -> float:
        remaining = deadline - asyncio.get_running_loop().time()
        if remaining <= 0:
            raise TimeoutError("operation deadline expired")
        return remaining

    @staticmethod
    async def _budget(conn: psycopg.AsyncConnection, deadline: float) -> None:
        milliseconds = max(1, math.ceil(ReservationService._remaining(deadline) * 1000))
        async with conn.cursor() as cursor:
            await cursor.execute("SELECT set_config('statement_timeout', %s, true)",
                                 (str(milliseconds),))

    async def reserve(self, tenant: str, key: object, command: object, *,
                      deadline: float | None = None,
                      hook: PhaseHook | None = None) -> Receipt:
        tenant = _identifier(tenant, "trusted tenant")
        key = _identifier(key, "request key")
        sku, quantity = validate_command(command)
        deadline = deadline if deadline is not None else asyncio.get_running_loop().time() + 10
        phase = "not-dispatched"
        primary: BaseException | None = None

        async def gate(name: str) -> None:
            if hook is not None:
                await hook(name)

        try:
            async with asyncio.timeout_at(deadline):
                async with self.pool.connection(timeout=self._remaining(deadline)) as conn:
                    phase = "transaction-active"
                    async with _transaction_or_retire(conn):
                        try:
                            async with conn.cursor() as cursor:
                                await cursor.execute("SET TRANSACTION ISOLATION LEVEL READ COMMITTED")
                                await self._budget(conn, deadline)
                                try:
                                    await cursor.execute(
                                        "INSERT INTO reservations "
                                        "(tenant_id, operation_type, request_key, reservation_id, sku, quantity) "
                                        "VALUES (%s, 'reserve-v1', %s, %s, %s, %s) "
                                        "ON CONFLICT (tenant_id, operation_type, request_key) DO NOTHING "
                                        "RETURNING reservation_id, sku, quantity",
                                        (tenant, key, uuid4(), sku, quantity),
                                    )
                                except psycopg.errors.ForeignKeyViolation as exc:
                                    raise UnavailableInventory("inventory not found") from exc
                                row = await cursor.fetchone()
                                if row is not None:
                                    receipt = _receipt(row)
                                    await gate("after-insert")
                                    await self._budget(conn, deadline)
                                    await cursor.execute(
                                        "UPDATE inventory SET available = available - %s "
                                        "WHERE tenant_id = %s AND sku = %s AND available >= %s "
                                        "RETURNING available", (quantity, tenant, sku, quantity),
                                    )
                                    if await cursor.fetchone() is None:
                                        raise UnavailableInventory("insufficient inventory")
                                    await gate("after-effect")
                                else:
                                    # A separate Read Committed statement sees the winner
                                    # even if it was invisible to INSERT's snapshot.
                                    await self._budget(conn, deadline)
                                    await cursor.execute(
                                        "SELECT reservation_id, sku, quantity FROM reservations "
                                        "WHERE tenant_id = %s AND operation_type = 'reserve-v1' "
                                        "AND request_key = %s", (tenant, key),
                                    )
                                    existing = await cursor.fetchone()
                                    if existing is None:
                                        raise DatabaseFailure("retained reservation unexpectedly missing")
                                    receipt = _receipt(existing)
                                    if (receipt.sku, receipt.quantity) != (sku, quantity):
                                        raise IntentConflict("request key already names different intent")
                                await gate("before-commit")
                                await self._budget(conn, deadline)
                        except BaseException as exc:
                            primary = exc
                            raise
                        # Context exit sends COMMIT. Its interruption is conservatively
                        # unknown even if dispatch cannot be observed locally.
                        phase = "commit-dispatched"
                    phase = "commit-acknowledged"
                    await gate("after-commit")
                    return receipt
        except BaseException as exc:
            if primary is not None and exc is not primary and not isinstance(exc, TimeoutError):
                primary.add_note(f"secondary cleanup error: {type(exc).__name__}")
                exc = primary
            outcome = {"not-dispatched": "not-dispatched", "transaction-active": "no-commit-requested",
                       "commit-dispatched": "unknown", "commit-acknowledged": "committed"}[phase]
            if isinstance(exc, PoolTimeout):
                failure = TimeoutError("pool acquisition deadline expired")
                failure.operation_outcome = outcome
                failure.operation_identity = (tenant, "reserve-v1", key)
                raise failure from exc
            if isinstance(exc, (asyncio.CancelledError, TimeoutError)):
                # Keep native cancellation/deadline identity and retain business phase.
                exc.operation_outcome = outcome
                exc.operation_identity = (tenant, "reserve-v1", key)
                raise exc
            if phase == "commit-dispatched" and not _confirmed_commit_abort(exc):
                failure = UnknownOutcome("COMMIT not acknowledged; reconcile original operation identity")
                failure.operation_identity = (tenant, "reserve-v1", key)
                failure.operation_outcome = "unknown"
                raise failure from exc
            if isinstance(exc, psycopg.Error):
                raise DatabaseFailure("database operation failed") from exc
            raise exc

    async def lookup(self, tenant: str, key: object, *, deadline: float | None = None) -> Receipt | None:
        """None means NotObserved, never proof that an earlier attempt aborted."""
        tenant = _identifier(tenant, "trusted tenant")
        key = _identifier(key, "request key")
        deadline = deadline if deadline is not None else asyncio.get_running_loop().time() + 10
        async with asyncio.timeout_at(deadline):
            async with self.pool.connection(timeout=self._remaining(deadline)) as conn:
                async with _transaction_or_retire(conn):
                    await self._budget(conn, deadline)
                    async with conn.cursor() as cursor:
                        await cursor.execute(
                            "SELECT reservation_id, sku, quantity FROM reservations "
                            "WHERE tenant_id = %s AND operation_type = 'reserve-v1' AND request_key = %s",
                            (tenant, key),
                        )
                        row = await cursor.fetchone()
                        return _receipt(row) if row is not None else None
