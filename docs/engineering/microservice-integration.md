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
- For changes to business meaning or completion semantics, required consumers can observe the authoritative terminal outcome, including unsuccessful outcomes, and success effects are checked separately.
- FieldMask changes identify the actual convention for an omitted mask, preservation and reset behavior, replacement risk, and supported symbolic paths. Checks cover the original serialized request's expected persisted state or rejection and compare the safe request, reset and replacement separately.
- FieldMask symbolic path retirement uses observed legacy path or alias requests, supported client versions and a meaningful observation window, with a known legacy call validating the detector.
- Relevant consumers exercise provider behavior, or the gaps are explicitly marked unverified; executed checks are reported.

## Where it fits

This is the service interaction and contract specialist. It neighbors `messaging-reliability` for delivery guarantees, `microservice-testing` for consumer/provider evidence, and `technical-deprecation` when a supported interface is retired. See [the integration skill](../../skills/engineering/microservice-integration/SKILL.md) and [messaging reading path](../reading-paths.md).
