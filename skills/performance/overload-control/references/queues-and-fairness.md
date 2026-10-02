# Bounded waiting, tenant fairness and durable acceptance

Inventory executor, proxy/socket, pool, broker-prefetch and application queues.
Specify count, bytes, age, maximum wait and overflow/expiry disposition for the
relevant queues. A bounded queue may still be full of expired work. Recheck
deadlines before execution; remove abandoned transient waiters and release their
state. Scheduling order follows ordering and starvation requirements, including
whether expensive old work can block fresh critical traffic.

Classify unaccepted, transiently admitted and durably accepted work. Before a
durable promise, reject intake or give the declared acceptance contract. After
acceptance, preserve recoverable payload/identity/ownership and a business-approved
terminal disposition. Control intake, prefetch and execution separately; an
unbounded durable backlog postpones the capacity problem. Bound bytes and oldest
age, account for effects/acknowledgements and avoid repeated immediate requeues.
Broker-specific prefetch and polling semantics require actual version checks.

## Resident work and reclaimable capacity

For fairness, name the authenticated tenant/work class, accounting unit,
guaranteed share, borrowable share and starvation policy. Charge resident work
from acquisition through actual release: prefetched, queued locally, blocked,
retry-waiting and executing items can all retain slots, memory, connections or
downstream permits. Separate these states in accounting instead of capping only
executing handlers. Request counts can underprice long or expensive work; use
justified resource occupancy or cost classes and bound receive/prefetch as well
as dispatch. Check aggregate and per-resource feasibility of simultaneous shares.

A protected reserve is available only if its required resources are usable when
the work arrives. Specify who may borrow it and when that ownership ends.
Reclaim time includes stopping new borrowing, any residual nonpreemptible work,
checkpoint/cancellation completion, effect settlement and resource cleanup.
A cancel request or returned timeout does not itself reclaim execution capacity.
If that interval cannot fit the protected work's waiting budget, keep a reserve
unborrowed, separate the work, or change the promised outcome. A priority label
cannot shorten an uninterruptible operation. Count lost/repeated work when
preemption is available, and retain an eventual-progress policy for borrowers.

## Broker delivery and execution

Delivery fairness allocates opportunities to receive; it does not create worker,
memory or dependency capacity, interrupt resident work, or establish authorization.
Measure tenant dwell and delivered work separately from start time, resource-held
time and useful completion. Explain the outcome when every worker already owns
long work, including an idle CPU with all residency slots held by prefetch.

For SQS standard fair queues, check current account/runtime documentation before
adoption. `MessageGroupId` identifies the fairness group and does not impose FIFO
ordering or a per-tenant consumption-rate limit. Use the application's trusted
accounting identity; per-message fabricated groups bypass its intended grouping.
Current documentation considers both in-flight share and recent processing-time
share; neither detection thresholds nor quiet-group metrics establish a hard
completion deadline. Visibility affects redelivery, not resource reservation or
worker cancellation; standard delivery can duplicate during visibility. A longer
timeout is not a checkpoint or a reclaim mechanism.

State the quota's local or fleet scope, consistency/overshoot allowance and
failure behavior. Uneven or sticky routing can invalidate per-replica quota
division. Distributed counters create their own dependency and hot-key risk.
Bound limiter-key cardinality and memory, keeping metric labels bounded while
retaining enough evidence to evaluate the intended allocation.

**Verify:** one expensive tenant beside ordinary traffic, simultaneous peaks,
uneven routing, restart/scale-out and quota-store failure. Check actual admission,
resource use, useful completion and starvation against promised shares. For
durable work, interrupt after acceptance and around effect/ack boundaries: every
accepted item remains accounted for and recovery does not create a redelivery surge.
Compare a resident-work cap with an execution-only cap under prefetch, blocked
I/O and retry waits. Schedule protected arrivals immediately after borrowers start
their longest work; measure reclaim completion and remaining resources, not just
cancel acknowledgements. Check each tenant's deadlines and eventual progress
alongside resource occupancy and lost/repeated work over the same observation horizon.
