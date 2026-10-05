# mcp-engineering

## What it does

Builds or reviews MCP clients and servers where protocol version, tool contracts, authorization, caching, or cancellation affect correctness. It keeps advertised behavior aligned with actual protocol and application behavior, with the installed SDK and revision explicit.

## When to reach for it

Reach for it when implementing or reviewing an MCP integration, including private resources, tool input/output validation, authorization, cancellation, or uncertain effects after a lost response. Calling an available tool belongs to the task's normal execution workflow. For business idempotency or concurrency, continue to the optional `idempotency` or `concurrency-correctness` skills when available.

## It's working if

- The installed SDK, transport, negotiated revision, and peer capabilities are recorded in a client/server/version matrix.
- Every protected operation verifies the caller before reading private cached data or causing an effect.
- Request and tool arguments are checked at their boundaries; structured results match declared output schemas.
- A deterministic peer exercises changed behavior, invalid input, and the relevant denial or interruption; response, effect, cleanup, and unrun boundaries are reported.

## Where it fits

This is the protocol integration specialist. It sits beside `a2a-engineering` for a different agent protocol and hands business-effect equivalence or competing state changes to `idempotency` and `concurrency-correctness`. See [the MCP skill](../../skills/engineering/mcp-engineering/SKILL.md) and [agent protocols in the reading paths](../reading-paths.md).
