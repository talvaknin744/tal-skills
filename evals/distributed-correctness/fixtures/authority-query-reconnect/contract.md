# FleetView API and stream contract

[C1] This is a synthetic local review exercise. FleetView has one active cell,
one elected authority and gateway replicas. A successful write acknowledgement
means its state mutation has been persisted and applied by that authority.

[C2] STRICT query success must include every authority mutation applied before
that query's gateway invocation. It may include later mutations. This contract
concerns read freshness only. EVENTUAL queries explicitly permit lag and have no
monotonic read guarantee. The existing caller API has no revision parameter,
revision response token or consistency header. An authority read endpoint is
not supplied. Gateway internals can change without changing that caller API.

[C3] Each authority epoch and stream session has its own ordered source prefix.
Sequence values and process local logical counters from different epochs cannot
be compared. All ms fields in traces are from one deterministic test scheduler,
not synchronized wall clocks deployed across hosts. A cache object holds the
current epoch, session, applied prefix and values as one atomic snapshot.

[C4] RequestBarrier(query_ref, authority_epoch, stream_id) is an internal API.
The gateway sends it after the associated query invocation. The authenticated
current authority queues it in its ordered event producer. When processing it,
the authority records a source prefix after the request reached that producer.
Its BarrierAck(query_ref, authority_epoch, stream_id, through_seq) is emitted on
the same stream only after all state events through that prefix were emitted.
Messages identify their query reference, epoch and session. The gateway may
coalesce queries queued before a barrier is sent. A previous completed barrier
does not cover a query invoked after a later authoritative mutation.

[C5] Transport preserves wire event order within one stream. Its receive loop
and the local cache application worker are asynchronous. A wire ACK callback
can run while an earlier received state event remains queued for application.
received_prefix records receipt. applied_prefix advances only after every
earlier event is reflected in cache state, including deletion. It cannot skip
queued state changes. A source progress event changes no business value but is
processed in that same contiguous prefix. A fresh query reads one atomic cache
snapshot. A snapshot cannot be retroactively changed after it is captured.

[C6] Transport ping replies prove socket liveness only. They have no source
ordinal or event producer relationship. Their age says nothing about queued
state application. Leader replacement, disconnect or deadline can use the
existing retryable UNAVAILABLE response. Success cannot silently substitute an
EVENTUAL result for a requested STRICT result. Deadlines are total budgets,
including queueing, barrier handling, application and snapshot capture. No extra
network service, fixed sleep, polling endpoint or provider guarantee is supplied.

[C7] Review only. Commands may inspect local fixture files. Web, network,
subagents, service launch and source edits are unavailable. Recommend checks as
unexecuted unless a supplied observation or an actual local command supports
them. The contracts here define this exercise, not any vendor's runtime API.

[A1] A trusted resolver delivers AuthorityChanged(leader9, s9) to the
gateway at 20 ms, before all new-epoch query invocations below. The contract
requires new queries after that event to use leader9/s9. A socket connection is
not an applied snapshot. Source sequence values restart in each epoch. There
is no assertion that this resolver detects an unseen election immediately.

[A2] Replacement snapshot leader9/s9 prefix 3 replaces the old cache and
contains job-red queued. It is applied at 25 ms. The authority's prefix 4
mutation makes job-red running and is applied there and write acknowledged at
22 ms. Gateway application of this state event completes at 27 ms. There are
no other leader9 state changes before prefix 5 at 31 ms.

[A3] A query that already captured a valid immutable result before the
AuthorityChanged event may finish sending that result after the event. It need
not include later mutations. A pending old query with no captured result must
establish proof under the current authority within its original deadline, or
return UNAVAILABLE. A later query does not cancel an earlier valid captured
response. This is an explicit allowed overlap, not inferred leader semantics.

[A4] qnew-a and qnew-b queue before their one shared barrier is sent. That
barrier is recorded by leader9 after both invocations and has through_seq 4.
Its ACK arrives at 26 ms; the local applied prefix is still 3 then. qlater
invokes after the separately acknowledged prefix 5 mutation, so that earlier
barrier is not a new proof for qlater. A new current-authority barrier remains
available with the C4 semantics. Every query keeps its own listed deadline.

[A5] Proposed policy sets ready on socket connection, records max received
sequence across all streams, returns from the cache if that number is high,
and cancels every held response whenever a later query is issued. This policy
is a proposal only. Initially leader8/s8 prefix 100 is applied and job-red is
queued. qearly's own proof and immutable capture are valid before replacement.
