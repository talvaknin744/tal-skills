# Effect contracts

Read for external mutations, retries of Workflow starts, or competing writers.

## Identity and ownership

Choose identity for the business action: tenant, operation kind, entity, and logical occurrence. A subscription's next billing cycle is a new action; retrying that cycle is not. Carry the same identity and intent to downstream calls. Reject reuse with a conflicting amount, destination, or other effect-defining input.

Define Workflow ID conflict and reuse behavior at ingress. Recover the existing execution after an ambiguous start response instead of minting a fresh ID. Workflow ID uniqueness has a scope and lifetime; it does not replace downstream duplicate protection.

Workflow Run ID plus Activity ID can identify retries of one Activity execution. For effects that must remain unique across Workflow retries, resets, Continue-As-New, or restarts, use a durable business-operation ID with the required lifetime. Distinct actions need distinct keys even when their payloads match; a reused custom Activity ID must not alias an earlier effect in the same Run.

Verify who may act on the resource and how concurrent owners are serialized. A lease expiry permits takeover but does not stop its former owner. Enforce ownership or fencing at the resource mutation, or use an atomic duplicate check there. An owner check performed only before the network call leaves a race.

## The acknowledgment gap

Trace these boundaries: request accepted; effect committed; provider replied; Activity completion recorded. Stop the process between each pair and explain what another attempt observes.

| Enforcement boundary | Required evidence |
| --- | --- |
| Local database | Effect and deduplication outcome commit atomically; a concurrent contender observes that outcome or loses a unique constraint safely. |
| External provider | Same-key concurrency, payload mismatch, retention, and failure replay semantics cover the application's retry window. |
| Lookup/reconciliation | Authoritative status identifies the original operation, including delayed visibility and completion. |

A local ledger alone cannot make an uncooperative external API atomic. If no safe retry or authoritative lookup exists, stop redispatch and expose unresolved work for reconciliation. Disabling retries reduces repeat attempts but does not recover a lost outcome.

## Retry budget

Use Start-To-Close for an individual attempt and Schedule-To-Close for the Activity's total execution budget, including retries. For long-running regular Activities, heartbeat after resumable progress and choose a heartbeat timeout appropriate to detectable stalls. SDK throttling can leave the latest heartbeat call unpersisted; safely redo work after the last checkpoint the service received.

Classify domain failures deliberately: invalid input or a final business rejection should reach Workflow logic; a temporary outage may retry within the agreed budget. Inspect client-library retries too so layered retries remain bounded. When the business deadline expires, transition to a defined state rather than silently opening another mutation attempt.

Keep provider deduplication data valid through delayed retries and operational recovery. A retry after the provider forgets its key may create another effect. Persist the original reference and reconcile instead of changing the key to escape an error.

Evidence: [Activity semantics](https://docs.temporal.io/activity-definition), [ID lifetimes](https://docs.temporal.io/workflow-execution/workflowid-runid), [timeout boundaries](https://docs.temporal.io/encyclopedia/detecting-activity-failures), and [retry policies](https://docs.temporal.io/encyclopedia/retry-policies). The resource-enforcement checks are engineering deductions from those failure boundaries; verify the actual provider and datastore contract.
