# Research and publication

Independent pricing and compliance branches each return findings, evidence
references, and a proposed headline. Branch evidence must remain identifiable.
Branch completion order must not determine the final document.

Publication requires a message from an authorized editor approving the exact
requestId and final document digest. Approval expires ten minutes after its
request is created. The application stores that absolute deadline. Messages
processed at or after the deadline are ineligible, even if they were sent
earlier. A closed or expired decision cannot reopen. Duplicate messages occur.

The runtime offers durable timers and recorded message events. Activity
arguments are serialized; mutating an Activity's local argument does not mutate
Workflow state. Publisher.publish(document, key) deduplicates the same payload
under the same key. A publish response may be lost.

Review the proposed orchestration. No runtime service or SDK packages are
available. Keep both files unchanged.
