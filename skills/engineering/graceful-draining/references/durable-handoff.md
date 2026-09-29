# Durable handoff and retry accounting

Use for long-running stateful work, interrupted jobs, broker redelivery, or
ownership transfer. Build on the engine's existing durable primitives; introduce
only the state needed to establish the requested guarantee.

## Job, owner, and deployment

Separate the logical job from its temporary executor. Identify the job ID, input
and checkpoint schema, checkpoint revision, owner and ownership epoch, eligible
worker generation, durable outcome, and logical deadline. Keep the representation
native to the application's datastore or workflow engine.

The A → B → C failure needs a deployment-level admission decision. Before A
releases work, exclude the retiring generation from the authoritative claim
operation and prepare compatible new capacity. A local draining flag stops only
that process. Recheck eligibility atomically with claims, or establish an
equivalent engine guarantee. Explain how claims racing with the transition are
either completed by retained owners or included in the drain inventory.

When the broker has no generation-aware claim primitive, use a rollout protocol
that stops the retiring consumer set and settles in-flight receives before
releasing deliveries. Prove that exclusion through the available consumer and
rollout controls; an application-side rejection after receive may already have
spent a broker delivery attempt. Do not assume a broker supports an eligibility
filter merely because the application records a generation.

## Checkpoint boundaries

A progress percentage is not a recovery record. A checkpoint must identify the
last reproducible step, committed input/output positions, completed effect
identities, and any outcome awaiting reconciliation. State what can be replayed
after its publication and whether an older binary can read the new format.

Bind recovery to an immutable input manifest, snapshot, or documented cutoff and
replay policy. Record the code/configuration and historical lookup versions that
affect the result; a saved cursor over changing pages can skip, duplicate, or
reinterpret work. Keep required inputs available through the recovery horizon.
Holding one database transaction open for the entire job is not a default repair.

Restore a representative checkpoint in an isolated context and verify its
integrity, input identity, and resulting progress before relying on it for
handoff. Check output/configuration revisions at publication where stale results
must be rejected. A readable checkpoint format alone does not establish a valid
recovery point.

When one datastore owns work state and the business effect, commit their updates
atomically. When a provider owns the effect, keep the same operation identity
across attempts and use its actual deduplication or lookup contract. Crash after
provider success but before local persistence leaves an unknown outcome until
durable evidence resolves it. Resume from that boundary without skipping or
blindly duplicating the effect.

Verify that deduplication and effect-ledger retention cover the latest permitted
duplicate delivery, resume, or redrive. A successful acknowledgment alone is not
permission to discard that record; use the broker's actual delivery contract.
Outside the retention window, reconcile durable outcome evidence before
replaying an effect; a stable key can become a new request after its provider
forgets it. [Stripe's retention contract](https://docs.stripe.com/api/idempotent_requests)
is one concrete example; inspect the actual provider's contract.

Commit terminal completion before acknowledging the last delivery. For
continuation, prove the recoverable next step exists before discarding the only
delivery that can start it. If progress and message publication cannot be atomic,
use a durable outbox or existing claim ledger plus reconciliation. Verify both
"continuation published, acknowledgment lost" and "checkpoint stored,
publication interrupted". Repeated delivery of a continuation retains the same
logical job and effect identities.

## Ownership and late cleanup

Acquire an owner atomically and associate a monotonically increasing epoch with
each transfer. Checkpoint and final-state writes must compare the expected epoch.
Release or cleanup must compare it too: an old worker's `finally` block must not
clear its successor's claim.

Require the resource being protected to reject stale epochs when exclusivity is
necessary. Lease expiry, pod disappearance, and a pre-call ownership check do not
prove the old executor has stopped. If an external resource cannot fence writes,
identify the actual substitute: stable idempotency keys, an atomic uniqueness
rule, or a reconciliation protocol. Name the remaining guarantee when no such
mechanism exists; waiting out a lease does not manufacture exactly-once effects.

For retained old workers, keep code, configuration, credentials, and compatible
dependencies available until their owned and reserved jobs reach durable terminal
state. For resumed jobs, verify successor restoration and rejection of old-owner
writes. A rollout's replica count is insufficient retirement evidence.

## Budgets and recovery

Classify outcomes from evidence: verified planned interruption, business failure,
poison input, cancellation, infrastructure loss, and unknown effect. Preserve the
business-failure budget across a proven safe continuation while recording the
interruption separately. A kill signal alone does not establish that
classification, and a checkpoint is not a successful final result.

Inspect each independently enforced limit. An application flag cannot change a
broker's delivery counter or a controller's backoff policy. Specify which layer
owns the logical job decision, how delivery exhaustion becomes recoverable, and
how duplicate continuation messages are recognized. Preserve finite job
deadlines, progress-stall limits, and an actionable escalation state so recurring
interruptions do not create an endless retry loop.

Measure a process-local drain budget with the runtime's monotonic elapsed-time
clock, accounting for hook time already consumed. Persist business deadlines
using a documented shared time authority; another host cannot restore a raw
process-local monotonic timestamp. Test wall-clock jumps if deadline decisions
depend on them, and preserve the platform's own hard termination limit.

For already failed jobs, reconcile external effects, locate the last valid
checkpoint, establish current ownership, and verify a compatible successor
before authorized resume or redrive. Reuse the logical identity and record the
recovery action. If neither retained execution nor durable restoration is
possible, state the unsupported recovery window explicitly.

Trace job ID, deployment generation, ownership epoch, checkpoint revision,
interruption reason, and counter layer in logs or traces. Aggregate alerts for
unfinished-job age, time since progress, deadline misses, fencing rejections, and
budget divergence; avoid job IDs as unbounded metric labels.
