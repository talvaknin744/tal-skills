# Billing-export worker revision 7 → 8: release decision and operator procedure

## Decision and scope

**NO-GO for the supplied candidate.** Do not start the Deployment rollout,
change claim eligibility, enable format-3 writes, raise the business failure
limit, or remove version-2 dependencies. This is local preparation, not
authorization for a cluster action. The target cluster/namespace, image
digests, queue limits, and authorized operator have not been supplied.

Each accepted `(tenant_id, export_id)` must receive one durable final result
or a recorded terminal **business** failure. Controlled retirement leaves
unfinished work eligible to continue. The business failure limit stays
**three**. The synthetic `three_retirements` schedule instead reaches business
failures `[1, 2, 3]`, maintenance deferrals `[0, 0, 0]`, dead letter, and no
final receipt. The separate malformed-input control correctly reaches its
third business failure. Neither schedule is a runtime observation.

These gates define a future release. A failed or unmeasured gate leaves the
decision at NO-GO. Three Ready pods, process exit, and the revision-8 new-job
smoke test do not establish preservation of accepted work.

## Candidate repairs and release gates

1. **Close queue admission.** At drain start, atomically close a
   claim/handler-admission gate and stop new `receive()` calls. Account for a
   receive already in flight and for buffered, unstarted deliveries. They must
   remain unacked and become eligible through a tested broker mechanism; no
   handler may claim them after gate closure. Inventory active claims separately.
   Readiness only controls HTTP routing. Repeated drain signals keep the
   original deadline and do not reopen the gate.
2. **Fence each durable batch.** Use the stable job key and batch operation ID
   with `commit_batch(key, epoch, operation_id, rows, cursor, format)`. Renew
   against server-confirmed lease time. The commit must atomically reject an
   expired/stale epoch, deduplicate rows, and advance the cursor. Remove the
   unfenced `save_progress` path. On timeout, `inspect` the same operation ID,
   receipt, cursor, and current epoch before any retry. A timeout does not prove
   the mutation failed.
3. **Separate completion, maintenance, and business failure.** Store the stable
   final receipt through `finish` before completion ACK. On redelivery, inspect
   and ACK an existing final receipt without repeating effects. Controlled
   retirement and lease loss never call `business_fail`. After a confirmed,
   compatible checkpoint, `maintenance_defer` releases the current epoch and
   increments only `maintenance_deferrals`. Malformed input still increments
   `business_failures` and dead-letters on the third business failure. If a
   checkpoint is uncertain, neither ACK nor call `maintenance_defer` on an
   unconfirmed receipt: preserve the last confirmed cursor, let the lease
   expire, and reconcile under a compatible successor.
4. **Respect the original termination deadline.** The 90-second allowance
   includes the 15-second sleeping preStop hook, leaving **at most 75 seconds**
   after SIGTERM. Replace the 85-second handler wait. Proposed post-SIGTERM
   budget: at most 60 seconds for active work/checkpoint, 10 for inspection and
   cleanup, and at least five before forced kill; shorten every phase if the
   original platform deadline leaves less time. Use one monotonic deadline and
   bounded RPCs. Typical five-second checkpoints are not a maximum. At expiry,
   exit without ACK or a maintenance/business count for unresolved work; record
   its key, last confirmed cursor, operation ID, epoch, and recovery owner.
   Rehearse actual hook and signal timing before using this budget.
5. **Solve incumbent revision-7 drain.** The source excerpt's revision-7
   shutdown has no queue gate and can classify interruption as business
   failure. A repaired revision-8 pod cannot repair a running revision-7 pod.
   Before the first revision-7 termination, demonstrate a broker/server-side
   control that stops its new claims without consuming the business budget,
   settles buffered and in-flight reservations, and lets active work finish or
   hand off at confirmed progress. An alternative is a bounded intake freeze
   and natural completion, with proof revision 7 has no active, reserved,
   buffered, or in-flight delivery before SIGTERM. If neither path succeeds in
   its approved window, abort this rollout; do not signal an active revision-7
   owner and rely on its 85-second wait.
