# Recovery and waits

Read for sagas, partial completion, external callbacks, human decisions, or cancellation.

## Compensation is application behavior

For each forward effect, name the recovery: retry forward, compensate, reconcile, or escalate. Define compensation as a new business action with its own identity and observable result; it is not a database rollback. Some effects are irreversible, and concurrent changes must survive recovery.

Where an effect can commit before its acknowledgment arrives, register its compensation before invoking the effect. Make that compensation safe when the forward action never happened and safe when repeated. Carry the intended resource identity even when no success response is available. Establish the actual outcome before a recovery that would be wrong for the unresolved state.

Prevent a delayed forward attempt from committing after compensation: fence it at the resource or reconcile a provider-supported operation lifecycle that establishes whether it can still commit. Cancellation alone supplies no such guarantee.

Order compensations by resource dependencies; reverse order is a useful default, while parallel recovery requires independence. Record each failure and remaining obligation. A caught exception or log line is not evidence that consistency was restored.

Use the SDK's supported cancellation shielding for necessary cleanup. Define whether recovery completes in the current Workflow or a separately durable process. Hard termination and execution timeout cannot be relied upon to run Workflow cleanup code; keep an external reconciliation path for abandoned obligations.

## Durable waits

Express waiting as Workflow state plus SDK timers or condition waits. Keep an authoritative deadline and the prerequisite that permits the next effect. For example, collection depends on confirmed notification and the required delay, not merely scheduling both jobs. Derive business timing from the project's current rules; a customer's published numbers are not reusable requirements.

For callbacks or approvals, correlate the event to the entity, operation, and current phase; authorize it at ingress and deduplicate its business event ID. Define handling for an event that arrives early, twice, out of order, after expiry, or after cancellation. Make the transition and its next action unambiguous when timer and callback become ready together.

Use Signals for asynchronous input, Updates when callers need a tracked result, and Queries for observing state. A Signal acknowledgment means acceptance, not completion of its business action. Before finishing or continuing as new, preserve required state and complete or explicitly account for outstanding handlers. Use SDK synchronization when handlers can interleave across awaits.

## Cancellation and validation

Specify the user's meaning of cancel: stop future work, request remote cancellation, compensate completed work, or a combination. Regular Activities receive server cancellation through heartbeats; verify the chosen SDK's cancellation and cleanup behavior. TRY_CANCEL may let compensation overlap a running Activity. Even waiting for cancellation completion can end in timeout; inspect the external resource outcome before declaring recovery complete.

Test cancellation before an effect, after acceptance but before acknowledgment, during a durable wait, and while compensation runs when those phases are in scope. Include expiry racing a valid callback and a repeated compensation request. Assert both final resource state and any durable unresolved obligation.

Evidence: [compensation ordering](https://temporal.io/blog/compensating-actions-part-of-a-complete-breakfast-with-sagas), [Activity cancellation](https://docs.temporal.io/activity-execution), [termination](https://docs.temporal.io/encyclopedia/workflow/cancellation-and-termination), [message types](https://docs.temporal.io/encyclopedia/workflow-message-passing), and TypeScript examples for [cleanup](https://docs.temporal.io/develop/typescript/workflows/cancellation), [timers](https://docs.temporal.io/develop/typescript/workflows/timers), and [handler concurrency](https://docs.temporal.io/develop/typescript/workflows/message-passing). Resolve language-specific APIs against the installed SDK.
