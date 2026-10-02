# Transaction races

Use this branch when valid concurrent operations can together violate a rule. Identify every writer that can change the relevant state, including background jobs and administrative paths; the repair's guarantee covers only participants constrained by its enforcement mechanism.

## Choose a primitive that covers the invariant

| Invariant | Candidate repair | Boundary to verify |
| --- | --- | --- |
| A quantity never falls below zero | Conditional mutation of the authoritative row | Predicate and mutation are one atomic operation; inspect affected-row/result semantics |
| An edit applies only to the entity/version the caller saw | Compare expected identity/revision and advance revision in the same write | Every relevant mutation advances the revision; [recreation cannot reuse the comparison identity](cache-coherence.md#scope-versions-to-the-entity); conflicts have an explicit response |
| A logical identity is unique | Database uniqueness constraint | Tenant/key scope, null semantics, and migration of existing duplicates |
| A rule spans several records or a predicate | Suitable constraints, a shared lock target, or serializable transaction | The whole decision and all relevant state changes are protected, including missing rows |

An inventory example can be a single conditional update that decrements only when enough stock remains. Treat zero affected rows as a business conflict or deliberate retry decision. Reading availability from the primary immediately before an unconditional update leaves the race intact.

For a cross-row counterexample, two administrators each observe that another administrator is active, then concurrently deactivate different rows. Same-row revision checks can both succeed while the invariant fails. Row locks on only the individual rows being changed are similarly too narrow. Choose an enforcement scope that represents the shared rule; verify deadlock behavior and lock acquisition order.

## Verify the database's actual isolation

Names vary across products. In PostgreSQL, READ COMMITTED uses statement snapshots; successive statements can observe different committed states. Its UPDATE handling can re-evaluate a target row after waiting for a competing updater. REPEATABLE READ still permits serialization anomalies. SERIALIZABLE can reject a transaction whose history cannot be serialized. These are PostgreSQL semantics, not universal definitions for identically named client options.

Check whether connection pooling, transaction helpers, or individual statements change the intended isolation or connection. A lock acquired outside the transaction that performs the change may protect nothing useful. Locking existing rows does not automatically protect a predicate that includes absent rows.

Check when the decision snapshot is established relative to locking. A shared guard-row lock does not refresh a PostgreSQL REPEATABLE READ snapshot taken before the lock was acquired. Choose an isolation/locking protocol whose protected decision sees the required state; inspect [application-level consistency](https://www.postgresql.org/docs/current/applevel-consistency.html) before treating a lock as sufficient.

Serializable isolation orders committed transactions; it does not alone promise that a read includes every earlier acknowledged external write. Single-object linearizability likewise does not establish multi-row isolation. Verify the combined real-time and transaction contract when both are required.

## Retry the right unit

On a retryable serialization conflict, rerun the complete transaction and its decision reads with fresh state. Preserve request intent while recomputing derived values. Bound attempts or elapsed time and return an explicit conflict/failure when exhausted. Classify serialization failures, deadlocks, validation failures, and persistent uniqueness errors using the actual driver; a generic catch-and-repeat loop hides errors.

A lost COMMIT acknowledgement is an unknown outcome, not a confirmed abort. Resolve it through durable operation identity and outcome lookup, or an independently repeat-safe transaction contract, before reapplying a mutation. Connection loss alone cannot establish that rollback occurred.

External effects inside a transaction body may occur again after the database aborts. Move publication intent into an atomic local outbox where appropriate, or establish independent repeat safety for the external effect. An outbox introduces downstream delivery and freshness obligations; it is not a cross-system transaction.

## Verify

For the failing or optimistic schedule, force both actors to reach the decision before either mutation completes. For a repair that locks before reading, observe B attempting or blocking on acquisition, allow A to commit, then verify B rereads the protected state. A barrier requiring B to pass A's held lock would deadlock the test itself. Assert the business invariant and each caller's result, including the conflict path. For cross-row rules, use different target rows; a test competing only on the same row can miss write skew. Verify whole-transaction retries reread state and do not repeat an unsafe external effect.

Primary semantics: [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [explicit locking](https://www.postgresql.org/docs/current/explicit-locking.html), and [serialization failure handling](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html).
