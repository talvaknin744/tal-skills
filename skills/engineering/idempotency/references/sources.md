# Sources and applicability

Read primary material when a task depends on its specific contract. These links are reference entry points, not requirements to research every source on every run. The skill uses no particular provider by default.

| Source | Use when |
|---|---|
| [AWS: Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) | Defining caller intent, operation tokens, late retries, and downstream retry boundaries |
| [RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) | Distinguishing idempotent effects from identical responses |
| [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html) | Evaluating JSON canonicalization and representation limits |
| [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) | Integrating Stripe's saved-result, parameter-check, and key-retention behavior |
| [Stripe low-level errors](https://docs.stripe.com/error-low-level) | Distinguishing safe network retries from indeterminate server outcomes |
| [AWS transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) | Coupling a local write with durable event publication intent |
| [SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html) | Assessing consumer redelivery and in-flight work |
| [Kleppmann: distributed locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html) | Testing assumptions about expired owners and resource-side fencing |
| [OWASP object-level authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/) | Checking access to remembered operations and replayed objects |
| [RFC 8470 §5.2](https://www.rfc-editor.org/rfc/rfc8470.html#section-5.2) | Considering HTTP 425 and its early-data meaning |

API error codes, retention periods, SDK retries, and deduplication scope vary. Verify the actual provider and version at implementation time. A proposal for an HTTP header is not automatically a published standard; distinguish drafts, recommendations, and the contract the application implements.
