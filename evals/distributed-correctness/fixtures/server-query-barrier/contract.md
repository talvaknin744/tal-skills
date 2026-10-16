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

[Q1] All runs begin with leader8, stream s8, applied prefix 40 and no
job-red entry in the gateway. The authority's seq 41 mutation adds job-red with
state queued. The business write is acknowledged before each query invocation.

[Q2] Runs are independent. In recent-ping and ordered-wire, authority and stream
remain leader8/s8 through the response deadline. Updates eventually apply at
60 ms. Each STRICT query's absolute deadline is 80 ms. In unavailable, there is
no usable authority response before 80 ms. There are no other state mutations.

[Q3] Proposed fix A removes the ping age shortcut but returns a cache value as
soon as the wire BarrierAck callback fires. Proposed fix B requires every caller
to send a newly introduced minimum revision field. These are proposals, not
executed fixes. The existing EVENTUAL endpoint reads a local snapshot directly.
