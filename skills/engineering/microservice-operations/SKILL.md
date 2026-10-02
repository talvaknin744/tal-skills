---
name: microservice-operations
description: Assess or improve operational readiness across microservice boundaries. Use for cascading failures, cross-service observability, independent deployment and recovery, or service-specific capacity and trust boundaries; exclude generic CI setup and single-process troubleshooting.
license: MIT
---

# Microservice operations

Make the requested service behavior observable, recoverable, and independently operable. Trace the user journey; separate services alone do not establish failure isolation.

## 1. Define the operating claim

Read the affected request or message path, deployment configuration, dependencies, telemetry, and available incident evidence. Identify the user-visible outcome, owning service, shared resources, and target environment. Use existing objectives for availability, latency, data loss, and recovery time; mark missing targets as assumptions to resolve.

Honor task mode: review stays read-only, design produces a concrete plan, and implementation changes the bounded service or configuration requested. Production cutovers, failure injection, and infrastructure mutations require task authorization covering those actions and their environment; otherwise prepare a reviewable procedure.

**Done:** scope, operational objectives, critical dependencies, and the evidence for current behavior are explicit.

## 2. Bound failure propagation

Trace what happens when each relevant dependency is slow, unavailable, or returns an ambiguous result. Include shared connection pools, worker limits, queues, databases, and physical failure domains. Choose degraded behavior based on the user operation: omit optional enrichment, reject an unsafe action, or accept durable asynchronous work with a visible pending state.

For timeout, retry, circuit-breaker, bulkhead, or queue changes, read [failure-handling.md](references/failure-handling.md). Preserve one end-to-end time budget and bounded resource use. State how the system returns to normal after the dependency recovers.

**Done:** each in-scope failure has a bounded caller outcome, containment mechanism, and recovery condition; ambiguous writes retain an explicit reconciliation path.

## 3. Make impact diagnosable

Connect the operational objective to a measurable user outcome. Trace one operation across relevant services using existing correlation or trace context, including message handoffs. Combine logs and metrics for errors, latency, and constrained resources. Include deployment version and configuration context while limiting sensitive data and unbounded metric labels.

Check that a responder can distinguish user impact from a tolerated component failure. Alerts need an actionable condition, owner, and first diagnostic step. A healthy process or low CPU value alone cannot demonstrate a successful business operation.

**Done:** one representative success and failure can be followed from user outcome to relevant service evidence, or the exact missing instrumentation is identified.

## 4. Preserve independent change

Inspect how one service artifact is built, configured, deployed, and exposed to traffic. Keep environment configuration separate from the tested artifact. Check old/new compatibility during rollout, readiness and draining behavior, and whether a shared resource or pipeline forces unrelated services to change together.

Define observation and stop conditions for a rollout. Identify whether recovery means rollback, roll-forward, or reconciliation; a binary rollback does not reverse committed data changes or external effects. For trust or sensitive-data changes, read [security.md](references/security.md). For load, caching, partitioning, or autoscaling changes, read [capacity.md](references/capacity.md).

**Done:** the scoped change has a deployment sequence, compatibility evidence, impact signal, and feasible recovery action.

## 5. Demonstrate readiness

In implementation mode, run relevant checks in an authorized environment, selecting normal behavior, the scoped failure, and recovery. Use current primary documentation to verify platform-specific behavior when implementation depends on it. A configured control is not evidence that it works.

Report findings or changed files, objective-level results, checks actually run, and remaining limits. For review or design, supply evidence locations and verification steps. Consult [sources.md](references/sources.md) when tracing the book basis.

For timeout or cancellation reviews, include a **completion record in the final answer**: current and proposed wait, cancellation, and join primitives; caller response allowance; cancellation/join and cleanup waiting limits or explicit missing bounds; and the event permitting safe resource reuse. For Python asyncio, state that `wait_for()` may exceed its nominal timeout while waiting for cancellation. Derive cleanup ownership, escalation and acceptance observations from [deadline-domains.md](references/deadline-domains.md#observe-completion-after-cancellation).

For each changed clock or serialization boundary, include a budget comparison
at the conversion/acquisition point and any later supplied check: original and
reconstructed remaining allowances, governing clock and earlier caps. Keep
unknown values explicit. Return separate proposed or executed controls for
clock steps before and after serialization, host skew, handoff delay and parent
expiry; a later-time calculation alone does not establish the initial allowance.

**Done:** each operating claim is supported by observed evidence or marked unverified with its next check; timeout/cancellation review answers include the completion record; proposed production actions are distinguished from completed actions.
