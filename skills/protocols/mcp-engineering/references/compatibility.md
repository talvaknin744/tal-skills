# Compatibility branches

The verified baseline is MCP **2026-07-28**, TypeScript server/client/core **2.2.0**, Node middleware **2.1.0**, Python `mcp` **2.2.0**, and Go SDK **v1.8.0**. Recheck the target project's actual pins; these are a dated baseline, not an instruction to upgrade every project.

For this revision, version and capabilities travel per request. HTTP requests carry `MCP-Protocol-Version` and `Mcp-Method`; operations with a name or URI also carry matching `Mcp-Name`. Validate headers against the body before dispatch. An SDK object named `ClientSession` does not imply an initialization handshake or wire session.

- TypeScript: use `McpServer`, `createMcpHandler(factory)` and the separate Node adapter. The factory creates a fresh server for each request; shared pools and caches belong outside that request instance.
- Python: `mcp.Client(..., mode='2026-07-28')` targets the revision; `mode='auto'` permits discovery/fallback. Check `client.protocol_version` when semantics require a particular revision.
- Go: `ClientSessionOptions.ProtocolVersion` requests a revision but permits negotiation. Check `InitializeResult().ProtocolVersion` before depending on that revision.

For earlier handshake-based revisions, isolate and test the legacy adapter. Verify cancellation and state semantics in each supported revision; success after silent fallback may erase the guarantee the application needed.

For optional features, inspect the pinned SDK and its expected conformance failures before advertising support. TypeScript/Python 2.2.0 do not implement the tasks-extension runtime. Python lacks DPoP and JWT-bearer support; Go's baseline excludes several OAuth client mechanisms. These gaps do not remove ordinary MCP tool support.

For multi-round-trip input requests, treat continuation separately from retry: bind state to verified principal, operation and expiry; validate integrity and enforce single consumption when required. A valid MAC does not prevent replay. Run a cross-process continuation fixture before claiming restart or load-balancer support. The baseline tool/cancellation checks do not establish MRTR support.
