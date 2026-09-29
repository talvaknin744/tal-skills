"""Observe per-user default scope and an explicit tenant/principal scope."""

import asyncio
import json

from a2a.auth.user import User
from a2a.server.context import ServerCallContext
from a2a.server.tasks import InMemoryTaskStore
from a2a.types.a2a_pb2 import Task, TaskState, TaskStatus


class Principal(User):
    @property
    def is_authenticated(self):
        return True

    @property
    def user_name(self):
        return "same-principal"


async def verify():
    # These scopes have already been authorized by the fixture. Real routing input
    # must be authorized before it participates in an ownership key.
    tenant_a = ServerCallContext(user=Principal(), tenant="tenant-a")
    tenant_b = ServerCallContext(user=Principal(), tenant="tenant-b")
    task = Task(
        id="scope-test", context_id="scope-context",
        status=TaskStatus(state=TaskState.TASK_STATE_COMPLETED),
    )
    default_store = InMemoryTaskStore()
    await default_store.save(task, tenant_a)
    assert await default_store.get(task.id, tenant_b) is not None
    scoped_store = InMemoryTaskStore(
        owner_resolver=lambda context: json.dumps([context.tenant, context.user.user_name]),
    )
    await scoped_store.save(task, tenant_a)
    assert await scoped_store.get(task.id, tenant_b) is None
    assert await scoped_store.get(task.id, tenant_a) is not None
    return {
        "status": "passed",
        "default_per_user_scope": "same principal can read across fixture tenant values",
        "explicit_tenant_principal_scope": "other tenant cannot read",
        "limit": "Direct store probe; no production tenant authorization or default-policy violation claim",
    }


if __name__ == "__main__":
    print(json.dumps(asyncio.run(verify()), indent=2))
