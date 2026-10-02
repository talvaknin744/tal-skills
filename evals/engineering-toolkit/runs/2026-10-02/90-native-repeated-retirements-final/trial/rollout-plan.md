# Billing-export workers: revision 7 to revision 8

## Release decision — HOLD

This is a local preparation plan, not authorization to change a cluster. Do not
start the Deployment rollout, retire a revision-7 owner, raise the three-business-
failure limit, or remove version-2 dependencies on the supplied evidence. The
candidate is described only as “revision 8”; its immutable image, actual worker
implementation, target cluster/namespace, and live job inventory are unknown.

The current source cannot meet the accepted-export promise. Planned interruption
is caught as `business_fail`; the authored three-retirement schedule dead-letters
`(tenant-blue, imp-884)` at business failure 3 without a final result. Readiness
does not stop queue receives: two deliveries are buffered and `imp-889` enters a
handler after SIGTERM. `export_rows` followed by unfenced `save_progress` can
duplicate an effect or let an expired owner regress a successor's cursor. The
90-second termination clock includes a 15-second sleeping `preStop`, leaving at
most 75 seconds for an 85-second handler wait. Revision 8 defaults to format 3,
which revision 7 cannot read; the only compatibility smoke test starts a new job.

Promote this decision to **GO** only after the implementation, compatibility,
platform, and rehearsal gates below pass against one frozen candidate and a
named operator accepts the proposed operational thresholds. A Ready pod, process
exit, or successful new-job smoke test is not a work-survival result.

## Required candidate and preflight gates

1. **Trace and fence each logical export.** Use `(tenant_id, export_id)` across
   deliveries and revisions. Atomically close queue admission before drain: stop
   polling, prevent any buffered or late `receive()` result from entering a
   handler or claiming, and account for claims already in flight. Verify how
   unacknowledged reservations become eligible again. Keep lease renewal and
   store access alive until active ownership has a recorded disposition. Repeated
   retirement signals must share the original deadline.
2. **Make progress and effects one durable operation.** Replace the separate
   `export_rows`/`save_progress` path with `commit_batch(key, epoch, stable
   operation_id, rows, cursor, format)`, or prove any remaining external effect
   has the same atomic/idempotent guarantee. The store must reject an expired
   epoch and deduplicate a retry under the same operation ID. On an uncertain
   batch response, use `inspect(key, operation_id)` before retrying; retain the
   original ID and row meaning. On an uncertain `finish` or ACK, inspect the
   stable final result receipt; ACK only when it exists. A redelivery with a
   final receipt ACKs without recomputing. Classify cancellation, lease loss,
   transport timeout, and planned retirement separately from genuine business
   failure. Preserve the three-failure limit and the malformed-input path.
3. **Establish a bounded finish-or-resume path.** A 12–24-hour export cannot be
   expected to finish during pod grace. After a confirmed compatible checkpoint,
   the current epoch may call `maintenance_defer` and leave the delivery unacked;
   this increments `maintenance_deferrals`, not `business_failures`. A completed
   job may ACK only after its final receipt. If a batch, final receipt, or defer
   outcome remains uncertain at the drain deadline, record its key/operation/
   epoch and leave it unacked for inspection and lease-based recovery. Do not
   invent a business failure or declare successful handoff. Verify a compatible
   successor can claim and continue from the durable cursor. A stale release
   must not clear its claim.
4. **Prove format and dependency continuity.** Exercise revision 8 resuming a
   real format-2 checkpoint with `accepted-manifest-v2` and `export-layout-v2`,
   including the next batch's rows, stable IDs, cursor, and final receipt. Pin
   revision 8 to write format 2 throughout coexistence and any revision-7
   rollback window **if that configuration exists and is verified**. Otherwise
   keep the rollout on hold until a tested revision-8-capable forward-recovery
   path is available. Inventory any existing format-3 nonterminal jobs first:
   revision 7 cannot resume them, even if new revision-8 writes are pinned to 2.
   Before any format-3 job is available while revision-7 workers remain, prove
   an authoritative claim-time compatibility gate denies revision 7 ownership
   without a business failure. If revision 7 has already reserved its delivery,
   prove that reservation returns to revision-8 eligibility without exhausting
   any broker delivery limit or starving the job. If no such gate exists,
   close queue/claim admission across **all** revision-7 workers, settle their
   buffered and in-flight receives/claims, and only then allow format-3 work to
   be claimed by verified revision-8 capacity. A write-format pin or a future
   forward fix does not protect an existing format-3 job during coexistence.
   Keep HOLD if neither method is demonstrated. Retain both version-2
   dependencies and the version-3 layout while any nonterminal or replayable
   accepted work needs them.
