---
name: mcp-engineering
description: Implement or review MCP servers and clients where protocol versions, tool contracts, caller authorization, private caching, or cancellation affect correctness. Use for MCP integrations; exclude merely calling an available tool.
---

# MCP engineering

**compatibility matrix:** Make the compatibility matrix explicit: list the supported client, server, and protocol combinations.

Make the integration's advertised contract match its actual behavior. Keep the project's installed protocol revision and SDK explicit; proposing a migration is a separate decision.

1. **Establish compatibility.** Inspect the lockfile, transport, negotiated revision, peer capabilities and affected operations. For current SDK interfaces, legacy migration or optional extensions, read [compatibility](references/compatibility.md). Finish with a concrete client/server/version matrix; mark unsupported cells rather than assuming feature parity.

**Example:** If the installed client negotiates a revision the server does not implement, record that unsupported matrix cell and stop short of claiming compatibility.

2. **Trace authority and effects.** Identify the trusted credential verifier, application principal, resource owner and effect boundary. For HTTP authentication, opaque handles or private data, read [authorization and caching](references/authorization-and-caching.md). Finish when every protected operation checks the verified caller before reading cached private data or causing an effect.

**Example:** A user-scoped cache lookup must verify the authenticated principal before returning a cached private resource.

3. **Implement the relevant contract.** Validate request envelopes and tool arguments at their actual boundaries; validate structured results against the declared output schema. Keep protocol errors, tool execution errors and transport failures distinguishable. For cancellation, timeouts, retries or a lost response, read [outcomes](references/outcomes.md). Preserve existing business idempotency and recovery rules when adapting them to MCP.

**Example:** A timed-out tool call may have committed its effect; preserve its operation identity and report the outcome as unknown until reconciled.

4. **Exercise the failure.** Use a deterministic local peer to test the changed operation, its invalid input and the denial or interruption that could violate its contract. For an interoperability claim, run the stated language pair with pinned SDKs. Finish when evidence includes the actual revision, observed response/effect and cleanup result; identify each unexecuted boundary.

In review mode, return actionable findings tied to a request and observable consequence. In implement mode, return the patch and the checks run on that patch. In both modes, distinguish the protocol guarantee, the SDK behavior and the application policy. A successful tool exchange is not proof of durable effects or full protocol conformance.

For authoritative pins and reading limits, consult [sources](references/sources.md). For duplicate-safe business effects, Hand off to the `idempotency` skill. For competing state changes, Hand off to the `concurrency-correctness` skill. For worker handoff during shutdown, Hand off to the `graceful-draining` skill.

**Example:** Send one malformed argument to a deterministic peer, then record its response, whether an effect occurred, and cleanup.
