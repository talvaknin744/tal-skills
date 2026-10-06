# Narrow dispatch fix

This fixture is a delivery adapter inside an existing system. A committed
outbox supplies each event with an immutable `id`, `kind`, and `payload`.
Retries and concurrent workers can call this function with the same event.
The outbox event ID is globally unique and the payload never changes for an ID.
Do not redesign the caller, outbox schema, scheduling, or authentication.

WebhookBridge's supplied API is `post(payload, {idempotencyKey})`. Its verified
contract atomically deduplicates acceptance for seven days, including concurrent
calls, and returns the original receipt for matching repeated payloads. A
payload mismatch is rejected. Retry retention here is 24 hours. Other producers
use the same provider account, so use the `audit-webhook` namespace for this
adapter. The provider permits colon-separated keys up to 200 ASCII characters;
event IDs are UUIDs. Marking dispatched is safe to repeat for the same receipt.
There are no installed dependencies; Node's standard library is available.
