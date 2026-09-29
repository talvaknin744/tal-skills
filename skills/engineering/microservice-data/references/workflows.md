# Durable workflows and sagas

Use this reference for one business operation that changes state owned by multiple services.

## Represent progress

Describe the process as named states and transitions. For each step, identify the owning service, input, local transaction, observable success, business rejection, and evidence needed after an interruption. Carry a stable workflow identity through calls, events, and status records. Persist enough state to recover after the initiating instance disappears.

Separate a domain rejection, such as insufficient available inventory, from a technical failure or unknown outcome. A timeout alone cannot justify either charging again or declaring a completed charge absent. Define how the owner determines what happened before advancing recovery. Broker delivery guarantees do not make the workflow atomic.

## Choose recovery for each step

Forward recovery continues toward the intended result. Backward recovery performs new domain actions that compensate for committed work. Select the appropriate policy per failure and stage; the same workflow can use both.

Compensation must respect current state and concurrent activity. Blindly restoring an old row can erase another operation's work. A refund, reservation release, or cancellation is a new transition, with its own failure and duplicate-handling rules. An email, shipment, or observed event cannot simply be erased. Preserve the relevant history and define an acceptable business resolution for irreversible effects.

Where policy allows, put likely rejection points earlier and effects that are difficult to compensate later. Mark any point after which completion is preferred to cancellation. Define retry limits, failed-compensation visibility, and an actor or reconciliation process for outcomes that cannot be resolved automatically. Durable handoff is part of this model: identify how a committed local change reliably leads to the next message or action.

## Make ownership and isolation explicit

An orchestrator can own process progress without owning participants' domain rules. With choreography, participating services react to events, but operators still need to reconstruct status and identify missing progress. Choose based on real team ownership and operational understanding, rather than treating either style as universally better.

Interleaving workflows can observe partial states. Check reservation, concurrency-control, and validation rules at the service that owns the scarce resource or invariant. A preflight read of another service's data is not a durable reservation. State which actions remain available while a process is pending or compensating.

Exercise the affected success, rejection, uncertain-outcome, restart, and recovery paths. Verify business state and visible process status, not merely which calls were made. Detailed handling of duplicate execution may use `$idempotency` if available; recovery policy and cross-service progress remain this workflow's responsibility.
