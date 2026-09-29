---
name: microservice-integration
description: Design or change service-to-service communication, evolve API and event contracts, or diagnose consumer coupling and chatty service calls. Use for request-response versus messaging decisions and BFF aggregation across services; exclude generic architecture reviews and single-operation retry deduplication.
license: MIT
---

# Microservice Integration

Make the requested interaction work while preserving the participating services' ability to change independently. Match the task: a review produces findings, a design produces a decision and contract, and implementation changes the scoped code. Existing technology is a constraint to assess, not a reason to replace the platform.

## 1. Trace the interaction

Read the initiating use case, provider, consumers, schemas, and relevant client libraries. Identify who owns the business decision, what result the caller needs, and when it needs it. Trace downstream calls far enough to reveal blocking dependencies and repeated lookups. Use repository evidence to distinguish actual consumers from hypothetical ones; record inaccessible consumers as unknown.

**Done:** the scoped interaction has named participants, ownership, completion semantics, and evidence for its dependencies.

## 2. Choose collaboration before transport

Use request-response when the caller needs a result or asks a particular owner to act; the owner may reject the request. Use events when publishing a fact leaves recipients responsible for deciding their reactions. Request-response may be synchronous or asynchronous: receiving a message through a queue does not by itself make it an event.

Evaluate latency, availability during downstream outages, volume, ordering needs, and operational complexity. Count network round trips along the critical path. Preserve required sequencing; consider parallel calls only where inputs and effects are independent. A broker or an `async` keyword alone does not remove an application's dependency on a result.

**Done:** the selected style has a concrete reason tied to the use case, and required waiting or delayed completion is explicit.

## 3. Specify the boundary

Define the public fields and their meaning, errors, and successful completion. Keep storage models and domain decisions inside the owning service. Inspect shared models and SDKs for changes that force unrelated consumers to upgrade; useful transport helpers can coexist with independently versioned consumers.

For events or asynchronous replies, read [messaging.md](references/messaging.md) to settle payload, correlation, and failure handling. For a user interface aggregating several services, read [ui-composition.md](references/ui-composition.md) to choose where presentation-specific work belongs.

**Done:** a representative request/response or event describes its semantics, and each exposed field or dependency serves a consumer need.

## 4. Preserve compatibility

For an existing interface change, read [compatibility.md](references/compatibility.md). Check both payload shape and behavioral meaning. Prefer compatible expansion when it meets the requirement; existing consumers must tolerate the actual change, not merely the chosen serialization format. For an unavoidable break, specify coexistence, consumer migration, and the evidence that permits retirement.

**Done:** affected consumer versions and rollout stages are identified, including any known incompatibility and the owner of its resolution.

## 5. Verify the interaction

Exercise representative consumers against the proposed provider behavior. For implementation, use the existing test framework to check the changed contract and relevant interruption path. Include delayed replies, unavailable dependencies, or duplicate/out-of-order messages only where the interaction admits them. Use local substitutes or an authorized sandbox for effects; a design records these scenarios without executing production changes.

**Done:** report the resulting interaction, changed files or evidence-backed findings, checks actually run, and material gaps. Every claimed compatibility or completion guarantee has supporting evidence or is explicitly unverified. Attribution and edition differences are in [sources.md](references/sources.md).
