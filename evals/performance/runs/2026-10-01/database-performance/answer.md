# Database latency assessment

The leading cause is account-row contention amplified by long connection ownership. During the incident, endpoint sessions wait on PostgreSQL `Lock` / `transactionid`; the observed blocker updates an account and keeps its transaction open for roughly three seconds while awaiting an external provider. Requests updating that account must wait for the transaction to finish, and those waiting transactions can occupy pool connections. The sampled two-second acquisition p99 is evidence of an additional client-side queue. It is consistent with this mechanism, but the samples do not establish how much of the endpoint's five-second p99 each boundary contributes; their p99 values cannot simply be added.

The 18 ms isolated `EXPLAIN ANALYZE` result establishes that one query on representative data can execute quickly using an existing index. It does not measure incident lock contention, acquisition, provider time, network/result delivery, or endpoint completion. Cumulative query statistics without incident-window deltas cannot establish the incident's aggregate query cost or parameter-specific tails.

## Proposed index and pool change

Do not adopt the combined proposal on the supplied evidence. No query shape, index definition, slow incident plan, selectivity problem, or buffer/spill evidence justifies another index. Another index would add storage, write/WAL and maintenance cost, plus build/rollout interference, without a demonstrated way to remove the observed account lock. If a separate expensive query emerges from interval measurements, assess its candidate index independently with representative parameters and concurrent writes.

Keep the application's current cap of 20 while investigating. Doubling every application's pool can admit more transactions that wait on the same account and move the queue into PostgreSQL. Fleet reservations, service/instance counts, pooler configuration and database headroom are unknown, so a safe shared connection budget has not been established.

## First bounded intervention

Target the observed blocking transaction's lifetime. Inspect the endpoint's exact transaction sequence and provider semantics, then move any independent provider preparation/network wait before borrowing the connection and before beginning the account transaction. Keep the dependent balance read/check/update and commit within the existing enforcing transaction boundary. After the provider work, re-read and validate current account state under the required locking/isolation before applying the update; preserve tenant predicates, affected-row expectations and the balance invariant.

This is a conditional intervention, not approval to move an arbitrary provider side effect. The evidence does not say whether the provider result depends on locked account state, whether the provider action is irreversible, or how retries and uncertain outcomes are handled. If the provider action must be coordinated with the balance mutation, a naive move outside the transaction is unsafe. Establish that contract first; a durable reservation/pending state and idempotent completion protocol may be needed, and that is a separate design change. Do not split dependent account operations merely to release the lock. Use one endpoint/cohort for the lifetime change and retain an immediate way to restore its current sequence.

## Validation evidence and acceptance criteria

Capture an aligned baseline interval under the affected workload. Correlate endpoint traces with pool acquisition, connection hold time, transaction/lock duration, provider wait, server execution and result consumption. Record PostgreSQL 18 minor version, driver/pool versions, pooler mode if present, fleet reservations, actual queries/binds, tenant/account skew, isolation and cancellation behavior. Sample `pg_stat_activity`, blocker relationships and transaction ages while requests are queued. Difference `pg_stat_statements` counters across the same interval, recording reset boundaries and collection settings; unavailable timing is unknown, not zero.

Compare the current and proposed sequence on the same engine with matched data, account skew, provider delays, concurrency and write mix. Include a hot-account case, ordinary independent accounts, provider failure/timeout, cancellation and retries. A successful lifetime change must:

- Remove the roughly three-second provider wait from the open account transaction and reduce lock/connection hold time in the targeted path.
- Improve client p99 and pool-acquisition tails at equal offered load, with useful successful throughput at least maintained. The numerical latency objective beyond the incident's current five-second p99 still needs agreement.
- Reduce transaction-ID waits/blocker chains without shifting the bottleneck into errors, timeouts or another queue, and remain within the documented fleet connection/resource budget.
- Preserve balance invariants under concurrent same-account updates, transaction atomicity and the provider/retry contract. Verify cancellation actually ends or cleans up the transaction, releases its connection, and permits a fresh operation through the same bounded pool; a caller timeout alone is insufficient.

For a later index candidate, compare representative plans, estimated versus actual rows, loops, buffers and spills, and end-to-end outcomes under concurrent writes. Measure index size, write/WAL cost and build/maintenance interference, with explicit rollout and recovery checks. `EXPLAIN ANALYZE` executes the statement and is not authorized by this read-only review; use an appropriate approved disposable target for future execution.

Only the supplied incident and skill guidance were read. The project contains no endpoint code, index DDL, raw traces, database connection or runnable workload. No database commands, index builds, pool changes or performance experiments were executed, so this is a supported diagnosis and proposed validation plan, not a measured fix.