6. **Pin compatible writes.** Configure revision 8 to write format 2 while
   revision 7 can claim work or is considered for recovery. Demonstrate
   revision 8 continuing an existing format-2 checkpoint and revision 7
   reading revision-8-written format 2 with the same cursor and effect
   semantics. Revision 8 currently defaults to format 3, revision 7 cannot
   read format 3, and the smoke test covers only a new revision-8 job. If any
   nonterminal format-3 job exists, keep revision-8-compatible capacity and a
   tested format-3 recovery route. Enabling format 3 is a separate change
   after mixed-version and recovery gates are revised.

Freeze the corrected worker image, configuration, and procedure for independent
durability/infrastructure review. Record exact image digests and environment
values before approval. This plan does not change `worker.py` or
`deployment.json`.

## Staged operator procedure, only after all gates pass

1. **Preflight.** Record cluster/namespace; old/new image digests and write
   formats; queue visibility/redelivery limit, lease duration and renewal
   interval, receive/claim behavior, checkpoint RPC bound, and business and
   maintenance counter baseline per affected job. Inventory nonterminal keys,
   checkpoint formats, operation/final receipts, epochs, buffered/active
   deliveries, backlog age, and retained inputs/layouts. Set a numeric handoff
   observation limit from the measured lease and broker redelivery bounds plus
   one poll interval. If these bounds, the incumbent drain control, or an
   escalation contact remain unknown, stop before changing the Deployment.
2. **Stage capacity and hold the controller.** Use a separately controlled
   revision-8 Deployment as the proposed staging surface; keep the existing
   revision-7 Deployment image fixed. Before *each* old owner leaves, add one
   revision-8 pod and observe four healthy, claim-capable pods (the current
   three plus one new successor), or document a measured equivalent capacity
   threshold. Confirm the new pod is Ready, can claim format-2 work, sustains
   required throughput, and has room for continued jobs. Keep the old
   Deployment from automatically rolling or scaling down during this gate.
   The supplied `maxUnavailable: 1` / `maxSurge: 1` does not enforce that
   order; changing it to `maxUnavailable: 0` also does not create an operator
   pause before an old pod is removed. Rehearse an exact per-pod queue gate
   and targeted retirement/scale-down method; if the controller can select a
   different, still-owning pod, stop. The PDB `minAvailable: 2` is not a
   job-aware gate for this ordinary Deployment rollout. Confirm the temporary
   Deployment's queue coexistence and surge resource capacity before use.
3. **Retire one revision-7 owner.** Apply the proven incumbent gate; stop new
   reservations/claims and settle in-flight and buffered deliveries. Let each
   active export finish with a final receipt or reach a confirmed compatible
   checkpoint and documented handoff. Track the original 90-second deadline
   if SIGTERM is used. For every affected key, inspect cursor, operation
   receipt, epoch, final receipt, business count, and maintenance count. Verify
   unacked work becomes visible and a compatible successor claims it within
   the preapproved handoff limit. Do not proceed while any key is unresolved.
4. **Repeat serially for the remaining two owners.** Add and prove a **new**
   revision-8 successor before each old owner leaves: four usable pods just
   before retirement and at least three afterward, with backlog/claim delay
   within preapproved limits and retained v2 input/layout. Keep the
   operator-held scale ladder at three after each step; do not issue an image
   update that starts automatic replacement while handoff evidence is pending.
   Pause on the first stop signal below. A second or third interruption of one
   logical export must preserve the same job, stable batch/result IDs, and
   business counter.
5. **Close pod replacement, then follow the work.** Reconcile every affected
   accepted export to a final receipt or a confirmed compatible cursor with
   retained inputs, visible continuation, and an eligible successor. Record
   old/new epochs, unique effects, final receipts, both counters, deadline
   usage, backlog age, and unresolved keys. Three Ready revision-8 pods mark
   pod replacement only; exports can run for 12–24 hours.

## Stop, recovery, and dependency retirement

