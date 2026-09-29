# Sources and limits

Verified 2026-09-29 against official release metadata, complete pinned source archives, installed packages and local deterministic HTTP peers. This guidance is original synthesis; it does not reproduce protocol manuals.

| Source | Reading and use |
| --- | --- |
| [MCP 2026-07-28 release](https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28) | Stable tag and normative schema; commit `5f5440bb26a62e2cf3440b92da5a667efa03b267` |
| [HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http), [cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation) | Request metadata, header agreement and per-transport interruption |
| [Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization), [caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching), [MRTR](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr) | Trust boundaries, cache isolation and continuation constraints |
| [TypeScript v2.2.0](https://github.com/modelcontextprotocol/typescript-sdk/tree/v2.2.0) | HTTP factory, Node adapter, request context, error mapping and conformance exclusions |
| [Python v2.2.0](https://github.com/modelcontextprotocol/python-sdk/tree/v2.2.0) | Client modes, timeout/cancellation implementation and expected failures |
| [Go v1.8.0](https://github.com/modelcontextprotocol/go-sdk/tree/v1.8.0) | Negotiation, transport/context cancellation and conformance baseline |

Local research ran Python and Go clients against a TypeScript server, malformed HTTP requests, interruption before/after simulated effects, and a synthetic user/handle/cache boundary. These observations cover selected SDK behavior. They do not establish complete conformance, OAuth verification, optional task support, multi-process continuation, durable effects or production recovery. Revalidate any relevant claim when changing a pin.
