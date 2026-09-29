# Inventory reservation race

Checkout and the mobile API call `reserve.pseudo` in separate processes. The
inventory table's primary key is `sku`; `available` is an integer. Both callers
reserve one unit and append an accepted reservation in the same local database
transaction. There are no triggers or checks beyond `available >= 0`.

At 14:00 the primary has one remaining unit. Replica R is 400 ms behind. The
incident trace records:

| Time | Checkout | Mobile |
| --- | --- | --- |
| 14:00:00.001 | Reads available=1 | |
| 14:00:00.002 | | Reads available=1 |
| 14:00:00.010 | Writes available=0, reservation X, commits | |
| 14:00:00.020 | | Writes available=0, reservation Y, commits |

Operations found two accepted reservations and zero available units. The
proposed patch changes both `readPool` connections from the replica to the
primary. PostgreSQL uses Read Committed. Each service has its own process-local
mutex, and neither process shares a lock with the other. A request may be retried
after a lost response; request IDs remain stable across that retry.

The required result is at most one accepted reservation from a stock of one,
with rejection distinguishable from accepted-but-response-lost. The application
may retry a transaction conflict within its request deadline. No distributed
cache or message broker participates in this transaction.
