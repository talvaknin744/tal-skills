# Shipping address preview

The account service owns one versioned profile record per account. A successful
write returns the complete committed record and its monotonically increasing
`revision`. The store's leader serves committed reads. Followers lag by an
unbounded amount during a partition; measured healthy p95 lag is 80 ms.
Each follower reports the revision of the returned account record.

The browser saves an address through account-service, then calls quote-service
to preview shipping. These services have separate connection pools, and
quote-service maintains a cache. This is an observed trace for account 42:

| Time | Observation |
| --- | --- |
| 10:00:00.000 | Browser starts save(address=B) |
| 10:00:00.030 | Leader commits revision 81; response includes revision 81 |
| 10:00:00.050 | Browser calls quote-service preview(account=42), omitting revision |
| 10:00:00.055 | Quote cache returns address A, revision 79 |
| 10:00:00.060 | Follower would have returned address A, revision 80 |
| 10:00:00.160 | Healthy follower catches up to revision 81 |

The proposed fix sleeps 100 ms after every successful save. A second proposal
pins the account-service connection to the leader but leaves quote-service's
cache and follower reads unchanged. No process has a shared database session.

After this caller receives a successful save, its later successful preview must
use revision 81 or newer. A later unrelated user's write may supersede it.
Other callers without such a dependency accept up to two seconds of cache age.
The preview latency budget is 200 ms; an explicit pending/retry response is
acceptable when freshness cannot be established. Silent substitution of an old
address is not acceptable. Under partition the leader can be unavailable to
quote-service. No distributed transaction is required to generate a preview;
placing an order is a separate operation outside this review.
