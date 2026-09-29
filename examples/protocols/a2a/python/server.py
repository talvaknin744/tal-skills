"""Disposable A2A peer with explicit stock and guarded request boundaries.

Fixed identities, memory-only tasks, counters, and control endpoints are test
fixtures. This module deliberately provides no production authentication or
external-effect durability implementation.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import socket
from collections import Counter
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

import uvicorn
from a2a.server.agent_execution import AgentExecutor
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.request_handlers.request_handler import validate_request_params
from a2a.server.routes import create_agent_card_routes, create_jsonrpc_routes
from a2a.server.tasks import InMemoryTaskStore, TaskUpdater
from a2a.types.a2a_pb2 import (
    AgentCapabilities,
    AgentCard,
    AgentInterface,
    AgentSkill,
    Part,
    Task,
    TaskState,
)
from a2a.utils.errors import InvalidParamsError, TaskNotFoundError, TaskNotCancelableError, UnsupportedOperationError
from starlette.applications import Starlette
from starlette.authentication import AuthenticationBackend, AuthCredentials, SimpleUser
from starlette.middleware import Middleware
from starlette.middleware.authentication import AuthenticationMiddleware
from starlette.responses import JSONResponse
from starlette.routing import Route


class FixtureIdentity(AuthenticationBackend):
    """A fixed principal map exercises propagation, not credential verification."""

    async def authenticate(self, connection):
        identities = {
            "Bearer fixture-alice": "alice",
            "Bearer fixture-bob": "bob",
        }
        principal = identities.get(connection.headers.get("authorization"))
        if principal:
            return AuthCredentials(["authenticated"]), SimpleUser(principal)


class RequireFixtureIdentity:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["path"] != "/.well-known/agent-card.json":
            if not scope["user"].is_authenticated:
                response = JSONResponse({"error": "unauthorized"}, status_code=401)
                return await response(scope, receive, send)
            if scope["path"].startswith("/_control/") and scope["user"].display_name != "alice":
                response = JSONResponse({"error": "forbidden"}, status_code=403)
                return await response(scope, receive, send)
        await self.app(scope, receive, send)


class FixtureExecutor(AgentExecutor):
    def __init__(self):
        self.gates: dict[str, asyncio.Event] = {}
        self.effects: Counter[tuple[str, str]] = Counter()
        self.receipts: dict[str, dict] = {}
        self.cleanup: Counter[str] = Counter()

    async def execute(self, context, event_queue):
        task_id = context.task_id
        principal = context.call_context.user.user_name
        command = context.get_user_input()
        updater = TaskUpdater(event_queue, task_id, context.context_id)
        current = Task()
        if context.current_task:
            current.CopyFrom(context.current_task)
        else:
            current = Task(id=task_id, context_id=context.context_id)
        # A continuation must leave INPUT_REQUIRED before publishing its next result.
        current.status.state = TaskState.TASK_STATE_WORKING
        await event_queue.enqueue_event(current)
        try:
            if command == "input":
                await updater.requires_input()
                return
            await updater.start_work()
            if command == "hold-before":
                self.gates[task_id] = asyncio.Event()
                await self.gates[task_id].wait()
            operation = command.partition(":")[2] if command.startswith("dedupe:") else task_id
            key = (principal, operation)
            # Deliberately sequential and memory-only: this is not durable deduplication.
            if not command.startswith("dedupe:") or self.effects[key] == 0:
                self.effects[key] += 1
            self.receipts[task_id] = {
                "operation": operation,
                "principal": principal,
                "effect_count": self.effects[key],
            }
            if command == "hold-after":
                self.gates[task_id] = asyncio.Event()
                await self.gates[task_id].wait()
            await self.publish_receipt(task_id, updater)
        finally:
            self.cleanup[task_id] += 1

    async def publish_receipt(self, task_id, updater):
        receipt = self.receipts[task_id]
        text = f"effect:{receipt['operation']}:{receipt['effect_count']}"
        await updater.add_artifact([Part(text=text)], artifact_id="result")
        await updater.complete()

    async def cancel(self, context, event_queue):
        updater = TaskUpdater(event_queue, context.task_id, context.context_id)
        if context.task_id in self.receipts:
            # Application-defined reconciliation after the simulated commit boundary.
            await self.publish_receipt(context.task_id, updater)
        else:
            await updater.cancel()


class GuardedHandler(DefaultRequestHandler):
    """Pre-dispatch Part/task checks, plus the fixture's text-command contract."""

    TERMINAL = {
        TaskState.TASK_STATE_COMPLETED, TaskState.TASK_STATE_FAILED,
        TaskState.TASK_STATE_CANCELED, TaskState.TASK_STATE_REJECTED,
    }

    async def authorized_task(self, task_id, context):
        task = await self.task_store.get(task_id, context)
        if task is None:
            raise TaskNotFoundError
        return task

    async def validate_boundary(self, params, context):
        if any(part.WhichOneof("content") is None for part in params.message.parts):
            raise InvalidParamsError(message="Each Part needs one content member")
        if params.message.task_id:
            task = await self.authorized_task(params.message.task_id, context)
            if params.message.context_id and params.message.context_id != task.context_id:
                raise InvalidParamsError(message="Context does not match the authorized task")
            if task.status.state in self.TERMINAL:
                raise UnsupportedOperationError(message="Terminal tasks cannot receive another message")
        # This peer implements a tiny deterministic text language, not a general agent.
        if any(part.WhichOneof("content") != "text" for part in params.message.parts):
            raise InvalidParamsError(message="This fixture accepts text parts only")
        command = "\n".join(part.text for part in params.message.parts)
        commands = {"input", "finish", "immediate", "hold-before", "hold-after"}
        if command not in commands and not (command.startswith("dedupe:") and command[7:]):
            raise InvalidParamsError(message="Unknown fixture command")

    @validate_request_params
    async def on_message_send(self, params, context):
        await self.validate_boundary(params, context)
        return await super().on_message_send(params, context)

    @validate_request_params
    async def on_message_send_stream(self, params, context):
        await self.validate_boundary(params, context)
        async for event in super().on_message_send_stream(params, context):
            yield event

    @validate_request_params
    async def on_cancel_task(self, params, context):
        task = await self.authorized_task(params.id, context)
        if task.status.state in self.TERMINAL:
            # Avoid allocating V2 queues merely to reject an already terminal task.
            raise TaskNotCancelableError
        return await super().on_cancel_task(params, context)

    @validate_request_params
    async def on_subscribe_to_task(self, params, context):
        task = await self.authorized_task(params.id, context)
        if task.status.state in self.TERMINAL:
            raise UnsupportedOperationError(message="Terminal task has no live stream; use GetTask")
        async for event in super().on_subscribe_to_task(params, context):
            yield event


