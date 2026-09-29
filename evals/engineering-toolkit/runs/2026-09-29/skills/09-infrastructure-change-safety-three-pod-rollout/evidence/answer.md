The job failed because deployment interruptions consumed its processing-failure budget. According to [incident.md](/tmp/tal-skill-trials-20260929/09-infrastructure-change-safety-three-pod-rollout/workspace/project/incident.md:1), ownership moved through A, B and C; each SIGTERM became `TaskCancelled → fail()`, producing counts 1, 2 and 3, then dead-lettering the import.

The [worker proposal](/tmp/tal-skill-trials-20260929/09-infrastructure-change-safety-three-pod-rollout/workspace/project/proposal.pseudo:1) leaves that mechanism intact. Readiness does not stop queue polling, immediate cancellation records a failure, and replacement health does not demonstrate successful job transfer. The PDB does not address those application-level problems. Raising `failure_limit` to 10 merely permits more interruptions and weakens the required malformed-input policy.

The fix should retain the three-failure limit and introduce this worker handoff contract:

1. **Close queue admission before draining.** Atomically mark the worker as draining and stop polling/claiming. Handle outstanding claim requests too: safely defer any late claim without starting its handler. Set HTTP readiness false as a separate action.
2. **Quiesce at a recoverable boundary.** Request cooperative drain; finish the current page or stop it safely for replay. Keep renewing the lease while the handler runs. Persist a checkpoint only after its corresponding output is durable.
3. **Release ownership explicitly.** Once the handler can no longer write and the checkpoint is confirmed durable, call `defer()` for the current ownership token. Await confirmation, stop renewal and exit. The successor keeps the same `job_id` and resumes from that checkpoint. Replaying an incompletely checkpointed page is safe under the supplied input contract.
4. **Distinguish outcomes.** Confirmed deployment drain uses `defer()`, not `fail()`. Malformed input and genuine processing failures retain normal failure accounting. Do not suppress every cancellation exception.
5. **Bound shutdown.** A proposed budget within the 90-second grace is: quiesced and checkpointed by 60 seconds, release confirmed by 75, exit by 80, leaving 10 seconds of margin. Validate that these limits include all termination overhead. If a deadline fails, halt further rollout steps; never release while a handler can still write. Forced termination or lease loss can still consume a failure.

An uncertain `defer()` response requires reconciliation with authoritative queue ownership. Neither the old process nor the supervisor should assume success or start a duplicate owner. Lease tokens or equivalent fencing must prevent stale-owner writes after transfer.

The rollout should be bounded as follows:

1. **Resolve the first-deployment boundary.** The existing worker cannot acquire safe drain behavior merely by receiving SIGTERM. Verify that an admission gate and safe handoff can reach the legacy workers. If they cannot, freeze termination and allow the legacy owner to complete within a separately agreed window before replacing it. The supplied proposal establishes no safe immediate bootstrap path.
2. **Freeze one candidate generation.** Exclude the entire retiring generation from new claims before transferring work. New workers must understand existing checkpoints, retain stable job IDs and remain outside this rollout’s termination set. Prevent overlapping rollout or scale-down activity.
3. **Replace one pod at a time.** Provision one replacement before retiring one old pod—at most one surge pod, with capacity verified first. Proceed only after the replacement can access the queue, input, checkpoint store and output destination.
4. **Gate on useful work.** After transfer, require confirmed new ownership, successful lease renewal and at least one durable page of progress before retiring the next old pod. Use representative canary work where a replacement has no assigned job. HTTP health alone is insufficient.
5. **Set explicit stop limits.** Propose five minutes per replacement stage and fifteen minutes for the three-stage rollout, excluding bootstrap and the remaining import runtime. Any missed gate pauses the rollout before another termination. For this job, permit at most one planned ownership transfer during the rollout: from its old owner to a new-generation worker that remains running.

Those timing limits are proposed acceptance targets, not measured capabilities. Page duration, lease timing, queue release semantics and deployment controls are absent from the supplied files.

Before production use, exercise these **unexecuted acceptance scenarios** in a disposable environment:

| Scenario | Required result |
|---|---|
| Long import spans retirement of A/B/C | At most one planned job handoff; unchanged failure count, including when starting at 2; continued durable progress on the new generation. |
| SIGTERM races with polling or an outstanding claim | No new handler starts on a draining worker; late claims are safely released. |
| Termination occurs during a page or around checkpoint persistence | Resume from the last verified checkpoint; final output matches an uninterrupted run with no missing or duplicate logical results. |
| `defer()` succeeds but its response is lost | Reconcile ownership without double release, double failure accounting or concurrent writers. |
| Handler stalls, checkpoint storage fails, or release times out | Shutdown remains bounded; the next pod is not terminated; no unsafe release or checkpoint advancement occurs. |
| Forced kill or lease expiry | Recovery preserves durable progress and rejects stale-owner writes; any genuine failure increment is observable. |
| Malformed input | Exactly three genuine failures lead to dead-lettering; drain handling cannot create unlimited retries. |
| Mixed versions, cold replacement or rollback | Checkpoint compatibility and useful throughput hold; inability to meet a gate pauses rollout. |

For the already dead-lettered import, first verify that its three failures were deployment cancellations. Then use the queue’s supported recovery procedure to requeue that specific job with its original `job_id` and durable checkpoint, correcting its retry budget only through an explicit, audited operation. Do not globally increase the limit.

Assign a rollout owner and a receiving on-call owner. Their handoff record should contain the candidate version, admission rules, job ID, last verified checkpoint, failure count, current owner/generation, release confirmation, observed progress and any paused stage. The receiving owner should acknowledge responsibility through final import completion and output reconciliation; rollout completion alone does not establish job recovery. Resume an interrupted rollout from observed queue and deployment state, preserving any worker still owning the job.

This review used only the supplied local files and the installed skill. No files were changed, no external services were contacted, and no runtime checks were executed.
