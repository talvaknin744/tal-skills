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

For fairness, name the authenticated tenant/work class, accounting unit,
guaranteed share, borrowable share and starvation policy. Request counts can
underprice expensive work; use justified cost/occupancy classes when needed.
Reserve capacity for protected work without promising simultaneous guarantees
larger than physical capacity. Define reclaiming borrowed capacity and behavior
when tenant demand or cost changes.

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
