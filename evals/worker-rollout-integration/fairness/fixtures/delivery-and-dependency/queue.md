# Delivery policy and shared dependency

This fictional application consumes an SQS standard queue with fair delivery.
The following provider contract is supplied for this review: `MessageGroupId`
identifies a fairness group; standard groups impose neither FIFO ordering nor a
per-tenant consumption-rate limit. Current fair detection considers in-flight
share and recent processing-time share and has approximate thresholds. It changes
future delivery opportunities; it does not interrupt tasks or reserve resources.
Standard delivery may duplicate during visibility. Assume no duplicate occurs in
the concrete timing trace below; a production policy must still handle the
documented possibility. No live service call is available or authorized.

Producers authenticate customers. The server records `authenticated_customer`
with a job identity. The current producer sets MessageGroupId from an arbitrary
client-supplied `group` string instead. Customer Alpha submits A1 with `group=g1`
and A2 with `group=g2`; both stored authenticated customers are Alpha. Quiet
customer Beta uses `group=beta`. Group identity does not authorize a data read.

There are four worker slots and one shared dependency with six connection permits.
Each job owns its worker slot while executing, blocked, retry-waiting or settling.
Each dependency operation owns a permit until that operation actually terminates;
a caller timeout or cancellation signal does not terminate it in this fixture.
Each Alpha job issues three parallel operations on admission, holding all three
permits for eight seconds. A Beta job needs one permit for one second. A job
waiting for a dependency permit retains its worker slot, but no new dependency
operation may begin without a permit. This dependency cannot add capacity during
the trace; there is no authorized operation that interrupts those eight-second
operations. A visibility extension only postpones broker redelivery.

At time 0, A1 and A2 start, holding all six dependency permits on [0,8). At time 1,
fair delivery returns Beta's B1 to a free worker. Its useful finish deadline is 3.
B1 can acquire a dependency permit only at time 8 and finishes at time 9. Broker
quiet-group dwell is low, while useful completion is late.

Draft proposal:

```text
keep MessageGroupId supplied by the client
cap each group at two received jobs, counting all jobs as equal cost
permit four executing workers
guarantee six dependency permits to Alpha and two to quiet work simultaneously
at time 1 extend Alpha visibility and release their dependency permits locally
because fair delivery plus low quiet-group dwell means B1's deadline is protected
```

The team wants a small corrected policy, preserving eventual useful Alpha work
and recoverable accepted jobs. It has no evidence for an SLO-safe pool limit or
for cancellation completion. Any changed group mapping or admission budget must
state its actual accounting identity, physical scope, resource unit and overflow
or deferred-work disposition. Do not deploy, send messages, change files, or
infer provider settings that make this fixed-capacity trace meet the deadline.
