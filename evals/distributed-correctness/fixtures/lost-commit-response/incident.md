# Debit retry after connection loss

The client supplied immutable business request `pay-804`: debit account A by
25 units. Requests may be delivered repeatedly with the same ID and payload.
The account initially held 100 units. The API must return the same durable
outcome for repeated deliveries, reject reuse of an ID with a different intent,
and apply one debit for this obligation.

The account database supports local transactions covering `accounts`, `debits`,
and `outcomes`. `outcomes.request_id` is unique. It can store the accepted
payload and result together with the debit in one transaction. A leader read
can look up that outcome by request ID. The database retains these outcomes
for longer than the documented request replay period. A competing insert with
the same request ID may wait for the original transaction, then observe its
commit or abort. No external payment provider participates.

Observed trace:

```text
10:00:00.001 request pay-804 begins transaction, debit_id=random-11
10:00:00.010 database commits debit 25 and balance=75
10:00:00.011 network drops the COMMIT response
10:00:00.200 driver raises ConnectionLost; transaction outcome is unknown
10:00:00.205 retry begins transaction, debit_id=random-12
10:00:00.214 database commits debit 25 and balance=50
```

The driver separately reports `SerializationFailure` only when the database
has confirmed that the transaction aborted. A `ConnectionLost` or timeout at
COMMIT has no such guarantee. The connection can remain unavailable beyond the
request's two-second deadline. A pending/unknown outcome with a request ID is
acceptable when success cannot yet be established. The current implementation
never writes the `outcomes` table. The team proposes increasing attempts from
three to five to reduce errors returned during deployments.