5. **Prove platform control and capacity.** Identify the target, image digest,
   queue/store adapter versions, server lease and broker visibility settings,
   actual active/reserved job counts, and a compatible successor with measured
   spare capacity before each retirement. Use a rehearsed controller operation
   that prevents a second old owner from retiring before the per-wave gate is
   satisfied. `maxUnavailable: 1`, `maxSurge: 1`, PDB `minAvailable: 2`, and HTTP
   readiness do not provide that job-aware gate. Replace the sleeping `preStop`
   with an admission-closing hook and measure its actual timing. The hook must
   finish within 15 seconds; the worker must finish or yield by 80 seconds from
   the original termination start, reserving at least 10 seconds before the
   platform's 90-second kill. If SIGTERM arrives after the 15-second allowance,
   use the remaining original deadline, not a fresh 65-second wait. Rehearse the
   deadline with slow/blocked checkpoints and forced kill.

## Operator procedure after all gates pass

The following are proposed caps, to be accepted or revised from measured lease,
visibility, checkpoint, and capacity data **before GO**: 30 minutes to stage a
successor, 15 minutes for each retired owner's deliveries to become owned and
show durable continuation, 60 minutes from first retirement to the end of the
three-pod transition, and 36 hours of post-transition job watch. Missing timing
data or a cap that cannot accommodate the actual queue contract keeps HOLD.

1. Record a baseline per nonterminal accepted key: delivery/reservation state,
   worker revision and epoch, server lease expiry, cursor and format, latest
   operation and final receipts, output row identity/count, business failures,
   maintenance deferrals, last progress time, and required inputs/layouts.
   Record current dead letters and their terminal causes separately. Verify the
   format-3 claim gate or generation-wide revision-7 admission closure before
   staging mixed-version workers. Freeze the candidate digest and write-format
   setting. Do not treat the authored `imp-884` dead letter as a successful
   rollout outcome; any corresponding real job needs separate business-approved
   reconciliation or redrive.
2. Stage one revision-8 successor within the 30-minute cap. Require actual
   readiness, queue/store health, compatible read/write configuration, and
   enough measured capacity for the active/reserved load. Verify the controller
   remains gated. Abort staging if those observations do not hold.
3. For each old owner, one at a time, close its queue admission and record all
   active, buffered, reserved, and in-flight `receive`/claim work. Start the
   original 90-second termination clock. Reconcile any uncertain batch through
   its stable operation ID; finish and ACK only with a final receipt; otherwise
   confirm a checkpoint and defer under the current epoch, or leave an unresolved
   unacked claim for lease-based recovery. Complete worker cleanup by the
   80-second internal cutoff. A forced kill is a stop signal until every owned
   key is reconciled; do not advance to the next owner on process exit alone.
4. Within the proposed 15-minute per-wave cap, observe every affected key:
   either its final receipt, or a compatible successor's newer epoch,
   nonregressing cursor, matching output identity, no duplicate rows, and
   continued progress. Require no maintenance-induced business failure in
   either case. Compare reservations and queue lag to
   baseline. Keep the next retirement gated until all keys have a disposition.
   Repeat for the remaining owners only while the 60-minute rollout cap and all
   stop conditions hold.
5. End the Deployment transition only after all three old owners have a
   reconciled disposition and three revision-8 pods have verified capacity.
   Continue watching unfinished exports; Deployment completion does not end
   responsibility for their results. A named billing-export operations primary
   and backup must accept this watch before GO. Proposed escalation: investigate
   any key with no durable progress for two hours, escalate unresolved keys to
   the service incident owner by 36 hours after the last retirement, and keep
   dependencies and recovery capacity until each accepted key has a durable
   result or a terminal business failure with recorded cause. These are
   operational escalation times, not new business-failure limits.

