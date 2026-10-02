Updated [service.py](../final-project/service.py) to capture each cache miss as one authoritative record and publish it through the cache’s atomic version check. A delayed fill can now return its captured value to an overlapping read without replacing a newer cached record, including after JSON restoration.

`python3 -B verify.py` passed **6/6 checks**. Before the edit, it passed 2/6.

| Boundary | Observed result and limit |
|---|---|
| Source and adapter | The local snapshot keeps payload and token together. Replica freshness was not exercised; a replica deployment would need its own lag test. |
| Notification and recovery | Confirmed change notifications were exercised. Missing notifications are outside the contract. |
| Ordering metadata | Eviction and JSON restoration retain the floor and reject a stale fill. Metadata destruction and crash durability were not tested. |
| Topology | Paused reads and changes were exercised across threads in one process. Multiple processes or hosts were not tested. |
