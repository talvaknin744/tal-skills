**The current consumer ends at account `a`, revision `11`, tier `silver`**, assuming `set_account` overwrites the row and all three transactions succeed.

| Delivery | Account after commit | Audit inserted |
|---|---|---|
| `e12` | revision 12, gold | `e12` |
| `e12` again | revision 12, gold | another `e12` |
| `e11` | revision 11, silver | `e11` |

[consumer.py](/tmp/tal-skill-trials-20260929/07-messaging-reliability-reordered-account-events/workspace/project/consumer.py:3) unconditionally updates and audits every delivery. This allows both duplicate audit effects and regression to older state. If the undisclosed audit schema rejects duplicate IDs, the second transaction could instead fail and remain unacknowledged; uniqueness alone would not fix reordering.

The smallest reliable processing contract is:

1. **Validate before applying.** Require valid identity, account, revision, and tier fields. Treat `(account_id, revision)` as the authoritative snapshot version; `event_id` identifies a publication, not its ordering.
2. **Atomically apply only a strictly newer revision.** Within one database transaction, conditionally insert/update the account and insert one audit **only if that snapshot was applied**. Equal or lower revisions are successful no-ops. Use a concurrency-safe conditional write or locking, including the initially absent account case; an ordinary read followed by a write is insufficient.
3. **Acknowledge after the transaction commits.** On database failure, preserve redelivery. If commit succeeds but the ACK is lost, redelivery sees an equal or newer stored revision and produces no additional audit.
4. **Durably quarantine malformed events, then acknowledge.** A local database quarantine record is sufficient: preserve payload, available identity, and failure reason, with duplicate-safe recording. Permanent validation errors need no repeated processing attempts. If quarantine persistence fails, keep the source recoverable and back off. Give quarantined work a repair/replay owner and monitor its oldest unresolved age.
5. **Retain the account’s revision throughout the supported replay horizon.** Removing that protection can allow an old snapshot to apply again.

Starting from an absent or older account, this contract yields **revision `12`, gold, with exactly one audit for `e12`** for the supplied history. The duplicate `e12` and stale `e11` are acknowledged without effects.

Because these events contain complete snapshots, revision gaps require neither waiting nor buffering. The revision guard also provides the necessary effect deduplication here, so a separate processed-event inbox is unnecessary. The audit already shares the account transaction, so no outbox is needed for that local effect. This guarantees monotonic account state and one audit per applied snapshot under at-least-once delivery.

I reproduced the current result locally and checked an in-memory contract model against reordered deliveries, lost ACKs, and audit rollback. Actual database concurrency and quarantine-failure recovery remain validation steps because no database implementation or broker configuration was supplied. All files remain unchanged; no external services were used.
