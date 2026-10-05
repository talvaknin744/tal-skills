---
name: temporal-ai-workflows
description: Design, implement, or review Temporal AI and agent workflows with durable model/tool boundaries, bounded reasoning, shared state, approvals, and recovery. Excludes generic prompt tuning and AI without Temporal.
---

# Temporal AI workflows

A Temporal AI workflow is a durable agent business process with explicit decisions, permissions, effects, and recovery. Apply the requested mode: review findings, a design, or a bounded implementation. Preserve working architecture unless the failure requires changing it.

## 1. Identify the durable task

Inspect the Workflow, Activities, model integration, tool adapters, and existing tests. Record the installed SDK/plugin versions and the actual checkpoint granularity. Check the matching official documentation before relying on an unfamiliar feature; when unavailable, label the capability unverified.

Name the business task, its stable identity, successful outcome, and interruption points. One task may span conversation turns, Workers, and Workflow Runs. Choose conversation-, task-, or pipeline-level ownership from the existing domain; one Workflow per agent is not a requirement. This step is complete when every model call and business effect has an owner and a recovery boundary.

Example: A support task owns the conversation identity while each refund keeps its order-level identity.

## 2. Separate decisions from effects

Keep orchestration deterministic. Place ordinary model calls, retrieval, network I/O, and tool effects in Activities, or use a verified Temporal-aware integration that provides those boundaries. Recorded Activity completions are reused during replay; unfinished or retried Activities can execute again.

Validate model output before using it: schema, allowed tool, arguments, and business preconditions. Treat retrieved text and model output as untrusted data; authorization comes from application policy. Feed confirmed or explicitly unknown tool outcomes back to the model before reporting success.

For model retries, graph checkpoints, tools, or execution sandboxes, read [execution boundaries](references/execution.md). Finish with an explicit response to invalid output, uncertain external completion, and a repeated attempt of each effect.

Example: After an ambiguous ticket-creation timeout, reconcile by the stable ticket key before continuing.

## 3. Bound the lifecycle

Set task-level limits for reasoning turns, tool invocations, elapsed time, provider retries, and spend where relevant. Reserve capacity before parallel work and account for failed or uncertain attempts. Choose an observable terminal or escalation outcome when a limit is reached; history rollover must carry remaining budgets forward.

For human approval, concurrent context updates, parallel agents, long-lived conversations, or sensitive payloads, read [coordination and state](references/coordination.md). Finish with defined ownership of shared state, accepted human input, cancellation, and continuation state for every applicable branch.

Example: Carry the remaining tool budget and pending approval into the continued run.

## 4. Verify the failure boundary

Use the project's test framework and installed SDK test facilities. Exercise the applicable failures, asserting business effects and durable state:

- A later model/tool step fails after earlier steps finish; recover without repeating confirmed effects.
- An Activity's provider accepts work before completion recording fails; recover using the same business identity.
- Invalid model output exhausts a bounded repair policy; prior tool results remain intact.
- Duplicate or late approval races a timeout; only the authorized current proposal can advance.
- Parallel handlers touch shared context; state remains consistent, including across Continue-As-New.
- Cancellation or budget exhaustion stops new work and exposes already-running or uncertain work.

Replay representative histories when Workflow logic changes. Use stubs for controlled provider outcomes and the SDK environment for timers, messages, and replay; identify what each test actually exercises. Review-only work may supply concrete test schedules without changing files.

Report the resulting guarantee, relevant locations, tests actually run, and unresolved provider or deployment assumptions. Semantic answer quality needs its own evaluations; durable completion alone does not demonstrate it. For source provenance or a disputed customer claim, consult [sources and limits](references/sources.md).

Example: Drop the provider response after acceptance, restart the Worker, and assert one effect for the same operation key.
