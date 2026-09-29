"""Malformed envelopes and real SSE disconnects, separate from SDK conformance."""

import asyncio
import json

import httpx2

from client import verify_client
from support import check, headers, parse_response, rpc


async def verify_contracts(endpoint):
    checks = await verify_client(endpoint)
    async with httpx2.AsyncClient(timeout=3, trust_env=False) as raw:
        fixtures = [
            (
                "wrong-version",
                rpc(version="2099-01-01"),
                headers(version="2099-01-01"),
                400,
                -32022,
            ),
            (
                "header-body-version-mismatch",
                rpc(),
                headers(version="2025-11-25"),
                400,
                -32020,
            ),
            (
                "header-body-method-mismatch",
                rpc(),
                headers(method="tools/list"),
                400,
                -32020,
            ),
            ("header-body-name-mismatch", rpc(), headers(name="fail"), 400, -32020),
            ("unknown-tool", rpc(name="missing"), headers(name="missing"), 200, -32602),
        ]
        missing = rpc()
        missing["params"].pop("_meta")
        fixtures.append(("missing-required-meta", missing, headers(), 400, -32602))
        for name, body, request_headers, expected_status, expected_code in fixtures:
            response = await raw.post(endpoint, headers=request_headers, json=body)
            value = parse_response(response)
            check(
                checks,
                name,
                response.status_code == expected_status
                and value.get("error", {}).get("code") == expected_code,
                {"http_status": response.status_code, "response": value},
            )
        for committed in (False, True):
            token = "after-effect" if committed else "before-effect"
            body = rpc(
                name="slow",
                args={"token": token, "commitFirst": committed},
                identifier=200 + int(committed),
            )
            body["params"]["_meta"]["progressToken"] = token
            async with raw.stream(
                "POST", endpoint, headers=headers(name="slow"), json=body
            ) as response:
                first = None
                async for line in response.aiter_lines():
                    if line.startswith("data:"):

                        first = json.loads(line[5:].strip())
                        break
            deadline = asyncio.get_running_loop().time() + 2
            state = None
            while asyncio.get_running_loop().time() < deadline:
                snapshot = (await raw.get(endpoint.replace("/mcp", "/stats"))).json()
                state = snapshot["slow"].get(token)
                if state and state["aborted"]:
                    break
                await asyncio.sleep(0.02)
            check(
                checks,
                "http-disconnect-" + token,
                state
                and state["aborted"]
                and not state["finished"]
                and state["committed"] == committed,
                {"first_event": first, "server_state": state},
            )
        snapshot = (await raw.get(endpoint.replace("/mcp", "/stats"))).json()
        check(
            checks,
            "invalid-envelope-no-add-effect",
            snapshot["addInvocations"] == 2,
            {"addInvocations": snapshot["addInvocations"]},
        )
        modern = [
            request
            for request in snapshot["requests"]
            if request.get("version") == "2026-07-28"
        ]
        check(
            checks,
            "modern-wire-has-no-initialize-or-session",
            all(
                request.get("mcpMethod") != "initialize"
                and not request["hasSessionHeader"]
                for request in modern
            ),
            {"requests": snapshot["requests"]},
        )
    return checks
