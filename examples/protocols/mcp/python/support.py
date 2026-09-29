"""Bounded local-server ownership shared by the explicit MCP verifier."""

import asyncio
import json
import pathlib
import tempfile
from contextlib import asynccontextmanager

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROTOCOL_VERSION = "2026-07-28"


@asynccontextmanager
async def server(mode="contracts"):
    with tempfile.TemporaryFile(mode="w+") as errors:
        process = await asyncio.create_subprocess_exec(
            "node",
            str(ROOT / "server.ts"),
            mode,
            stdout=asyncio.subprocess.PIPE,
            stderr=errors,
        )
        try:
            line = await asyncio.wait_for(process.stdout.readline(), 10)
            if not line:
                errors.seek(0)
                raise RuntimeError("MCP server failed to start: " + errors.read())
            started = json.loads(line)
            yield f"http://127.0.0.1:{started['port']}/mcp"
        finally:
            if process.returncode is None:
                process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), 4)
                except asyncio.TimeoutError:
                    process.kill()
                    await process.wait()
                    raise RuntimeError("MCP server needed forced termination")
            if process.returncode != 0:
                errors.seek(0)
                raise RuntimeError(
                    f"MCP server exited {process.returncode}: {errors.read()}"
                )


def check(checks, name, passed, details):
    checks.append({"name": name, "passed": bool(passed), "details": details})


def rpc(
    method="tools/call", name="add", args=None, version=PROTOCOL_VERSION, identifier=100
):
    params = {
        "_meta": {
            "io.modelcontextprotocol/protocolVersion": version,
            "io.modelcontextprotocol/clientCapabilities": {},
        }
    }
    if name is not None:
        params.update(name=name, arguments={"a": 2, "b": 3} if args is None else args)
    return {"jsonrpc": "2.0", "id": identifier, "method": method, "params": params}


def headers(method="tools/call", name="add", version=PROTOCOL_VERSION):
    result = {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
        "mcp-protocol-version": version,
        "mcp-method": method,
    }
    if name is not None:
        result["mcp-name"] = name
    return result


def parse_response(response):
    if "text/event-stream" in response.headers.get("content-type", ""):
        events = [
            json.loads(line[5:].strip())
            for line in response.text.splitlines()
            if line.startswith("data:")
        ]
        if not events:
            raise AssertionError("SSE response contained no data event")
        return events[-1]
    return response.json()
