# Archived payment replay

This is synthetic local evidence for a review. No broker, registry or network
service is available. The replay owner wants to copy retained Kafka value bytes
unchanged from wholesale payments into a target cluster. Consumer effects are
still paused. The replay must preserve the payment's original currency and amount,
and must not change the target retail registry's existing schemas or effects.

The source application interprets PaymentCents.amount as USD cents. The retail
application interprets PaymentDollars.amount as whole USD. Both records have the
same primitive field order. The supplied lookup captures decode the saved value
without an exception in both cases. The source business ledger records a 1.00 USD
payment, not a 100.00 USD payment.

An operator proposes using the target retail consumer unchanged because schema
ID 7 exists, the latest retail compatibility check is green and its decoder
accepts the bytes. An alternate proposal points the replay client to the imported
wholesale context, where the schema inventory was copied. Actual decoding through
that alternate client route has not been attempted.

The configured Java client's version and observed requests are supplied. A Rust
reporting client is also slated to resume, but its package version, context
configuration and schema lookup path have not been recorded. The owner assumes
it will inherit Java's lookup behavior.

Current Confluent context guidance scopes IDs and subjects to a context and
supports an explicit context base path. Client lookup behavior remains a deployed
client question. The source documents are [contexts](https://docs.confluent.io/platform/current/schema-registry/schema-contexts-cp.html)
and [client FAQ](https://docs.confluent.io/platform/current/schema-registry/faqs-cp.html).
These are documentary context, not executed checks or proof for the unspecified
Rust client. The supplied wire envelope contains the numeric ID, not a registry
host or context name.
