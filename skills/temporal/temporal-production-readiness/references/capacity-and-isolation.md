# Capacity and isolation

Apply the sections touched by the workload; retain other constraints as unknown
rather than expanding a bounded task into a platform redesign.

## Recurring work and backlog

Decide whether every interval represents distinct required work or merely a
request for a fresh snapshot. Choose overlap behavior accordingly: skipping or
coalescing sacrifices executions; buffering retains delayed work; concurrent
execution requires safe concurrent effects. `BUFFER_ALL` serves some workloads,
but cannot make arrival rate exceed processing capacity indefinitely. Explicitly
set the catchup window and backfill behavior. Catchup after service downtime and
buffering behind an unfinished run address different conditions.

Measure work age and source-data freshness. Define how to pause intake, drain,
coalesce, expire, or repair overdue work under the business contract. Pausing a
Schedule stops future scheduled starts; handle its existing executions separately.
Test a slow run across several scheduled intervals and an outage followed by
catchup. When results can finish out of order, use a source revision or logical
cutoff so an old result cannot replace a newer one. For incremental syncs, commit
the checkpoint only after the covered work is durable.

Mechanics: [Schedules](https://docs.temporal.io/schedule). Policy selection,
checkpointing, and stale-result protection above are application design decisions.

## Fan-out and downstream pressure

Map the expansion from one input to child executions, Activities, attempts, and
provider calls. Bound work admitted ahead of completion; choose chunking and
concurrency from measured resource use. Include backfills and retry waves in the
same budget as normal traffic. A cap per Worker or Workflow can still overwhelm
a shared provider account after replicas or tenants increase.

Identify the actual coordination mechanism enforcing each provider quota and the
behavior when it is exhausted. Preserve progress on throttling. Increasing Worker
count helps only if execution capacity is the bottleneck; verify dependency and
Temporal Namespace capacity before amplifying demand. Poller autoscaling, task
slot tuning, and scaling Worker replicas are different controls. Name who owns
the replica controller; Temporal Cloud's managed service does not by itself
operate the application's Worker fleet.

Confirm client starts and messages survive exhausted retries during service
throttling: distinguish acknowledged acceptance from a failed or uncertain
submission, with a recoverable record and safe resubmission identity. Protect
the recorded data. A single zero backlog sample is insufficient evidence for
scale-down; compare work completion, queue delay, and Worker availability across
an interval because queue statistics are approximate and have exclusions.

Use [Worker performance](https://docs.temporal.io/develop/worker-performance) for
SDK knobs and [Cloud limits](https://docs.temporal.io/evaluate/cloud/limits) or
the installed self-hosted configuration for service limits. Read actual quotas
and deployed versions rather than copying fixed counts from an example. Check
[Task Queue performance](https://docs.temporal.io/develop/worker-performance/task-queues)
when interpreting queue statistics.

## Payload and history growth

Estimate worst-case history growth from iterations, messages, child execution
events, and serialized inputs/results. Measure replay after a cold Worker start
as well as warm throughput. Plan Continue-As-New or decomposition before the
applicable event-count and byte limits; carry the minimum required progress and
deduplication state across boundaries. Account for pending handlers and child
lifecycles when deciding where a run may close.

For large data, use an immutable object version or content-addressed reference
with Activities responsible for fetching it. Specify access control, encryption,
region, integrity checks, availability, and deletion ownership. Its lifetime must
cover every path that may need it: retries, recovery, future runs, and retained
evidence. Make expired-reference recovery explicit. Avoid an expiring signed URL
as the sole durable locator. External storage transfers these obligations; it
does not eliminate them. Verify serialization and schema compatibility for real
payload shapes, including large failures and accidental return values.

Mechanics: [Worker best practices](https://docs.temporal.io/best-practices/worker)
and [Cloud limits](https://docs.temporal.io/evaluate/cloud/limits). Object lifecycle
and retention choices are application obligations.

## Tenant, capability, and regional boundaries

Route work to compatible Workers, including GPU or other specialized execution.
Task Queues can separate routing and capacity pools; their names alone do not
establish application authorization or isolation of shared databases, Workers,
and provider quotas. Test a hot tenant against a quiet tenant's completion budget.

Map each tenant's authorization, Namespace, Worker credentials, dependencies,
payload stores, logs, and regions. Evaluate Namespace access controls explicitly
for the chosen hosting model. Regional Namespace placement alone cannot establish
end-to-end residency if Workers, providers, or stored payloads cross the boundary.
For cross-team execution, document caller/callee ownership and the service
contract rather than granting access to internal implementation details.

Mechanics: [Task Queues](https://docs.temporal.io/task-queue),
[Namespaces](https://docs.temporal.io/namespaces), and
[Cloud security](https://docs.temporal.io/evaluate/cloud/security).
