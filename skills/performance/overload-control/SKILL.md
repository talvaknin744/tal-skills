---
name: overload-control
description: Design admission, shedding, tenant fairness, bounded queues, and adaptive concurrency when demand exhausts service capacity. Use for overload containment and recovery; replica forecasts and duplicate-effect correctness follow separate workflows.
license: MIT
---

# Overload control

For broker delivery or tenant fairness, read the [response scaffold](references/completion-record.md)
before analysis. Use its eight headings in the final result and fill every
applicable field. Finish only after its coverage audit; unknowns and justified
N/A remain explicit fields.

Protect correct, on-time useful work and bound resource occupancy as demand
exceeds usable capacity. The policy must account for rejection, admitted execution
and durably accepted work through recovery.
Admission is the decision to accept work against a protected resource budget.

## 1. Identify the protected resource and outcome

Read the request/job path, workload, dependency limits, queues, existing admission
and retry policies, and incident evidence. Define useful success, deadlines,
priority classes and the constrained resource. Separate offered demand, admitted
work, useful completions, failures, late work and rejection. Keep review/design
within that mode; implement and exercise the requested scoped policy when authorized.

**Done:** resource, user outcome, acceptance boundary, limit scope and missing
evidence are explicit.
Example: distinguish a request rejected before database access from a durable job accepted for later execution.

## 2. Place and budget admission

Read [admission and resource ownership](references/admission.md). Choose rate,
concurrency and dependency budgets from actual resource costs. Account for
fan-out, fleet size, bypass paths and existing consumers. Place the gate before
the expensive protected work and define protocol-level rejection or safe degradation.

**Done:** every affected admission path has a budget with units, enforcement
scope, decision signal, disposition and execution/cleanup owner.
Example: express the dependency budget as concurrent calls per instance and include every fan-out branch.

## 3. Bound waiting and preserve fairness

For queues, tenant isolation or durable jobs, read
[queues and fairness](references/queues-and-fairness.md). Bound waiting count,
bytes and age as relevant. State priority, guaranteed/borrowed capacity, starvation
behavior and trusted identity. Preserve the contract of already accepted jobs.

**Done:** a noisy workload, expired request and interrupted accepted job each have
an explicit outcome; aggregate budgets remain valid across the proposed topology.
Example: specify whether an expired queued job is discarded, dead-lettered, or safely retried.

## 4. Coordinate the control loops

For adaptive limits, retry interaction, routing, autoscaling or recovery, read
[feedback and recovery](references/feedback-and-recovery.md). Define the sample
population, delays, bounds, probes, recovery ramp and operational fallback.
Separate cheap rejection from useful-work latency in each controller's signals.

**Done:** interacting controls have observable decisions and bounded behavior
under slowdown, capacity loss, missing signals and recovery.
Example: cap the recovery ramp while checking that autoscaling and retry feedback do not raise admission together.

## 5. Demonstrate containment

Compare the harmful baseline and policy under the same relevant demand. Include
the implicated burst/slowdown, unrelated traffic, cancellation and recovery;
add fleet changes, durable handoff or adaptive feedback when those branches apply.
Measure client-visible useful throughput, latency/dispositions, occupancy, queue
age, tenant outcomes and downstream attempts. Review/design returns the specific
unexecuted procedure and acceptance conditions.

**Done:** the requested policy protects its stated outcomes within measured
resource bounds, or each gap has a next check. Report actual versus proposed
results and limits. [Sources](references/sources.md) records primary reading scope.
Example: compare useful completions and dependency attempts during the same burst with and without the admission limit.
