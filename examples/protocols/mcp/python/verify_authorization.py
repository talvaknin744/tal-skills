"""Synthetic credential routing, handle ownership and private-cache boundaries."""

import httpx2
import json

from support import check


async def verify_authorization(endpoint):
    checks = []
    base = endpoint.removesuffix("/mcp")

    def record(name, passed, details):
        check(checks, name, passed, details)

    async with httpx2.AsyncClient(timeout=3, trust_env=False) as http:

        async def stats():
            return (await http.get(base + "/stats")).json()

        async def call(
            token, handle="opaque_h_7c2eb8", claimed=None, header=None, resource=False
        ):
            method = "resources/read" if resource else "tools/call"
            meta = {
                "io.modelcontextprotocol/protocolVersion": "2026-07-28",
                "io.modelcontextprotocol/clientCapabilities": {},
            }
            params = {"_meta": meta}
            if resource:
                params["uri"] = "private://self"
            else:
                params.update(name="touch-handle", arguments={"handle": handle})
            if claimed:
                params["arguments"]["claimedPrincipal"] = claimed
                meta["authInfo"] = {
                    "clientId": "same-fixture-oauth-client",
                    "extra": {"principalId": claimed},
                }
            headers = {
                "content-type": "application/json",
                "accept": "application/json, text/event-stream",
                "mcp-protocol-version": "2026-07-28",
                "mcp-method": method,
            }
            headers["mcp-name"] = "private://self" if resource else "touch-handle"
            if token:
                headers["authorization"] = "Bearer " + token
            if header:
                headers["x-principal"] = header
            response = await http.post(
                base + "/mcp",
                headers=headers,
                json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
            )
            return {"status": response.status_code, "body": response.json()}

        for token, label in [(None, "missing"), ("unknown-fixture-token", "unknown")]:
            before = await stats()
            res = await call(token, claimed="alice", header="alice")
            after = await stats()
            record(
                "synthetic-" + label + "-credential-rejected-before-factory",
                res["status"] == 401
                and after["factoryCalls"] == before["factoryCalls"]
                and after["effects"] == before["effects"],
                res,
            )
        res = await call("fixture-alice-token")
        record(
            "handle-owner-allowed",
            res["body"].get("result", {}).get("structuredContent")
            == {"principal": "alice", "effects": 1},
            res,
        )
        before = await stats()
        res = await call("fixture-bob-token")
        after = await stats()
        record(
            "same-handle-wrong-principal-denied-before-effect",
            res["body"].get("result", {}).get("isError")
            and before["effects"] == after["effects"],
            res,
        )
        before = await stats()
        res = await call("fixture-bob-token", claimed="alice", header="alice")
        after = await stats()
        record(
            "forged-body-meta-and-header-not-authority",
            res["body"].get("result", {}).get("isError")
            and before["effects"] == after["effects"],
            res,
        )
        res = await call("fixture-alice-token", claimed="bob", header="bob")
        record(
            "verified-identity-overrides-forged-hints",
            res["body"].get("result", {}).get("structuredContent")
            == {"principal": "alice", "effects": 2},
            res,
        )
        res = await call("fixture-bob-token", handle="opaque_h_91bd44")
        record(
            "second-principal-own-handle-allowed",
            res["body"].get("result", {}).get("structuredContent")
            == {"principal": "bob", "effects": 1},
            res,
        )
        for principal, label in [
            ("alice", "miss"),
            ("bob", "miss"),
            ("alice", "hit"),
            ("bob", "hit"),
        ]:
            res = await call("fixture-" + principal + "-token", resource=True)
            result = res["body"].get("result", {})
            contents = result.get("contents", [{}])
            payload = json.loads(contents[0].get("text", "{}"))
            record(
                "private-resource-" + principal + "-" + label,
                payload == {"principal": principal, "privateLabel": principal + "-only"}
                and result.get("cacheScope") == "private"
                and result.get("ttlMs") == 30000,
                res,
            )
        before = await stats()
        record(
            "private-cache-separated-by-principal",
            before["cacheHits"] == 2
            and before["cacheMisses"] == 2
            and before["cacheEntries"] == 2,
            {
                "hits": before["cacheHits"],
                "misses": before["cacheMisses"],
                "entries": before["cacheEntries"],
                "keys": before["cacheKeys"],
            },
        )
        res = await call("fixture-alice-token-rotated", resource=True)
        after = await stats()
        record(
            "same-principal-new-token-new-cache-context",
            res["status"] == 200
            and after["cacheMisses"] == before["cacheMisses"] + 1
            and after["cacheHits"] == before["cacheHits"]
            and after["cacheEntries"] == 3,
            {
                "response": res,
                "cacheMisses": after["cacheMisses"],
                "cacheEntries": after["cacheEntries"],
            },
        )
        before = after
        res = await call("fixture-bob-no-read", resource=True)
        after = await stats()
        record(
            "authorization-before-private-cache-lookup",
            res["body"].get("error", {}).get("code") == -32602
            and after["cacheHits"] == before["cacheHits"]
            and after["cacheMisses"] == before["cacheMisses"]
            and after["effects"] == before["effects"],
            res,
        )
        contexts = after["contexts"]
        principals = {c["handlerPrincipal"] for c in contexts}
        clients = {c["oauthClientId"] for c in contexts}
        record(
            "request-principal-is-not-oauth-client-id",
            principals == {"alice", "bob"}
            and clients == {"same-fixture-oauth-client"}
            and all(c["factoryPrincipal"] == c["handlerPrincipal"] for c in contexts),
            {
                "principals": sorted(principals),
                "oauthClients": sorted(clients),
                "contextCount": len(contexts),
            },
        )
        record(
            "only-authorized-effects-recorded",
            after["effects"] == 3
            and after["handles"]["opaque_h_7c2eb8"]["effects"] == 2
            and after["handles"]["opaque_h_91bd44"]["effects"] == 1,
            {"effects": after["effects"], "handles": after["handles"]},
        )
        return checks
