---
name: temporal-reliability
description: Design, review, or fix Temporal business failure paths involving duplicate Activity effects, ambiguous timeouts, saga compensation, durable waits, or cancellation. For payments/provisioning; excludes generic SDK setup and Worker tuning.
---

# Temporal reliability

Business-effect safety means an explicit outcome at every interruption boundary. Temporal preserves orchestration progress; the application owns external-effect safety.

## 1. Bound the operation

Identify the requested mode: design, review, or implementation. Keep reviews read-only and implementations within the authorized change. Read the relevant Workflow, Activities, callers, provider contract, and existing tests; identify the installed SDK before choosing APIs.

Name the logical operation, required outcome, irreversible effects, and source of truth for each effect. Distinguish a required business dependency from follow-up work: a failed notification need not repeat a successful payment. Preserve the project's simpler transactional solution when it already satisfies the requirement.

Finish this step with the affected path and its success, failure, and unresolved states identified; mark missing evidence as unknown.

Example: After a provider timeout, classify payment as confirmed, rejected, or unresolved.

## 2. Make repeated execution safe

Keep external I/O in Activities and orchestration in deterministic Workflow code. Replay reuses results recorded for completed Activities; an Activity whose completion was not recorded can execute again. Audit the whole Activity, including partial writes before an exception.

For every affected mutation, carry a stable logical-operation identity across retries. An attempt number is never that identity. Enforce duplicate protection where the effect commits: a provider's verified idempotency contract, a resource-side unique invariant, or one transaction covering the local effect and its deduplication result. A separate “processed” flag does not close the crash window.

For provider calls, duplicate starts, concurrent writers, or Activity retry, timeout, and heartbeat changes, read [effect contracts](references/effect-contracts.md). This step is complete when each mutation has an identified enforcement boundary and safe handling of lost acknowledgments.

Example: Reuse the invoice ID as the provider idempotency key for every retry.

## 3. Choose recovery from evidence

Classify failures as retryable, terminal, or outcome unknown. A timeout or cancellation request does not prove that remote work stopped or that its effect failed. When repeating a mutation is unsafe, reconcile the existing operation using its original identity; retain an explicit unresolved state when the provider cannot establish the outcome.

Match Activity attempt timeouts and the overall retry budget to the business deadline and downstream contract. Prefer SDK retry policies for transient Activity failures; define the outcome when retries exhaust. Keep Workflow replay, Activity retries, and starting a new Workflow execution distinct.

When the path includes compensations, approval or settlement waits, callbacks, or cancellation, read [recovery and waits](references/recovery-and-waits.md). Finish with a recovery action and owner for each partial-success state, including recovery that itself fails.

Ask: If provider lookup cannot establish whether the charge committed, who owns reconciliation and what blocks a second charge?

## 4. Verify the failure boundary

For an implementation, use the repository's existing harness to reproduce the relevant interruption and verify the fix. Select cases that exercise the changed contract: lost completion after an effect, concurrent retry, stale attempt resuming, permanent rejection, deadline expiry, duplicate callback, or compensation failure. Assert the business state and number of external effects, not just the Workflow's terminal status.

Use deterministic barriers for race tests and SDK time-skipping for durable timers when available. Recorded-history replay checks compatibility; provider or database integration checks validate effect enforcement. A mocked provider verifies only the assumed contract. In a review, give a concrete failure schedule and expected assertions without changing files.

Report the outcome or findings, relevant checks actually run, and remaining guarantee limits. For attribution or an uncertain SDK/provider rule, consult only the relevant [sources](references/sources.md); customer results motivate the checks rather than establish platform guarantees.

Example: Commit at the provider, drop the response, retry concurrently, and assert one charge and a reconciled result.
