---
schema_version: 1
name: tal-mcp-integration
description: Build or review a pinned MCP integration with relevant authorization, lifecycle, effect, and real-peer checks.
agents:
  - tal-consistency
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-mcp
  - tal-python
  - tal-typescript
skills: []
disable-model-invocation: true
---

# MCP integration

Use for an explicit MCP client/server or transport request. Keep an ordinary
JSON-RPC helper within its own contract. The main session coordinates through the
[handoff guide](../_shared/handoff.md).

1. **Pin the peer contract.** Gather the requested capabilities, specification
   revision, SDK and wire versions, transport, client/server roles, trusted
   identity source, and effect/resource contract. Assign `tal-mcp` the
   compatibility and lifecycle question. This step ends when supported peer
   behavior and known version discrepancies are explicit.
2. **Select one implementation owner.** Choose the main session, `tal-mcp`, or
   a matching language role for overlapping integration files. Give the owner
   the pinned contract and allowed paths. Add `tal-idempotency` for mutating tools
   with uncertain outcomes, `tal-consistency` for shared handles/cache state, and
   `tal-failure-testing` for a distinct protocol or principal-boundary fault.
   A small adapter correction needs only its owner and relevant review.
3. **Implement and exercise peers.** Have the owner build the selected behavior
   and inspect the actual pinned SDK path. Exercise a representative real-peer
   exchange plus relevant malformed input, per-request authority, disconnect,
   cancellation, and effect-reconciliation cases. Keep local transport models,
   synthetic principal mapping, actual authentication, and peer interoperability
   as distinct evidence. Report unsupported SDK behavior rather than silently
   presenting a handwritten mock as compatibility proof.
4. **Review and accept.** Freeze the candidate for an independent MCP or language
   reviewer. Return findings to the owner through the shared correction loop.
   Accept when the requested capabilities and pinned peer behavior have matching
   evidence, or state precisely which required runtime/security check remains
   unresolved. Review-only work ends with findings and its evidence limits.

Stop dependent integration claims or external actions when the effective
protocol contract, principal authority, uncertain effect, or authorization cannot
be established. Continue useful local work. Return versions/capabilities, changed
paths, actual peer checks, final candidate and review, and the limits of the
tested transport and authentication setup.

## Native invocation

Codex: `$tal-mcp-integration Add the requested private resource tool to this MCP
server using its pinned SDK; verify two-principal isolation with local peers.`

Claude: `/tal-mcp-integration Add the requested private resource tool to this MCP
server using its pinned SDK; verify two-principal isolation with local peers.`