def create_app(base_url: str, ready_file: Path) -> Starlette:
    executor = FixtureExecutor()
    instance_id = str(uuid4())
    card = AgentCard(
        name="tal-a2a-local-probe",
        description="Deterministic loopback-only lifecycle fixture",
        version="1.0.0",
        supported_interfaces=[AgentInterface(
            url=f"{base_url}/guarded/rpc", protocol_binding="JSONRPC", protocol_version="1.0",
        )],
        capabilities=AgentCapabilities(streaming=True),
        default_input_modes=["text/plain"],
        default_output_modes=["text/plain"],
        skills=[AgentSkill(
            id="lifecycle", name="Lifecycle fixture",
            description="Deterministic commands for protocol verification", tags=["local-test"],
        )],
    )
    stock = DefaultRequestHandler(
        agent_executor=executor, task_store=InMemoryTaskStore(), agent_card=card,
    )
    guarded = GuardedHandler(
        agent_executor=executor, task_store=InMemoryTaskStore(), agent_card=card,
    )

    async def release(request):
        task_id = request.path_params["task_id"]
        gate = executor.gates.get(task_id)
        if gate is None:
            return JSONResponse({"ready": False}, status_code=409)
        gate.set()
        return JSONResponse({"released": True})

    async def metrics(_request):
        return JSONResponse({
            "instance_id": instance_id,
            "gates": list(executor.gates),
            "receipts": executor.receipts,
            "cleanup": dict(executor.cleanup),
            "effects": {f"{user}/{operation}": count for (user, operation), count in executor.effects.items()},
        })

    @asynccontextmanager
    async def lifespan(_app):
        temporary = ready_file.with_suffix(".tmp")
        temporary.write_text(json.dumps({"base_url": base_url, "instance_id": instance_id}))
        temporary.replace(ready_file)
        try:
            yield
        finally:
            await stock.aclose()
            await guarded.aclose()

    return Starlette(
        routes=[
            *create_agent_card_routes(card),
            *create_jsonrpc_routes(stock, "/stock/rpc"),
            *create_jsonrpc_routes(guarded, "/guarded/rpc"),
            Route("/_control/release/{task_id}", release, methods=["POST"]),
            Route("/_control/metrics", metrics),
        ],
        middleware=[Middleware(AuthenticationMiddleware, backend=FixtureIdentity()), Middleware(RequireFixtureIdentity)],
        lifespan=lifespan,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ready-file", required=True, type=Path)
    args = parser.parse_args()
    # Reserve the actual listener before publishing its URL; there is no pick-port race.
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
        listener.bind(("127.0.0.1", 0))
        base_url = f"http://127.0.0.1:{listener.getsockname()[1]}"
        app = create_app(base_url, args.ready_file)
        server = uvicorn.Server(uvicorn.Config(app, log_level="warning", timeout_graceful_shutdown=5))
        server.run(sockets=[listener])


if __name__ == "__main__":
    main()
