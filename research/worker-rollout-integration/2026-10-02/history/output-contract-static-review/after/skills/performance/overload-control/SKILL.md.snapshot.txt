---
name: overload-control
description: Design, implement, or review load shedding, admission limits, tenant fairness, bounded queues, and adaptive concurrency when demand or dependency slowdown exhausts service resources. Use for overload containment and recovery; replica forecasting and duplicate-effect correctness have separate workflows.
license: MIT
---

# Overload control

Protect correct, on-time useful work and bound resource occupancy as demand
exceeds usable capacity. The policy must account for rejection, admitted execution
and durably accepted work through recovery.

## 1. Identify the protected resource and outcome

Read the request/job path, workload, dependency limits, queues, existing admission
and retry policies, and incident evidence. Define useful success, deadlines,
priority classes and the constrained resource. Separate offered demand, admitted
work, useful completions, failures, late work and rejection. Keep review/design
within that mode; implement and exercise the requested scoped policy when authorized.

**Done:** resource, user outcome, acceptance boundary, limit scope and missing
evidence are explicit.

## 2. Place and budget admission

Read [admission and resource ownership](references/admission.md). Choose rate,
concurrency and dependency budgets from actual resource costs. Account for
fan-out, fleet size, bypass paths and existing consumers. Place the gate before
the expensive protected work and define protocol-level rejection or safe degradation.

**Done:** every affected admission path has a budget with units, enforcement
scope, decision signal, disposition and execution/cleanup owner.

## 3. Bound waiting and preserve fairness

For queues, tenant isolation or durable jobs, read
[queues and fairness](references/queues-and-fairness.md). Bound waiting count,
bytes and age as relevant. State priority, guaranteed/borrowed capacity, starvation
behavior and trusted identity. Preserve the contract of already accepted jobs.

**Done:** a noisy workload, expired request and interrupted accepted job each have
an explicit outcome; aggregate budgets remain valid across the proposed topology.

## 4. Coordinate the control loops

For adaptive limits, retry interaction, routing, autoscaling or recovery, read
[feedback and recovery](references/feedback-and-recovery.md). Define the sample
population, delays, bounds, probes, recovery ramp and operational fallback.
Separate cheap rejection from useful-work latency in each controller's signals.

**Done:** interacting controls have observable decisions and bounded behavior
under slowdown, capacity loss, missing signals and recovery.

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

For broker delivery or tenant fairness, return the detector inputs and
delivery/ordering contract separately from execution, residency and completion
guarantees. State finite deferral bounds, overflow/expiry dispositions and eventual
arbitration for ready tenants. Include evidence for tenant resource-held time and
useful completions over one observation window, changed work cost and
split/fabricated fairness groups, and a control where a stop signal precedes actual
execution stop: show resources held until confirmed release. Separate
supplied/executed results from proposed checks and identify each unresolved guarantee.
