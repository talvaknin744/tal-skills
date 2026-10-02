# Broker and tenant-fairness response scaffold

Use these eight headings in the final response. Replace every field below with
supported facts, a concrete proposed policy, or an explicit unknown and next
check. Mark N/A with a reason only when the branch is absent. Choose finite
provisional review bounds with units/rationale; unknown production SLOs and
unverified reclaim guarantees remain separate. Label evidence supplied, executed,
proposed or unresolved. A direction to choose or measure later leaves a field
unresolved; never invent measurements.

## Broker contract

- **Provider/version and contract source:** verified scope and evidence.
- **Trusted group identity:** grouping key and who controls it.
- **Actual detector inputs and measurement basis:** name the documented inputs;
  distinguish concurrent in-flight share and recent processing-time share where
  documented. State unknown inputs explicitly.
- **Ordering, rate, duplicates and redelivery:** supported guarantees and limits.
- **Delivery versus execution/residency/completion:** what each contract guarantees
  and which guarantees are unsupported.

## Allocation

- **Protected resources and cost units:** costs and feasible physical/aggregate
  capacity bounds.
- **Guaranteed/borrowed shares and arbitration:** how ready tenants eventually
  progress within those bounds.

## Residency and waiting

- **Chosen finite local and fleet aggregate bounds:** concrete receipt, receive
  and prefetch limits, including all nonexecuting receipts; scope and count,
  bytes and age as relevant. A local bound does not fill the fleet aggregate field.
- **State accounting:** prefetched, deferred, executing, blocked, retry-wait and
  settling work charged while it retains resources.

## Expiry and recovery

- **Chosen expiry/overflow transition:** distinguish unaccepted rejection from
  accepted-work paused/redelivery states; name the durable authority and evidence
  supporting that path. Preserve accepted work when terminal loss is unauthorized.
- **Recovery owner and finite bounds:** chosen deferral, lease/extension and retry
  limits, with units/rationale; retained payload/progress and retention contract.
- **Recovery trigger and capacity-gated re-admission:** who resumes which work,
  under which eligibility and capacity check.

## Actual release

- **Owner and release proof:** resource custody through signal, continued
  execution, actual release and re-admission; what proves execution/cleanup ended.
- **Actual held dependency permits:** account for original and redelivered
  operations, report the peak and assert it fits physical capacity. A cancellation
  acknowledgement does not release capacity.

## Interruption cost

- **Proposed, hypothetical or rejected interruption/reclaim:** separately report
  recoverable progress, useful work lost/repeated and replay/cleanup cost. Rejection
  of interruption does not remove its counterfactual cost field; mark unknown
  quantities explicitly.

## Fair useful outcomes

- **Named observation window and each tenant/resource's oracle:**
  `sum(held units × acquisition-to-actual-release interval overlap with window)`,
  including signaled work. Mark unavailable measurements explicitly.
- **Allocation and user outcomes:** compare promised shares, fair receive, useful
  start/finish, deadlines and eventual progress over that window.

## Verification matrix

Return a separate schedule row for each implicated waiting state/transition
(prefetch, deferred, blocked, retry-wait and settling), protected arrival after
borrowing, changed cost, group fragmentation, signal before actual stop,
visibility extension/expiry/redelivery, and recovery. Each row contains:

| Schedule and transition | Expected ownership/resource/useful-work oracle | Supplied/observed outcome or explicit unexecuted status |
| --- | --- | --- |
| Chosen implicated schedule | Concrete expected held/released state, capacity bound and useful-work outcome | Supported result, or proposed procedure and unresolved observation |

## Final coverage audit

Before ending, compare the final response against every field above. Keep each
applicable field visible, including unknowns with their next check. Justify each
N/A by an absent branch; check that proposed policies and unexecuted schedules
are labeled. Finish with a concise coverage line naming any unresolved fields.

The technical contracts remain in [queues and fairness](queues-and-fairness.md)
and [admission and resource ownership](admission.md).