## Stop, recovery, and dependency retirement

Stop further retirements if admission reopens or a late delivery is submitted;
revision 7 acquires a format-3 job; successor capacity or compatibility is
missing; any epoch-old commit succeeds;
an operation receipt/output/cursor is inconsistent; maintenance increments
`business_failures`; a job is lost, duplicated, or unexpectedly dead-lettered;
the original 90-second clock or a wave cap is missed; a needed input/layout is
missing; or format 3 is written while a revision-7 rollback is assumed. Pause
the controller, preserve both formats' dependencies and compatible revision-8
capacity, and inventory affected keys before any further action.

For uncertain effects, inspect under the original logical key and operation ID;
do not issue a new ID for the same batch. For an unresolved claim, let the
server-owned lease and broker reservation policy govern recovery, then verify a
compatible newer epoch. Use revision 7 as a staged rollback only when the
inventory proves every outstanding checkpoint it may claim is format 2 and its
required inputs remain. If any outstanding format-3 job exists, keep revision 8
read capacity and use a tested revision-8-compatible forward fix; the supplied
mixed-version fixture contains such a job (`imp-901`). Do not reset counters or
automatically redrive a genuine terminal business failure.

The operations primary owns dependency retirement after the post-transition
watch, with service-owner escalation at its deadline. Remove
`accepted-manifest-v2` or `export-layout-v2` only after a durable inventory shows
no nonterminal or replayable accepted export, old delivery, rollback path, or
checkpoint needs them, and the assigned owner signs off. Three Ready revision-8
pods alone are insufficient. Keep `export-layout-v3` while format-3 jobs need it.

## Evidence and rehearsals still required

The bundle is authored synthetic evidence, not a Kubernetes response, adapter
run, or completed rollout. `python3 observe.py` checks only fixture arithmetic:
75 seconds after the hook versus an 85-second wait; two buffered deliveries and
late `imp-889`; `imp-885` has a committed batch receipt and cursor 500 despite a
timeout; current epoch 42 precedes stale epoch-41 write; `imp-890` has a final
receipt after lost ACK; revision 8 defaults to format 3. The poison control
correctly reaches business failures 1, 2, 3. None proves actual worker behavior.

Rehearse against the frozen worker, actual queue/store adapters, and a disposable
deployment with the target platform timings. Capture before/after logical key,
batch/result receipts, unique rows, cursor/format, owner epochs, both counters,
terminal business cause, reserved deliveries, readiness, active tasks, process
exit, and surviving connections/sessions. Required schedules and pass conditions:

- Three successive retirements of one long job preserve its cursor and output
  identity without increasing business failures; buffered and late receives do
  not enter handlers after the admission gate closes.
- A timed-out committed batch is resolved by operation receipt before any retry;
  the paused epoch-41 owner cannot write after epoch 42 commits; a lost final ACK
  response redelivers to an ACK based on the stored final receipt.
- Malformed input produces business failures exactly 1→2→3, zero maintenance
  deferrals, and a dead letter with persisted `MalformedInput` cause on the
  third failure, without a false final receipt or completed-output claim.
- Revision 8 resumes and completes a revision-7 format-2 checkpoint. For the
  chosen format-3 coexistence gate, use its matching oracle. With a claim-time
  gate, revision 7 attempts `imp-901` but gains no ownership, batch/export
  effect, cursor write, or business-failure increment; any reservation returns
  to revision-8 eligibility without exhausting the broker delivery limit. With
  generation-wide closure, make `imp-901` available after closure and show no
  new revision-7 receive call, claim, or handler. A receive already in flight
  may return after closure; its delivery must not enter a handler or claim and
  must become eligible for revision 8. In both cases revision 8 continues
  without cursor regression. A revision-7 rollback is rejected while format-3
  work exists, and a compatible candidate recovers it.
- A slow checkpoint, repeated signal, and forced kill respect the original
  termination deadline and produce an inspectable recovery decision.

Prove queue redelivery and successor ownership within the accepted caps. Record
the target/image digest and observed outcomes; any missing or failed schedule
keeps the release on HOLD.
