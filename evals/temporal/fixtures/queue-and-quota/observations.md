# Import backlog

An import namespace uses one Task Queue for both Workflow and Activity Tasks.
Every document causes one vendor request Activity. In the last hour:
- Arrival rate: 80 documents/second; task backlog age: 25 minutes.
- Aggregate Activity execution: about 100 simultaneous calls at the 2-second
  mean latency; vendor accepts at most 50 requests/second for this account.
- Vendor 429s: 30% of calls; immediate Activity retries add more attempts.
- Worker CPU: 18%; Workflow Task latency: low; Activity queue latency: high.
- A 429 includes a Retry-After value. Some calls take 20 seconds.
- The account's quota is shared across all our Worker replicas and Task Queues.

A proposal doubles Worker replicas, sets unlimited Activity concurrency, and
retries every error forever with no delay. Operators ask whether this clears
the backlog. We cannot change the vendor quota or drop documents. No live
access or performance harness is available. Review only; keep files unchanged.
