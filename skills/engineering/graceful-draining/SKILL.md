---
name: graceful-draining
description: Design, implement, or review service shutdown and job handoff during deployment, scale-down, or maintenance. Use when long-running work loses progress, is repeatedly interrupted across workers, exhausts retries during rollouts, or needs a bounded drain with safe ownership transfer.
license: MIT
---

# Graceful draining

Preserve the logical job while its worker changes. A worker stopping, a delivery
being retried, and a business operation failing are separate events.

## 1. Reconstruct the interruption

Keep the requested mode: review produces findings, design produces a protocol,
and implementation changes the scoped code and configuration. Production
rollouts, redrives, and fault injection need authorization covering those actions.

Trace one job through admission, claim, side effects, durable progress,
acknowledgment, and termination. Inspect its actual runtime: a queue consumer
inside a Deployment, a Kubernetes Job, a durable workflow, or a custom scheduler.
Find every counter and deadline that can end it: broker receives, framework
attempts, application failures, controller backoff, leases, and total job age.

**Done:** a timeline names the logical job, worker generation, last durable
checkpoint, uncertain effects, and the layer that declared failure. Mark missing
evidence instead of treating an exit code as a diagnosis.

## 2. Choose finish or resume

State the required invariants: accepted work remains discoverable; committed
effects survive recovery; stale owners cannot overwrite progress; the job
progresses or reaches an explicit terminal decision within its policy.

Choose a strategy supported by the workload. Retain old workers until completion
when jobs cannot checkpoint and the platform can sustain the maximum drain.
Otherwise bound each work slice and resume from durable state on compatible
capacity. Account for overlapping resource use and old/new checkpoint formats.
A planned drain allowance does not establish recovery after a crash.

For checkpoints, handoff, retry accounting, or already interrupted jobs, read
[durable handoff](references/durable-handoff.md). For signals, Kubernetes,
queues, or framework shutdown, read [platform shutdown](references/platform-shutdown.md).
Verify version-sensitive behavior against the deployed system and current
primary documentation; [sources](references/sources.md) records the research basis.

**Done:** each job class has a justified strategy, compatible destination, finite
drain deadline, and a recovery or escalation action when that deadline expires.

## 3. Close admission before transferring work

Make the retiring deployment generation ineligible at the authoritative claim
point before releasing its jobs. Account for claims already in flight. Stopping
only pod A can send its job to retiring B and then C, spending the same budget
again. Prepare sufficient eligible successor capacity before this transition.

Quiesce applicable HTTP admission, queue pulls, prefetch, timers, and child-task
creation. Track reserved as well as executing work. Keep dependencies needed for
checkpointing, acknowledgments, and lease or broker heartbeats alive during drain.

Publish resumable progress and ownership transitions durably. Use conditional
updates for the current ownership epoch; enforce fencing at protected resources
where exclusivity matters. Preserve a stable logical identity for duplicate-safe
effects and reconcile unknown outcomes. A local lease check cannot fence a paused
worker after it resumes.

**Done:** the transition specifies its authoritative gate, durable recovery
record, acknowledgment boundary, successor eligibility, and protection against
late writes or cleanup from the previous owner.

## 4. Demonstrate survival and bounded failure

Use deterministic schedules around the changed boundaries. Include successive
retirements of A, B, and C; interruption after an effect but before its checkpoint;
an expired owner resuming; and failure to persist progress before the deadline.
Cover checkpoint compatibility and each independent retry limit that applies.

For implementation, run relevant local regressions and the authorized platform
checks available. For review or design, provide concrete evidence locations and
the checks needed to close gaps. Separate a simulated state-machine result from
verified signal, broker, and cluster behavior.

**Done:** report actual checks, preserved progress and business outcome, ownership
evidence, counter changes, and remaining gaps. Retire workers on durable terminal
completion or demonstrated recoverable continuation. Keep unresolved work visible
with its last progress time and escalation; neither shutdown nor an unknown
external outcome counts as successful job completion.
