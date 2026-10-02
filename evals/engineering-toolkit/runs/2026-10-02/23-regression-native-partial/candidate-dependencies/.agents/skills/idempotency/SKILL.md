---
name: idempotency
description: Design, implement, or review duplicate-safe APIs, webhook handlers, and queue workers. Use for idempotency keys, conflicting retries, concurrent execution, and recovery after uncertain side effects; exclude generic backoff tuning and pure read-only requests.
license: MIT
---

# Idempotency

Make retries preserve the intended business outcome within an explicit boundary and lifetime. Reuse the project's storage, transaction, and API conventions; choose a mechanism proportionate to the harm of duplication.

## 1. Identify the operation

Read the relevant handler, writes, downstream calls, and retrying clients or workers. Name the effect that must not repeat, the logical operation identity, and the place where success becomes durable. Include indirect effects only when they matter to the request. Distinguish two legitimate identical purchases from two attempts to complete one purchase.

Honor the task mode: a review produces evidence and recommendations; an implementation request authorizes the scoped code changes and relevant tests. Ask only for policy decisions that block correctness. A natural uniqueness rule or a resource update may be sufficient; a new middleware framework is not a default requirement.

## 2. Specify equivalence and ownership

Record the caller/tenant and operation scope, what makes two commands equivalent, which results may be returned on retry, and the guarantee's retention window. Authorize access before exposing an existing operation's result. A client token identifies one logical operation across its attempts; it does not grant access to that operation.

For API keys, payload comparison, response replay, or retention changes, read [request-contract.md](references/request-contract.md). Resolve ambiguous policies explicitly instead of silently treating changed intent as a retry.

Locate the atomic decision that selects an owner before a harmful effect can run. Check the actual datastore's uniqueness, conditional-update, and transaction guarantees across all participating workers. Separate checking for a record from acquiring the right to execute; a process-local cache cannot coordinate independent instances.

When one datastore owns the effect, commit the business change and durable retry outcome in the same transaction or equivalent atomic primitive. A rollback must leave neither committed; a committed change must remain identifiable on retry.

## 3. Cover interruptions

For each durable boundary, reason about interruption immediately before and after it. Identify what a retry can prove from stored evidence and what it cannot know. A timeout describes the caller's observation, not the downstream effect's outcome.

When the path includes an external provider, messaging, leases, or multiple regions, read [recovery.md](references/recovery.md). Preserve the operation identity during recovery and explain the remaining guarantee when the remote system cannot deduplicate or reconcile.

Do not describe a pending or uncertain operation as safely retryable merely because its worker disappeared. Distinguish final results, active work, proven failures before effects, and outcomes requiring investigation. State how each becomes observable and who or what advances it.

## 4. Verify the requested change

Use [verification.md](references/verification.md) to select tests for the actual failure boundaries. When implementing, add meaningful regressions in the existing test framework and run the relevant checks. Use local fakes or an authorized sandbox for destructive or externally visible effects. Review-only work stays read-only unless the user already requested execution.

Verify provider-specific behavior against the installed SDK/API version and current primary documentation when needed. If access is unavailable, identify the unresolved dependency and continue with local evidence; never claim a provider guarantee from the presence of a header alone. Reference locations are collected in [sources.md](references/sources.md).

Finish with the supported guarantee, remaining limits, changed files or concrete findings, and checks actually run. For a design, include the ownership and recovery rules. For a narrow fix, keep unrelated redesign as a separate observation. Completion means the scoped repeat/interruption scenarios are demonstrated or explicitly unverified, with a next validation step for any material gap.
