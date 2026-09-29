"""Python task cancellation must reach the real server's request signal."""

import asyncio

import httpx2
from mcp import Client

from support import PROTOCOL_VERSION, check


async def verify_cancellation(endpoint):
    checks = []
    async with Client(
        endpoint, mode=PROTOCOL_VERSION, read_timeout_seconds=3
    ) as client:
        async with httpx2.AsyncClient(timeout=3, trust_env=False) as observer:
            for committed in (False, True):
                token = "python-after-effect" if committed else "python-before-effect"
                progress = asyncio.Event()
                events = []

                async def on_progress(value, total, message):
                    events.append(
                        {"progress": value, "total": total, "message": message}
                    )
                    progress.set()

                call = asyncio.create_task(
                    client.call_tool(
                        "slow",
                        {"token": token, "commitFirst": committed},
                        progress_callback=on_progress,
                    )
                )
                try:
                    await asyncio.wait_for(progress.wait(), 2)
                    call.cancel()
                    cancelled = False
                    try:
                        await asyncio.wait_for(call, 2)
                    except asyncio.CancelledError:
                        cancelled = True
                finally:
                    if not call.done():
                        call.cancel()
                        await asyncio.gather(call, return_exceptions=True)
                deadline = asyncio.get_running_loop().time() + 2
                state = None
                while asyncio.get_running_loop().time() < deadline:
                    snapshot = (
                        await observer.get(endpoint.replace("/mcp", "/stats"))
                    ).json()
                    state = snapshot["slow"].get(token)
                    if state and state["aborted"]:
                        break
                    await asyncio.sleep(0.02)
                check(
                    checks,
                    token,
                    cancelled
                    and state
                    and state["aborted"]
                    and not state["finished"]
                    and state["committed"] == committed,
                    {
                        "client_cancelled_error": cancelled,
                        "progress_events": events,
                        "server_state": state,
                    },
                )
    return checks
