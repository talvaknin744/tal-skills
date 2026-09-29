# MCP contracts, identity and interruption

A real TypeScript MCP server, Python and Go clients, and explicit failure probes for **MCP 2026-07-28**. The verifier uses loopback HTTP and deterministic local fixtures; no model, remote service or credential is required.

Run from this directory with Node ≥22.18, Python ≥3.10 with `venv`, Go ≥1.25 and network access to package registries:

```sh
./verify.sh /tmp/tal-mcp-observed.json
```

`PYTHON=/path/to/python` selects a Python interpreter. The verifier copies these sources into a temporary directory, installs exact locked dependencies, checks TypeScript, builds Go, runs each fixture and stops its server. It removes the runtime directory on exit and returns nonzero for a failed check. The Python lock contains wheel hashes; platforms without a matching wheel fail explicitly. The observed file identifies actual runtimes and source hashes. It is selected interoperability evidence, not full protocol conformance.

| Component | Pin |
| --- | --- |
| TypeScript server/core | 2.2.0 |
| Node adapter | 2.1.0 |
| Python MCP / MCP types | 2.2.0 |
| Go SDK | v1.8.0 |

`package-lock.json`, `python/requirements.lock` and `go/go.sum` record complete resolved artifacts. [observed.json](observed.json) records the checked-in candidate's last executed run; compare its source hashes after any change.

## What the checks observe

| Suite | Checks | Contract |
| --- | --- | --- |
| Python client and raw HTTP | 14 | Real list/call, structured output, invalid arguments, business rejection, version/header/body errors, disconnect and effect accounting |
| Python cancellation | 2 | Cancel an actual SDK call after progress; the TypeScript handler receives cancellation |
| Go client | 10 | Real discovery/list/call, error distinctions, negotiated revision, context cancellation and wire observations |
| Synthetic authorization/cache | 16 | Verified principal routing, handle ownership, forged hints, caller/token cache separation and scope checks before lookup |

Unknown tools produce a JSON-RPC error inside HTTP 200; invalid request envelopes can use HTTP 400. Tool execution errors carry `isError`. The verifier checks these layers independently.

The slow tool records a simulated effect either before interruption or at completion. Cancellation clears its pending timer; it leaves a prior effect recorded. A canceled client call alone cannot determine whether an external effect happened. Production callers need their business operation's stable identity and reconciliation rule; this fixture does not provide durable storage, idempotency or rollback.

This revision uses per-request metadata, not a protocol initialization session. Go's session object remains an SDK interface; the client asserts the actual negotiated revision. Its extra cancellation notification is observed SDK behavior, while HTTP SSE closure is the specified cancellation signal.

## Synthetic authorization boundary

The authorization fixture maps fixed public strings to Alice and Bob. **This is not an OAuth or JWT verifier.** Verified middleware context flows through `req.auth`, factory `authInfo`, and callback `ctx.http.authInfo`. Both users share one OAuth client ID, but own different handles. User/tenant identity and scopes come from the fixture verifier, never the caller's metadata, arbitrary identity headers or tool arguments.

The application cache partitions a private resource by tenant, principal, permission version, scopes, token fingerprint, operation and URI. It checks read permission before lookup. Rotating a token creates a separate context even for the same principal. `cacheScope` and TTL are protocol hints; they do not implement authorization or configure a client/gateway cache.

`/stats` is local test instrumentation and the effect/cache state is in memory. The fixed credential map, introspection endpoint and lifetime-unbounded cache are fixture conveniences. Production authentication, bounded cache eviction, revocation, ingress policy and durable recovery need their own design and tests.

## Inspect individual clients

In a disposable copy with dependencies installed, start `npm run server`; its first output gives an ephemeral port. Run `.venv/bin/python python/client.py http://127.0.0.1:PORT/mcp` or `(cd go && go run . http://127.0.0.1:PORT/mcp)`. The Go client expects a fresh server because it verifies effect counts. Stop the server with Ctrl-C. Prefer `verify.sh` for automatic process ownership.

The examples leave legacy migration, stdio, MRTR, tasks extensions, DPoP, reverse language pairs, real client-cache reuse, token revocation, multi-process recovery and external effect reconciliation unverified. Check SDK support before adding those scenarios; a green baseline does not advertise optional capabilities.
