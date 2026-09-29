# Coordination and state

## Make approvals specific and durable

Represent a proposal with an operation ID, tenant/resource scope, parameters or their canonical digest, proposal version, expiry, and required authority. The application authenticates the caller and checks permission before submitting a Signal or Update. Bind the recorded decision to that proposal; a field claiming an approver identity is not authentication. A Temporal UI role, Nexus connection, or model recommendation is not application consent for arbitrary tools.

Use the SDK's durable waits and message handlers. Signals deliver input asynchronously; Updates can return a completed handler result or failure. Update acceptance alone is not completion, and a Signal acknowledgement does not prove business validation passed. Define durable states such as pending, approved, expired, cancelled, and executed. Decide the expiry rule and timeout race explicitly, then make the transition deterministic. Reject or record duplicate, stale, wrong-tenant, changed-parameter, and post-cancellation decisions without authorizing new work. [Workflow messages](https://docs.temporal.io/encyclopedia/workflow-message-passing).

Validate approval applicability again before dispatching the effect; check live permissions through the application/Activity boundary if the policy requires it. Any changed proposal needs the applicable authority for those changed parameters. Test approval arriving just before and just after expiry, including after a Worker restart.

## Serialize only shared decisions

Independent extraction or model work can run concurrently with bounded fan-out. For operations reading and mutating the same customer context, choose a defined owner: a serialized decision queue or versioned reads with conditional commits. Revalidate an action against the current context before committing it. A separate Workflow per email does not by itself serialize a customer's decisions.

Within one Workflow, handlers can interleave around awaits. Initialize their state before use and protect read-modify-write sequences with deterministic queues or synchronization supported by the SDK. Account for in-flight handlers before completing or continuing the Workflow. Observe aggregate model/provider demand across workers and child Workflows; a local fan-out limit is only one part of that budget. [Python message handler patterns](https://docs.temporal.io/develop/python/workflows/message-passing).

For child agents, specify result ownership, partial-success policy, cancellation behavior, and parent-close behavior. Retain successful independent results when a sibling fails. Child lifecycles and worker/process resource isolation are separate choices.

## Carry invariants through Continue-As-New

Roll over at a safe checkpoint using APIs available in the installed SDK. Carry pending messages, deduplication identities, current context/version, outstanding approvals, absolute deadlines, and remaining task budgets into the new Run. Preserve unresolved tool-operation identities. Finish handlers or use an explicitly proven handoff before closing the old Run. Test rollout with pending work and a nearly exhausted budget; a fresh history must not grant a fresh allowance. [Continue-As-New](https://docs.temporal.io/develop/python/workflows/continue-as-new).

Bound conversation state itself. If summarization compacts context, treat its model call as a recoverable step and keep the structured facts needed for approvals, effect identities, and accounting outside a lossy summary. A summary cannot recreate authorization or prove an operation completed.

## Keep recovery data available and private

Inspect what enters Workflow inputs, Activity results, messages, failures, logs, traces, and visibility metadata. Those surfaces may capture prompts, documents, tool credentials, or personal data. Store only necessary data and use the project's payload encryption and redaction controls; Search Attributes remain queryable metadata and must exclude sensitive content.

Serialization alone provides no encryption. Keep provider credentials on Workers, use a Payload Codec for protected payloads, and verify Failure Converter handling of plaintext messages and stack traces. Search Attributes bypass that codec and remain unencrypted in Visibility storage. Test the actual serialized failure and history surfaces, not only the application logger. [Payload Codec](https://docs.temporal.io/payload-codec), [Failure Converter](https://docs.temporal.io/failure-converter), [Search Attributes](https://docs.temporal.io/search-attribute).

Use immutable, scoped artifact references for large documents when suitable. Ensure versions, access, retention, and encryption keys remain available for the required recovery period. A presigned URL that expires during a human wait is not a durable artifact identity. Test resume after expiry/key rotation and missing data, with an explicit recovery or terminal state instead of silently substituting different context.
