---
schema_version: 1
name: tal-worker-rollout
description: Prepare or implement a worker rollout that preserves accepted work, bounded shutdown, compatible continuation, and observable recovery.
agents:
  - tal-consistency
  - tal-durability
  - tal-failure-testing
  - tal-go
  - tal-idempotency
  - tal-infrastructure
  - tal-python
  - tal-reliability
  - tal-typescript
skills:
  - temporal-reliability
  - temporal-safe-deployments
---

# Safe worker rollout

Use when deployment, scale-down, or maintenance can interrupt accepted work.
The main session follows the [handoff guide](../_shared/handoff.md) and preserves
the requested review, planning, or implementation mode. Planning a rollout does
not by itself authorize execution in a live environment.

1. **Trace one work unit.** Collect the worker/runtime and deployment versions,
   queue or scheduler policy, admission/claim code, progress and effect records,
   ownership generations, independent counters/deadlines, and old/new format
   compatibility. State the target environment and action already authorized.
   For Temporal Workers, the coordinator loads `temporal-safe-deployments` when
   Workflow replay, Worker version/routing, or existing-execution compatibility
   is affected, and `temporal-reliability` when Activity effects, retries,
   cancellation, or uncertain outcomes are affected. Pass the relevant runtime
   conclusions to the owner; other runtimes keep this general path without
   loading those skill bodies.
   Assign `tal-durability` the continuation question and `tal-infrastructure`
   the platform-change question only when those distinct questions are needed.
   This step ends with an explicit finish-or-resume outcome for each affected
   work class and a bounded response to deadline expiry.
2. **Assign the change.** Use one owner for overlapping worker and deployment
   files: the main session, `tal-infrastructure`, or a matching language role.
   Disjoint code/configuration owners need an agreed interface and explicit
   paths. Add `tal-idempotency` for uncertain effects, `tal-consistency` for stale
   ownership, and `tal-reliability` for user-visible operating/stop signals only
   when those risks remain material.
3. **Prepare and demonstrate the transition.** Have the owner implement or write
   the requested procedure using the selected specialists' findings. Include the
   authoritative admission transition, compatible successor, bounded drain,
   observable continuation, and recovery action. If old work outlives rollout
   completion, identify the accountable operational drain/retirement role,
   deadline and escalation, and evidence required to release old dependencies.
   Distinguish this responsibility from per-job execution ownership. If the
   actual assignment is unknown, propose a role and keep retirement blocked
   pending assignment; do not invent personnel or require an additional agent.
   Use `tal-failure-testing` for a separable verification question. Exercise
   relevant repeated retirements,
   claims already in flight, uncertain checkpoint/effect, stale owner, and forced
   deadline paths. Keep maintenance and business-failure expectations tied to
   the actual queue contract; label simulations and real-platform checks.
   For shutdown-code changes, observe signal delivery, reserved/active ownership
   after the gate closes, and cleanup after cancellation. Test the required
   old/new readers and writers against the same checkpoint semantics; successful
   decoding or a healthy replacement alone does not close that question.
4. **Review before acceptance or execution.** Freeze the code/configuration and
   procedure for independent durability or infrastructure review. Return
   findings to the owner and rerun affected checks. A plan is complete when
   compatibility, observation, stop, and feasible recovery conditions are
   reviewable. An authorized execution additionally needs observed work outcomes
   and the environment's actual stop conditions to remain satisfied.
   For a review-only assignment, first assemble the complete recommendation,
   publish it as a visible draft message with a revision label, and pass that
   identical full text and source/evidence identities to an independent reviewer.
   The review must identify that draft and assess its release decision,
   procedure, stop/recovery rules and evidence limits. Reviewing only the input
   files does not review the owner's conclusion. Keep the draft and review
   observable in the conversation when file changes are forbidden. The reviewer
   returns the draft identity and findings in a visible message. Return material
   corrections for re-review; publish only the reviewed conclusion. If the host
   cannot expose this chain, keep final-review evidence unresolved.

A narrow shutdown fix takes one owner and focused review. Stop dependent rollout
when durable continuation is unproven, successor capacity/compatibility is
missing, a stop signal fires, or the next environment action lacks authorization.
Preserve useful completed work and report remaining validation. Return job
outcomes, counter/progress evidence, candidate, review, and the exact environment
surface exercised. When work outlives rollout completion, also return the
operational retirement assignment, deadline/escalation, and release evidence or
remaining gaps. A readiness setting or process exit alone does not establish
that accepted work survived.

For an implementation, acceptance evidence should identify the initial and final
logical job, completed effects, checkpoint progress, ownership epochs, and each
counter/deadline layer. Show the harmful schedule fails without the repair and
the intended schedule completes or reaches its specified recovery decision.
Report surviving owned processes, sockets and datastore sessions after cleanup.
For planning, return these as proposed checks with their remaining evidence gaps.

## Native invocation

Codex: `$tal-worker-rollout Prepare the next rollout of these resumable workers;
verify local handoff behavior and produce the bounded rollout procedure.`

Claude: `/tal-worker-rollout Prepare the next rollout of these resumable workers;
verify local handoff behavior and produce the bounded rollout procedure.`
