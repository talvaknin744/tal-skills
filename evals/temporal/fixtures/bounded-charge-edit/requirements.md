# Invoice charge adapter

This function is called by a Temporal Activity. An invoice contains immutable
tenantId, invoiceId, amountCents, and currency. The tenant/invoice pair names a
single business charge across Activity retries and Workflow runs. Distinct
tenant/invoice pairs must use distinct identities. The IDs are UUID strings.

LedgerPay.charge(payload, { idempotencyKey }) atomically accepts the first
charge for a key, retaining the result for seven days. Repeating the same key
and payload returns the original receipt; changed payload is rejected.
A transport error can occur after acceptance. Our retry horizon is 24 hours.
Use the namespace invoice-charge:<tenantId>:<invoiceId>.

The adapter passes the receipt to audit.record(invoice, receipt), then returns
it. audit.record is safe to repeat, may fail after provider acceptance, and
must never run when no receipt was returned. A thrown error must remain
observable to the Activity retry policy.

Limit implementation changes to charge.mjs and relevant local verification.
Use Node built-ins only; no package installs or external calls. Dependencies
are injected for local checks. Temporal infrastructure is outside this task.
