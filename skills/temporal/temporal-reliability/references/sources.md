# Sources and interpretation

## Use when

Use these sources when choosing a retry, timeout, idempotency, compensation, wait, or cancellation contract. Verify provider guarantees with the provider and SDK behavior with current official docs; customer stories motivate checks but do not prove exactly-once effects.

Reviewed 2026-09-29. Instructions are an original engineering synthesis. Customer stories identify failure modes worth investigating; official documentation establishes Temporal behavior. Recheck version-sensitive APIs and external-provider contracts when implementing. This skill complements the official Temporal development and design skills with a focused business-effect review.

## Official mechanics

- [Activity definition](https://docs.temporal.io/activity-definition): repeated execution, recorded completion, and provider-enforced idempotency.
- [Activity execution](https://docs.temporal.io/activity-execution): cancellation delivery and execution lifecycle.
- [Workflow and Run IDs](https://docs.temporal.io/workflow-execution/workflowid-runid): identity scope across executions.
- [Detecting Activity failures](https://docs.temporal.io/encyclopedia/detecting-activity-failures): timeout scope and heartbeat progress.
- [Retry policies](https://docs.temporal.io/encyclopedia/retry-policies): Activity and Workflow retry distinctions.
- [Saga compensation](https://temporal.io/blog/compensating-actions-part-of-a-complete-breakfast-with-sagas): registration before a possibly unacknowledged effect; application-defined recovery.
- [Workflow messages](https://docs.temporal.io/encyclopedia/workflow-message-passing): Signal, Update, and Query contracts.
- [Cancellation and termination](https://docs.temporal.io/encyclopedia/workflow/cancellation-and-termination): cleanup limitations.
- TypeScript guides for [cancellation](https://docs.temporal.io/develop/typescript/workflows/cancellation), [timers](https://docs.temporal.io/develop/typescript/workflows/timers), and [message handlers](https://docs.temporal.io/develop/typescript/workflows/message-passing): illustrative SDK behavior, not universal syntax.

## Customer evidence

Each inference below is a proposed review practice, not a claim about undisclosed customer implementation. Talk entries were read as published abstracts; the videos were not watched.

| Source | Published observation | Engineering inference |
| --- | --- | --- |
| [ShareChat](https://temporal.io/resources/case-studies/sharechat) | Ordered notification and collection replaced independent jobs. | Validate prerequisites, deadlines, and each billing cycle's identity. |
| [Mews](https://temporal.io/resources/case-studies/mews) | Refunds await settlement or a cutoff; Signals coordinate disputes. | Bound recovery and accept callbacks only in valid states. |
| [Vodafone](https://temporal.io/resources/case-studies/how-vodafone-aims-to-orchestrate-value-added-services-across-devices) | Device orchestration faces delayed responses and competing controllers. | Test stale owners at the resource boundary. |
| [Mollie](https://temporal.io/resources/case-studies/mollie-payments-maximizes-operational-efficiency) | Months-long verification processes use timers; the team cautions against overuse. | Make wait state observable and preserve simpler sufficient designs. |
| [Turo talk abstract](https://temporal.io/resources/on-demand/driving-innovation-deferred-payments-turo) | Deferred rental payments require correct timing. | Exercise cancellation and rescheduling before delayed effects. |
| [Block talk abstract](https://temporal.io/resources/on-demand/block-real-world-payments) | Describes checkout Updates, child patterns, and asynchronous compensation. | Define completion and recovery ownership explicitly. |
| [ANZ](https://temporal.io/resources/case-studies/anz-story) | Loan origination combines human work and compensations. | Implement and test recovery; “automatic compensation” is marketing shorthand. |
| [Maersk](https://temporal.io/resources/case-studies/maersk) | Payment, booking, account, and notification steps are orchestrated durably. | Recover the failed dependency without repeating completed business effects. |
| [Snap Engineering](https://eng.snap.com/build_a_reliable_system_in_a_microservices_world_at_snap) | Lost API responses can duplicate costly reporting jobs. | Preserve operation identity at ingress and after ambiguous starts. |
| [SAP Concur](https://temporal.io/resources/case-studies/sap-concur) | Workflows coordinate data, schemas, and configuration across subsystems. | Verify partial completion before cutover or further mutations. |
| [Dapper Labs](https://temporal.io/resources/case-studies/dapperlabs-story) | Payments, reservations, and asynchronous providers require compensation. | Reconcile uncertain payment results before releasing reservations. |

Customer reliability claims do not establish exactly-once external effects, automatic rollback, or eventual success against a permanently failing dependency. Published timing and regulatory claims remain historical context.
