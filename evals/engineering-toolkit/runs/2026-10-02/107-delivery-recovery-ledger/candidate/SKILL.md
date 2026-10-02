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
For broker or tenant-fairness work, complete the result rows below before finishing.

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

For broker delivery or tenant fairness, include all four rows in the returned
result. A direction to choose a bound or measure a metric leaves that row open.

| Row | Required evidence |
| --- | --- |
| Broker contract | Name the verified provider/version, trusted group identity, actual fairness detector inputs, ordering and rate guarantees, duplicates and redelivery semantics. Identify the measured load inputs, including concurrent in-flight share versus recent processing-time share where documented; an approximate-fairness label does not identify them. Distinguish delivery opportunities from execution, residency and completion guarantees; label unsupported guarantees explicitly. |
| Allocation and waiting | Give resource-cost units and feasible limits, including receive/prefetch and aggregate resident, blocked, retry-wait and settling work. For expiry/overflow, return a chosen transition record: next state and durable authority/evidence; recovery owner; finite deferral, lease/extension and retry bounds; retained payload/progress and retention contract; recovery trigger and capacity-gated re-admission. Separate unaccepted rejection from accepted-work recovery; use a supported paused/redelivery path when loss is unauthorized. Give finite provisional review-policy bounds with units/rationale; keep unknown production SLOs and unverified reclaim guarantees explicit. State the arbitration rule that gives ready tenants eventual progress. |
| Actual release | State who retains each resource after a stop signal and what proves execution and cleanup ended. Include a signal-before-actual-stop control with the expected held/released resources; a cancellation acknowledgement is insufficient. For proposed or rejected interruption/reclaim, report recoverable progress and useful work lost/repeated, including replay cost or explicit unknowns. |
| Discriminating checks | Supply changed-cost and split/fabricated-group schedules with expected outcomes. Return accounting for actual held dependency permits through signal, continued execution, actual release and re-admission; report the peak and assert it fits physical capacity. For broker visibility/leases, give extension and expiry/redelivery schedules with expected ownership, held resources and outcomes for original and redelivered attempts. Return each check's expected outcome and supplied/observed result, or explicit unexecuted status. Measure fair receive separately from useful start and finish. For each tenant/resource, return one named window and the oracle `sum(held units × acquisition-to-actual-release time overlapping that window)`, including signaled operations. Compare with promised allocation, deadlines and eventual progress; label unavailable measurements explicitly. |

Label each row supplied, executed, proposed or unresolved. Report a specific
unresolved guarantee instead of treating a proposed check as established behavior.
