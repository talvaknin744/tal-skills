The incident is PostgreSQL Repeatable Read **write skew**. Both proposed fixes are incomplete. I recommend a transaction at **Read Committed that locks the existing ward row before reading coverage**, followed by bounded whole-transaction retries and email delivery only after confirmed commit.

This is a read-only review of `schedule.sql`, `requirements.md`, and the supplied concurrency-correctness skill. The incident trace below is reported by the requirements, not reproduced here. No database or live service was contacted. The deployed PostgreSQL version, driver, pool behavior, and other writer implementations are not supplied, so the repair and integration checks remain proposed.

### Contract and failure

Starting from a valid state, every committed transaction must leave at least one on-call doctor in every ward. A successful time-off result must correspond to a committed change; no successful time-off email may be sent for an aborted attempt. Different wards should be able to proceed concurrently. These are mutation and outcome guarantees; the request contains no separate requirement that every display reader always see the latest committed state.

The supplied history is:

1. Ada's request A and Ben's request B begin separate Repeatable Read transactions, before either commits.
2. A counts two on-call doctors. B also counts two. Both application checks pass.
3. A updates `(east, Ada)` to false. B updates `(east, Ben)` to false.
4. Both commit successfully; a subsequent read finds zero on-call doctors.

Each transaction reads the shared predicate but writes a different row. Neither update must conflict with the other's row lock, and `(ward, doctor)` uniqueness says nothing about minimum coverage. PostgreSQL Repeatable Read permits this serialization anomaly: the stable snapshots preserve each request's outdated justification. Reading from the primary or using separate application replicas does not make the check and mutation indivisible. The code also calls the external email function before commit; that independently permits a success email for a transaction whose commit later fails.

### Review of both suggestions

**Lock only the requesting doctor's row:** insufficient. A locks Ada and B locks Ben, so both can still count two, update their own row, and commit. The lock scope does not cover the ward-wide invariant.

**Change to Serializable without changing retries:** incomplete. With both transactions using PostgreSQL Serializable, this anomalous history cannot have both transactions commit successfully; a serialization failure can occur during a statement or at commit. That protects the database invariant for this schedule, but the existing handler does not recover the request. Reconnecting and issuing `COMMIT` cannot transfer or resurrect an aborted transaction; it does not rerun the count or update. It must never be treated as a successful grant. The pre-commit email may already have been sent for the losing attempt. Serializable is a valid alternative only with complete transaction retries, safe effect placement, and consistent participation by all relevant writers.

### Chosen correction

Use the existing `wards(ward PRIMARY KEY)` row as the shared lock target. No extension is necessary. In one transaction, on one connection:

```sql
BEGIN ISOLATION LEVEL READ COMMITTED;
SET LOCAL lock_timeout = '250ms';
-- Also apply the application's remaining deadline to statement/driver timeouts.

SELECT ward FROM wards WHERE ward = :ward FOR UPDATE;
-- Require exactly one row. A missing ward must fail closed.

-- Separate statement after the lock has actually been acquired:
SELECT doctor, on_call
FROM coverage WHERE ward = :ward AND doctor = :doctor;
-- Reject a missing doctor. An already-off-call doctor is a defined no-op,
-- with no new grant or success email.

SELECT count(*) AS remaining
FROM coverage WHERE ward = :ward AND on_call;
-- If remaining <= 1, roll back and reject this time-off request.

UPDATE coverage SET on_call = false
WHERE ward = :ward AND doctor = :doctor AND on_call;
-- Require exactly one affected row for a new grant.
COMMIT;
```

The ward lock orders participating decisions, and commit is the durable visibility point of a grant. While A holds east's lock, B must wait before its decision read. After A commits, B acquires the lock and its **subsequent Read Committed statement** sees A's committed change, counts one, and rejects. If A aborts, B can see two and grant. West uses a different ward row and can proceed while east is locked. Contention serializes decisions within a ward and can produce timeout/conflict responses for a busy ward.

The isolation change and statement boundary are essential. Do not merely add a ward lock to the existing Repeatable Read transaction: B can establish its transaction snapshot while waiting for A's lock. Because locking the ward row need not modify it, acquiring that lock afterward does not necessarily produce a serialization failure or refresh B's snapshot. B's later count can still see two. Likewise, do not combine lock acquisition and the coverage count into one statement that takes its snapshot before the wait.

