---
name: temporal-safe-deployments
description: Assess Temporal releases, Worker retirement, replay compatibility, payload changes, and migrations with active executions. Use for command-history compatibility, version routing, safe cutover, and recovery from bad deployments.
---

# Temporal safe deployments

Execution compatibility preserves the business process while code that reconstructs it changes.

## 1. Establish the compatibility boundary

Keep the requested mode: review produces findings, planning produces a rollout,
and implementation changes the authorized files. Production routing, resets,
termination, and migration require authorization covering those operations.

Inspect the installed SDK, server or Cloud capabilities, Workflow types, Worker
deployment configuration, payload converters, and affected callers. Identify
which executions can encounter both old and new code, including sleeping runs,
pending Activities, message handlers, child Workflows, and continued runs.

Record the business invariant being protected and every changed boundary:
command sequence, serialized data, routing, or ownership. This step is complete
when each affected execution class has a known compatibility requirement;
mark inaccessible histories or configuration as evidence gaps.

Example: A sleeping run pinned to build A requires build A until it advances.

## 2. Choose how existing executions progress

For code changes, Worker rollouts, rollback, or migration, read
[deployment and cutover](references/deployment-and-cutover.md). Match versioning
to the installed SDK and deployment system. Pinned runs need their original
Worker version available; Auto-Upgrade runs need replay-compatible code.
Moving an already pinned run to another version requires its own compatibility
assessment. A successful rollout of new starts does not recover stranded runs.

For payload evolution, long-lived state, configuration changes, or
Continue-As-New, read [state continuity](references/state-continuity.md).
Specify what crosses each boundary and who consumes it. Continue-As-New creates
a new run; carry required state explicitly and finish message handlers before
closing the current run.

Complete this step with one justified strategy per affected execution class,
the artifacts or Workers it must retain, and a recovery path if it cannot advance.
Keep an existing viable strategy when a smaller compatible change suffices.

Example: Retain the old Worker for pinned runs and replay auto-upgraded histories against the candidate.

## 3. Verify compatibility and business effects separately

Replay representative open and closed histories against the exact candidate
Workflow bundle where those histories may reach it. Cover each affected command
branch, patch generation, message path, and payload version. Use the repository's
SDK replay tools; record missing coverage instead of inventing histories or
test results. Keep sensitive histories within their authorized environment.

Replay checks command compatibility using recorded Activity results. Verify
changed Activity behavior and external effects separately with integration or
failure-injection tests. Include interrupted work, duplicate delivery, and the
relevant rollover or cutover boundary. An all-green replay suite does not prove
that a payment or provisioning call cannot execute twice.

For implementation, run the available checks and repair regressions in scope.
For review or planning, identify the exact checks, inputs, and observable
outcomes required; run read-only checks when possible. Completion means each
identified compatibility risk has evidence or an explicit unresolved test gap.

Example: Replay a history paused before the changed command and one already past it.

## 4. Deliver a bounded rollout or assessment

Tie each rollout increment to concrete measures: advancing old runs, expected
business outcomes, compatible new starts, and stable task failure/backlog rates.
Specify when to stop expanding traffic, how to restore routing, and how to
recover executions that already entered the candidate version. For migration,
account for every in-flight operation and ensure one effect-producing owner
through cutover and rollback.

Report the chosen strategy, affected execution classes, checks actually run,
remaining evidence gaps, and the retirement condition for old code, schemas,
and Workers. Distinguish a tested local change from a completed production
rollout. Consult [sources](references/sources.md) when validating a capability or
attributing a customer lesson; customer outcomes are motivation, not guarantees.

Example: Stop the ramp when Workflow Task failures exceed the workload-derived threshold.
