# microservice-integration

## What it does

Designs service-to-service interactions and contracts so participating services can change independently. It chooses collaboration semantics before transport and treats existing technology as a constraint to assess rather than a reason to replace the platform.

## When to reach for it

Design service-to-service calls, APIs, events, or BFF aggregation. Use for contract evolution, consumer coupling, or chatty calls; exclude generic architecture reviews and retry deduplication. Use `messaging-reliability` for broker delivery/replay guarantees and `technical-deprecation` for retiring a supported contract.

Invocation: automatic

## It's working if

- The interaction names participants, business decision owner, completion semantics, dependencies, and evidence for actual consumers.
- The communication style has a use-case reason; required waiting or delayed completion is explicit.
- A representative request/response or event defines meaningful fields and errors without exposing provider internals.
- Affected consumer versions, compatibility, rollout stages, and incompatibility owners are identified.
- Relevant consumers exercise provider behavior, or the gaps are explicitly marked unverified; executed checks are reported.

## Where it fits

This is the service interaction and contract specialist. It neighbors `messaging-reliability` for delivery guarantees, `microservice-testing` for consumer/provider evidence, and `technical-deprecation` when a supported interface is retired. See [the integration skill](../../skills/engineering/microservice-integration/SKILL.md) and [messaging reading path](../reading-paths.md).