Every path capable of invalidating coverage must use the same protocol: time off, deletion, reassignment, bulk changes, background jobs, and administrative writes. Validate final coverage for each affected ward while holding its lock. Acquire multiple ward locks in a deterministic order for cross-ward changes. Creating a ward must establish its initial coverage atomically if the invariant applies to every ward immediately. The protocol assumes a valid starting state, stable ward identity, and that no uncoordinated writer bypasses it; it is not a schema constraint that automatically controls arbitrary SQL. Confirm these participation rules before deployment.

### Bounded retries and email

Use at most **three total transaction attempts**, with a **two-second overall deadline** including connection acquisition, lock waits, queries, commit, and backoff. Use short jittered backoff within the remaining budget and do not start an attempt after the deadline. Configure driver/pool timeouts and cancellation as well as PostgreSQL timeouts; a loop deadline alone does not bound a blocked network call.

On a known-aborted attempt, roll back and start a new transaction, reacquiring the lock and rerunning every decision read and write. Preserve ward, doctor, and request intent; discard the old count. Using actual driver SQLSTATE values, retry `40001` (serialization failure), `40P01` (deadlock), and a known lock-timeout `55P03` within that budget. Catch failures from all statements and commit. Coverage rejection, missing records, and other permanent errors are not transient retries. Deadline expiry or exhausted attempts returns an explicit retryable conflict/unavailable result, never a grant. Discard an unusable connection before another attempt.

Call `sendTimeOffEmail` only after the transaction helper returns a **confirmed successful commit**, outside its retry callback. No aborted attempt sends email. A connection loss during commit creates an unknown outcome, not a known serialization abort: do not blindly retry or report success. Withhold the email and reconcile the outcome through a durable request identifier before treating a repeat as a new operation. If the product also requires eventual email delivery despite a crash immediately after commit, store an email intent in a transactional outbox and dispatch committed intents separately, with duplicate-safe delivery. That reliability requirement is additional to the stated prohibition on emailing aborted grants. An email failure after a confirmed commit must not rerun the database transaction.

### Focused verification to run later

These checks require an authorized real PostgreSQL instance matching the deployed version and driver. They were **not executed** in this review. Use a local email recorder rather than real email delivery.

1. **Reproduce the supplied failure:** seed Ada and Ben on call; use two controlled sessions, pause both after counting two, then allow their different-row updates and commits. Assert zero remain under the original Repeatable Read code. Repeat with only own-doctor row locks to show that proposal still admits the failure.
2. **Verify the chosen lock schedule:** let A lock east and count two. Observe B attempting/blocking on east's ward lock. Let A update and commit, then let B acquire the lock and count. Assert B sees one and rejects, exactly one new grant commits, at least one doctor remains, and only the committed grant generates email. Do not put a barrier after B's lock acquisition while A is waiting for that barrier; that would deadlock the test itself.
3. **Guard the snapshot requirement:** exercise the same ward-lock schedule at Repeatable Read with B's snapshot established before A commits. Demonstrate why retaining that isolation with a lock-only ward row is unsafe. Verify the real helper/pool explicitly uses Read Committed for every repaired attempt and performs the count in a later statement on the same connection.
4. **Exercise failures and bounds:** abort A before commit and ensure no email is sent and B can proceed. Hold the ward lock past the configured timeout and verify bounded retries/exhaustion with no false grant. Force known serialization/deadlock failures at statement and commit boundaries where applicable; record that retries begin new transactions and reread coverage. Separately test commit acknowledgement loss and email failure so neither enters an unsafe transaction retry loop. Fault injection can validate handler behavior; it does not prove database locking or isolation semantics.
5. **Check scope:** while east is blocked, grant a valid west request. Exercise a coverage deletion or reassignment through the shared protocol and reject any final zero-coverage result. Check missing ward, missing doctor, and already-off-call behavior. For the Serializable alternative, force the two-reader schedule and verify a loser aborts, a complete retry rereads one and rejects, and aborted attempts generate no email.

Observed evidence supports the write-skew finding and exposes the retry/effect defects in the supplied code. The proposed correction excludes that history through ward-scoped mutual exclusion plus fresh decision reads; its implementation, writer coverage, timeout configuration, and runtime behavior still require the checks above.
