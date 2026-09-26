# Receipt dispatch

Checkout writes both the order and an outbox row in one database transaction.
Each outbox row has a stable, globally unique `event_id` and immutable payload.
A relay retries unsent rows. It can crash at any instruction, and a failed
worker may resume after another worker picks up the same row.

MailPort's supplied contract: `send(payload, {idempotencyKey})` atomically
deduplicates concurrent and sequential requests using a key for seven days.
The same key with the same payload returns the original acceptance result;
the same key with a different payload is rejected. A repeated accepted request
does not create another email. The guarantee covers provider acceptance, not
inbox delivery. We retry for at most 48 hours. Provider deduplication is scoped
to our account, so separate message kinds need distinct identity namespaces.