Stop new retirements and incompatible claims if successor capacity is missing;
admission occurs after gate closure; a checkpoint/final receipt is unconfirmed
past the handoff limit; a cursor regresses or stale epoch write succeeds; a
maintenance event increments `business_failures` or dead-letters a job; a
deadline overruns; broker redelivery exceeds its bound; or a worker cannot
read durable progress. Freeze the candidate and inspect the existing key and
operation IDs before retry. Keep the last confirmed cursor, input manifest,
layouts, and compatible revision-8 capacity. Escalate unresolved jobs to the
assigned billing-export recovery owner. Do not blindly ACK, redrive a
dead-lettered job, or repeat a possibly committed batch.

In the supplied synthetic cases, `imp-885` timed out but `inspect` shows
`batch-r-500`, cursor 500, and 500 unique rows, so resume after 500. For
`imp-886`, epoch 41's late cursor-500 write must be rejected after epoch 42
commits cursor 600. For `imp-890`, redelivery uses stored `result-890` and
ACKs without another final effect. These are expected decisions, not observed
worker behavior.

Revision-7 rollback is only a candidate **before any format-3 progress** and
after backward format-2 continuation, safe revision-7 retirement, and rollback
handoff have been rehearsed. If format 3 exists, stop further rollout and
repair/continue forward with revision 8 or a separately proven conversion;
retaining v3 layout alone does not make revision 7 a v3 reader. No rollback
route is proven by this bundle.

The **billing-export service on-call** is the proposed operational tail owner;
a named rotation/person and backup must be assigned before rollout. This role
audits nonterminal jobs and required v2/v3 dependencies every six hours after
the last revision-7 exit. At 24 hours, escalate any unresolved job or missing
continuation capacity to the service owner and continue six-hour audits.
Release `accepted-manifest-v2` and `export-layout-v2` only after inventory
proves no nonterminal or replayable job needs them, the broker replay window
has passed, and durable final receipts or recorded business causes are
verified. Retain `export-layout-v3` while any format-3 job needs it. Pod
readiness never triggers dependency removal.

## Evidence required to change NO-GO

Local `python3 observe.py` completed and reports a 75-second post-hook budget
against an 85-second wait, two buffered deliveries, a receive after the
signal, retirement business counts `[1, 2, 3]`, cursor 500 after a timeout,
epoch 42 before an old writer resumes, a final receipt on redelivery, and
revision-8 default format 3. It only calculates authored JSON; no worker,
adapter, broker, or cluster was run.

In a disposable environment using the actual adapters and platform lifecycle,
rehearse and retain per-key traces for:

- One logical 12–24-hour export through three forced retirements: each forced
  checkpoint has a receipt and compatible successor; business count stays at
  baseline; maintenance count rises only for confirmed deferrals; the export
  eventually has one result. In a separate malformed-input control, business
  failures reach exactly three and the recorded cause dead-letters it.
- A signal with active, buffered, and in-flight receives, plus repeated
  signals: no post-gate handler/claim, all reservations accounted for, no lost
  ACK, and no surviving worker-owned task, socket, or datastore session after
  cleanup. Force a slow/unconfirmed checkpoint through the original
  90-second deadline; observe eligible recovery under a new epoch without
  inventing a business or maintenance count from the timeout.
- A committed batch with lost reply, stale epoch-41 writer after epoch-42
  progress, and lost final ACK/redelivery: one row effect per operation ID,
  monotonic cursor, stale commit rejected, one final result, and ACK only
  after its receipt. Check lease renewal, broker attempt limits, and recovery
  timing.
- Mixed old/new readers and writers using the **same** format-2 cursor and
  batch semantics; revision-8 continuation of existing format-2 work; and
  the chosen response to unfinished format-3 work. Verify successor
  claim-capable capacity before an old owner leaves and the controller's
  actual wait at each operator gate.

Bind traces to the frozen image/configuration digests. Have an independent
reviewer check the traces and stop/recovery decisions. Until those checks pass
on the candidate to be deployed, the release remains NO-GO.
