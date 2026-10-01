# Historical currency enrichment proposal

Review only; no broker, database, or streaming engine is installed here.

A continuously maintained reporting projection joins transaction facts with
currency rates. A fact must use the dimension effective at the fact's event
time. Accepted retroactive dimension corrections revise the projection; these
are reporting rows, not a request to send payments or invoices again. A
withdrawn historical rate must make affected reporting rows visibly unmatched.
Later current rates must not fill a missing historical match. Fact duplicates
contribute once. The requested result is keyed by fact ID.

Facts may arrive 24 hours after occurrence; source recovery may replay 48 hours.
Historical rates can be corrected/withdrawn during that recovery horizon. A
rate version remains effective until the next effective-time version; retention
must preserve the version covering the oldest admissible fact, as well as newer
changes. Overlapping effective intervals are invalid and require reconciliation.

All timestamps below are on 2026-10-01 UTC; EUR amounts convert to USD.

| Arrival | Dimension change | Effective time | Rate |
|---|---|---|---:|
| 09:00 | r1 revision 1 | 09:00 | 1.10 |
| 10:00 | r2 revision 1 | 10:00 | 1.20 |
| 10:10 | r1 revision 2, complete correction | 09:00 | 1.15 |
| 10:15 | r1 revision 3, withdraw its historical interval | 09:00 | absent |

Fact f1 has event time 09:30, currency EUR, and amount 100. It first arrives at
10:05 and is replayed unchanged at 10:06 under a new delivery identity.

Proposed design keeps only the latest rate per currency and joins on currency
when a fact arrives. It appends a result without a fact key. It assumes that
later dimension changes require no output operation. The engineer proposes a
ten-minute processing-time TTL for fact and dimension state because visible
results are small, and says the source checkpoint makes the multi-input join
transactionally consistent.

Provide the result and output-change contract over this schedule. State the
needed history, identity, missing-match, and sink semantics. Do not expand the
review into selecting a new broker or performing a migration.
