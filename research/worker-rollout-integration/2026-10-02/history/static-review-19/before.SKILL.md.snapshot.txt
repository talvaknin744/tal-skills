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

For broker delivery or tenant fairness, return each applicable row separately.
Justify N/A only for an absent branch; unknown facts remain unresolved. Choose
concrete provisional review-policy bounds with units/rationale, separate from
unknown production SLOs. A direction to choose a bound is incomplete.

| Row | Required returned record |
| --- | --- |
| Broker contract | Verified provider/version, trusted group identity, actual detector and measured load inputs (concurrent in-flight versus recent processing-time share where documented); ordering/rate, duplicate/redelivery contract. Separate delivery opportunities from execution/residency/completion guarantees; label unsupported guarantees. |
| Allocation | Resource-cost units, feasible physical and aggregate capacity bounds, guaranteed/borrowed shares and arbitration giving ready tenants eventual progress. |
| Residency and waiting | Chosen finite local and fleet aggregate receipt/receive/prefetch bounds including all nonexecuting receipts, with scope and count/bytes/age units as relevant; account for deferred, executing, blocked, retry-wait and settling work. A local limit alone leaves the aggregate unresolved. |
| Expiry and recovery | Chosen expiry/overflow transition: unaccepted rejection versus accepted paused/redelivery state and durable authority/evidence; recovery owner; finite deferral/lease-extension/retry bounds; retained data/progress and retention contract; recovery trigger and capacity-gated re-admission. Preserve accepted work when terminal loss is unauthorized. |
| Actual release | Resource owner through signal, continued execution, release and re-admission; accounting for actual held dependency permits including original/redelivered operations, reported peak and physical capacity assertion; proof execution/cleanup ended. Cancellation acknowledgement does not release capacity. |
| Interruption cost | Separately return recoverable progress, useful work lost/repeated and replay/cleanup cost under proposed, hypothetical or rejected interruption/reclaim; mark unknown quantities explicitly. |
| Fair useful outcomes | Named window and per-tenant/resource oracle `sum(held units × acquisition-to-actual-release interval overlap with window)`, including signaled work; compare promised allocation, fair receive, useful start/finish, deadlines and eventual progress. Mark unavailable measurements. |
| Verification matrix | Each implicated prefetch, deferred, blocked, retry-wait and settling state/transition; protected arrival after borrowing; changed cost/group fragmentation; signal before actual stop; visibility extension/expiry/redelivery; recovery. For each, return expected ownership/resource/useful-work oracles and supplied/observed outcome or unexecuted status. |

Label each row supplied, executed, proposed or unresolved; never invent evidence.
