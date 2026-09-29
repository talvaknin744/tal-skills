"""Pinned Python MCP client checks, also runnable against the local example server."""

import asyncio
import json
import sys

from mcp import Client
from support import PROTOCOL_VERSION, check


async def verify_client(endpoint):
    checks = []
    async with Client(endpoint, mode="auto", read_timeout_seconds=3) as client:
        if client.protocol_version != PROTOCOL_VERSION:
            raise RuntimeError(
                f"Required {PROTOCOL_VERSION}, got {client.protocol_version}"
            )
        tools = await client.list_tools()
        result = await client.call_tool("add", {"a": 0, "b": 7})
        check(
            checks,
            "python-to-typescript-valid",
            client.protocol_version == PROTOCOL_VERSION
            and result.structured_content == {"sum": 7}
            and not result.is_error,
            {
                "protocol": client.protocol_version,
                "tools": [tool.name for tool in tools.tools],
                "result": result.model_dump(mode="json", by_alias=True),
            },
        )
        invalid = await client.call_tool("add", {"a": "bad", "b": 1})
        check(
            checks,
            "invalid-arguments-tool-error",
            invalid.is_error,
            invalid.model_dump(mode="json", by_alias=True),
        )
        rejected = await client.call_tool("fail", {})
        check(
            checks,
            "business-rejection-tool-error",
            rejected.is_error,
            rejected.model_dump(mode="json", by_alias=True),
        )
    async with Client(
        endpoint, mode=PROTOCOL_VERSION, read_timeout_seconds=3
    ) as pinned:
        result = await pinned.call_tool("add", {"a": 4, "b": -2})
        check(
            checks,
            "explicit-protocol-pin",
            pinned.protocol_version == PROTOCOL_VERSION
            and result.structured_content == {"sum": 2},
            {"protocol": pinned.protocol_version, "result": result.structured_content},
        )
    return checks


if __name__ == "__main__":
    checks = asyncio.run(verify_client(sys.argv[1]))
    print(json.dumps(checks, indent=2))
    raise SystemExit(0 if all(item["passed"] for item in checks) else 1)
