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

[I1] The leader implementation holds each recorded BarrierAck until a
later source event passes the producer cursor. Business mutations stop after
90 ms. An incoming barrier or transport ping alone does not advance that cursor.

[I2] SetProgressPulse(period_ms) is supplied on the current authority. A
positive setting inserts a no-mutation source event within period_ms after a
barrier has been recorded if no business event advances the cursor first. This
event uses the same producer ordering, epoch and stream. Permitted positive
periods are 1, 2, 4 and 5 ms. Zero disables pulses. It does not modify jobs.

[I3] In the declared healthy model, barrier coalescing takes at most 2 ms,
gateway to authority delivery at most 3 ms, leader processing at most 2 ms,
waiting for a subsequent source event at most the enabled pulse period,
authority to gateway delivery at most 3 ms, contiguous local application at
most 3 ms, and snapshot plus response at most 1 ms. These are additive worst
case bounds for this exercise. The gateway request's total budget is 24 ms.
During a partition delivery is unbounded and the total request deadline still
applies. These numbers are synthetic assumptions, not vendor measurements.

[I4] Proposal P changes transport ping frequency from 10 ms to 1 ms. Proposal
S enables the supplied source pulse. No configuration has been applied. The
trace starts with the gateway and leader at applied source prefix 900, equal
cache contents and no later business mutation.
