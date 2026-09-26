# Payout incident

Our API persists a payout operation with a client key, then calls WireDesk's
legacy payout endpoint. WireDesk immediately executes accepted payouts. This
endpoint has no idempotency parameter, no caller reference field, and no lookup
API. We cannot change providers this quarter. Operations staff can request a
daily settlement file and investigate manually.

Timeline for operation op-204:

- 11:42:00: local record becomes `processing`.
- 11:42:01: request reaches WireDesk; local socket times out before any reply.
- 11:42:03: handler records `failed_retryable` and returns 503.
- 11:43:00: client repeats the same request and key.

The local trace cannot tell whether WireDesk accepted the first request.
Product asks for automatic retry until success and claims that keeping the
client key in our database makes every retry safe. The local record is not
atomically committed with the external payout. Losing or duplicating money is
unacceptable; explicit unresolved operations can be reviewed by staff.
