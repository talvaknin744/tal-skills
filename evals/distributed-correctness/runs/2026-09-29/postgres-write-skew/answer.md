The incident is PostgreSQL write skew. The invariant is that every ward retains at least one on-call doctor after every committed transaction. Requests for different wards should remain independent, and an aborted request must never produce a successful time-off email. The supplied trace demonstrates a violation of this invariant; this review did not execute it.

Ada and Ben each begin a Repeatable Read transaction and read a snapshot containing both doctors on call. Each sees count = 2 and passes the check. Ada sets only Ada's row to false; Ben sets only Ben's row to false. Their primary-key targets differ, so neither update creates a same-row write conflict. Both commits can succeed under PostgreSQL Repeatable Read, leaving zero on-call doctors. Each transaction's snapshot was internally consistent, but the combined read-check-write decisions were not serializable. The authoritative state is the PostgreSQL coverage table; a primary read alone cannot make this multi-statement decision atomic.

Both proposed fixes need qualification:

- Locking only the requesting doctor's row with `FOR UPDATE` does not fix the race. Ada and Ben acquire different locks and can still both count two. The invariant is scoped to the ward, not to an individual doctor's row.
- Serializable can protect this invariant if the complete decision and mutation run in Serializable transactions and every relevant writer follows the protocol. PostgreSQL can abort a conflicting transaction with SQLSTATE `40001`, possibly during a statement or at commit. The existing retry code is invalid: reconnecting and issuing `COMMIT` cannot recover an aborted transaction or replay its reads and writes. A new connection has no original transaction to commit. Furthermore, an email already sent before the failed commit cannot be rolled back. Serializable therefore requires whole-transaction retries and moving email publication behind the commit boundary.

I recommend a shared ward-row lock with **Read Committed** for this path. The existing `wards(ward PRIMARY KEY)` table provides the lock target without an extension. Use the same database connection for the entire transaction:

```sql
BEGIN ISOLATION LEVEL READ COMMITTED;

SELECT ward FROM wards WHERE ward = :ward FOR UPDATE;
-- Require exactly one existing ward row; otherwise roll back and reject.

-- A separate statement, executed only after the ward lock is acquired:
SELECT count(*) AS remaining
FROM coverage WHERE ward = :ward AND on_call;
-- Require remaining > 1 and a valid, currently on-call requesting doctor.

UPDATE coverage SET on_call = false
WHERE ward = :ward AND doctor = :doctor AND on_call
RETURNING doctor;
-- Require exactly one returned row; otherwise roll back without a new grant.

-- Insert the successful grant's email intent into a normal transactional
-- outbox table, using a stable unique request/event ID.
COMMIT;
-- A worker sends email only from committed outbox records.
```

The ward lock is held until commit or rollback. Ada obtains it first, counts two, and commits her grant and outbox event. Ben waits, then acquires the lock. His separate Read Committed count sees Ada's committed change, returns one, and causes rejection. Commit makes a successful grant durable; the shared lock orders the ward's decisions. Different ward keys can proceed concurrently, subject to ordinary database resource contention.

Changing the isolation level and using a separate count statement are essential. Merely adding a lock on the unchanged ward row under Repeatable Read can leave a waiting transaction with a snapshot established before its predecessor committed. Acquiring that lock does not refresh its snapshot. Combining lock acquisition and counting into one Read Committed statement also does not provide the required post-wait statement snapshot.

All paths that can remove on-call coverage must participate: other handlers, administrative updates, deletion, jobs, and transfers between wards. A straightforward rule is for every coverage writer to acquire the affected ward locks first. Transfers lock both ward rows in a consistent key order and check the source ward before removing coverage. Ward creation/deletion must preserve the same business invariant, and this protocol assumes the initial state already satisfies it. A bypassing SQL writer can still violate coverage; the lock is a cooperative database protocol, not a standalone declarative constraint. Relevant decision reads must use the authoritative transaction, not a cache or replica.

Use an explicit bounded retry policy: at most three complete transaction attempts within a two-second overall request budget. Preserve the ward, doctor, and stable request ID, but recompute all decision reads in each new transaction. Roll back and release the previous attempt before retrying. Retry known-aborted serialization failures (`40001`) and deadlocks (`40P01`), and optionally lock-timeout failures (`55P03`) after rollback, with short randomized backoff that respects the remaining budget. Catch these errors from every statement and commit. Configure connection, lock, statement, and client deadlines against that same budget so waiting cannot make the policy unbounded. On exhaustion return an explicit retryable conflict and no new grant. A count of one is a business rejection, not a reason to spin; validation and persistent constraint errors are not generic retry candidates. Verify SQLSTATE extraction for the actual driver, which is not supplied here.

Replace the current pre-commit email call with the committed outbox workflow above. A rolled-back attempt leaves neither a grant nor an email intent. Outbox delivery can itself retry, so retain a stable event ID and use downstream deduplication or provider idempotency where available; a database outbox alone does not promise exactly-once email. Retain a durable request outcome/unique request ID to resolve lost commit acknowledgements. A transport failure during commit has an unknown outcome, unlike a known serialization abort: reconcile the request against the primary rather than assuming failure and granting it again. If it cannot be resolved within the budget, report the outcome as unknown and require subsequent retries to reuse the same request ID.

Focused verification, proposed but **not executed**:

1. On the deployed PostgreSQL version with two independent connections, initialize east with Ada and Ben on call. Under the original Repeatable Read code, barrier both requests after their count reads and before updates. Verify both count two, update different rows, commit, and leave zero. Repeat with requester-only row locks and verify the same failure.
2. For the chosen correction, pause Ada after acquiring the east ward lock. Start Ben and verify he blocks on that lock. Commit Ada, then let Ben proceed; verify his count is one, only Ada receives a committed grant, coverage remains one, and only one successful email intent exists. Do not place a two-party barrier after lock acquisition: the corrected design deliberately prevents both from reaching that point together. Reverse the winner and repeat. Force Ada to roll back and verify Ben can then grant time off from the unchanged two-doctor state.
3. While east is locked, request time off in a separately populated west ward and verify it can commit. Exercise administrative removal and cross-ward transfers through the same lock protocol; verify deterministic lock order and that the source never loses its last on-call doctor.
4. Force failures after the coverage update and after the outbox insert but before commit. Verify rollback restores coverage, publishes no outbox event, and sends no successful email. Exercise successful commit, delivery retry, and lost commit acknowledgement; verify reconciliation uses the stable request ID without creating a second grant or email intent.
5. Hold a ward lock past the configured timeout and force a known-aborted retryable failure using controlled sessions or an application fault hook. Verify complete transaction replay, fresh counts, rollback between attempts, the maximum attempt count, the total deadline, and the explicit exhausted-conflict response. Verify business rejections and non-retryable errors are not replayed. Use application tests for error classification/deadlines and real PostgreSQL integration checks for snapshot and lock behavior.

These findings use only the supplied requirements, SQL, and concurrency-correctness skill references. The trace is supplied evidence, not a test result. The PostgreSQL version, driver behavior, pool connection ownership, other writer paths, and email-provider deduplication remain to be verified. Useful operational signals are lock waits, retry counts by SQLSTATE, retry exhaustion, rejected grants, coverage-invariant checks, and outbox delivery failures. The principal cost of this correction is serialization of changes within each ward; keep the locked transaction short and email delivery outside it.
