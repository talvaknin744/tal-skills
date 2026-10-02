## Review

**The proposed exposure gates are not met.** At the supplied cut, one shard lacks the column and usable index, and the transformed rows disagree with the independent commit ledger. The “400 rows processed / 400 rows counted” claim in [rollout.md](../final-project/rollout.md) cannot establish correct coverage.

### Current evidence

- [fleet.csv](../final-project/fleet.csv) shows `-40` and `80-` complete, but `40-80` is still running with `status_code` absent and its index unusable. An accepted `COMPLETE` command is not completion. Publishing one shared schema cache from `-40` would expose a schema that `40-80` cannot serve.
- The [authoritative contract](../final-project/status-code-contract.json) maps `pending=0`, `paid=1`, and `refund_pending=2`. [versions.csv](../final-project/versions.csv) limits V0 and V1 to the first two values. V0 writes only `status_text`; V1 maintains both fields in one row transaction and has a fallback; V2 reads only `status_code`. All three are specified to advance `source_rev` atomically on business mutations.
- A healthy V0 heartbeat or “100% V1 deployment” does not close V0 writes: [rollout.md](../final-project/rollout.md) allows an old transaction to commit later and an old payload to replay, with no minimum-writer check at the database write boundary. Maintenance writers and handwritten SQL have no supplied write-eligibility contract.
- I compared the complete [derived observation](../final-project/derived.csv) with the independent [definitive commit ledger](../final-project/commits.csv) through cut 207, using the contract’s mapping:

| Identity | Expected at cut 207 | Derived observation |
| --- | --- | --- |
| 11 / `order-a` | rev 1, pending `0`, mapped rev 1 | Matches |
| 22 / `order-b` | rev 2, paid `1`, mapped rev 2 | Matches |
| 43 / `order-c` | rev 1, paid `1`, mapped rev 1 | **Missing** |
| 99 / `order-d` | Absent after committed delete 207 | **Extra:** rev 1, paid `1` |

The rejected update 206 does not change order 11. Shared rows have no value or revision mismatch, but equal counts conceal one missing and one resurrected identity. A `status_code=1` listing over these derived rows would return 22 and 99 instead of 22 and 43. These are local fixture observations; the fixture records no live database execution.

### Bounded sequence to expose `status_code`

The following gates and time budgets are **proposed**, not observed engine behavior.

1. **Finish schema installation.** Require `orders_status_m17` complete, `status_code` present, and the index usable on **every** shard. Verify the selected database’s completion and cache-publication protocol, then publish a schema cache valid for every shard and restart a consumer against each. Keep V2 reads disabled until this passes.
2. **Establish the bridge.** Run V1 readers with their fallback and V1 writers maintaining `status_text`, `status_code`, and `mapped_rev` in one row transaction. Audit reporting SQL, maintenance writers, both queued-job durations, and old-payload replay. Keep values to `pending` and `paid`.
3. **Close V0 commit eligibility before relying on revision guards or code-only queries.** Enforce a V1-or-newer floor at the actual write/commit boundary; drain or safely reject open V0 transactions and route replayed V0 payloads through a verified bridge path. A deployment percentage is insufficient. If this boundary cannot be enforced, stop the transition here.
4. **Repair and catch up the transformation.** Use a consistent source snapshot and conditional writes guarded by **incarnation and revision**; revision 1 can recur after recreation. Define durable progress, retries, deletion handling, and the catch-up position. Repair 43 and remove 99, then compare complete identities, values, incarnations, and revisions against an independent ledger at a common cut. V1 fallback must remain available while stale rows can exist; an index-only paid predicate cannot supply that fallback.
5. **Switch authority and code-only reads only after those gates pass.** For a proposed locking switch, cap lock acquisition at **30 seconds** and treat a lost reply or client timeout as an *unknown outcome* until routing/catalog, migration status, and data are reconciled. Keep V1-compatible bridge writers and the old representation through the rollback interval. Admit V2 code-only queries, including the paid listing, only after full coverage and index checks.
6. **Enable code 2 separately.** First end V0/V1 reader and replay eligibility, and make an explicit forward-repair decision for rollback. `refund_pending` is in the persisted contract, but V0 and V1 cannot interpret it; enabling it ends an unqualified rollback to either generation.

### Switch and rollback decisions

The database engine, shadow-table identity, durable worker checkpoint, lock semantics, and revert contract are not supplied. Assign the migration on-call as the **proposed recovery owner** and verify those facts before a switch.

| Outcome | Proposed bounded decision and permitted traffic |
| --- | --- |
| **Before switch / copying** | Verify which old object serves; it is implied by the proposal, not observed in the fixture. Copy coverage is incomplete at cut 207 and the durable worker position is unknown. If durable progress stalls for **15 minutes**, pause copying within **5 minutes**, preserve its checkpoint, and resume or rescan idempotently. Serve only through the V1 fallback after the V0 floor closes. |
| **Blocked or confirmed failed switch** | After the **30-second** lock wait, confirm the engine left the old authority serving and inspect locks and worker position. Pause copy/replay within **5 minutes**; retry only after cleanup, catch-up, and eligibility are rechecked. Continue V1-compatible traffic only if old authority is confirmed. |
| **Unknown switch outcome** | Freeze mutating admission, preserve workers and both tables, and reconcile routing/catalog, migration status, and durable data within **10 minutes**. Escalate unresolved state while writes remain closed; do not rename, clean up, or retry on a timeout alone. Permit reads only against a proven serving authority. |
| **Confirmed successful switch** | Confirm new authority and post-switch writes; keep the bridge and reverse/catch-up worker until complete write coverage is proven. Decide acceptance within **10 minutes**. On failure, stop incompatible admission and use verified forward repair or a proved complete reverse path. |

Keeping an old table for 24 hours and reporting five minutes of reverse-stream lag does **not** prove that post-switch writes and deletes are present there. The 24-hour job duration also leaves no demonstrated margin for retries or later replay. Renaming that table or deploying V0 could lose newer writes; after code 2 is admitted, V0 and V1 also lack value compatibility. A rollback to V1 is conditional on retaining its fallback and supported values. Admitting V0 again requires restoring fallback before V0 writes can commit and proving the old representation is complete.

### Acceptance checks still to execute

- On a disposable target using the selected engine, verify every shard’s completed migration, usable index, cache restart, and handwritten SQL compatibility; exercise partial completion.
- Test an intervening update, deletion, and delete/recreate with reused numeric revision. Confirm the database’s **actual** conditional-write primitive atomically checks incarnation and revision, and that every eligible foreground, maintenance, and replay writer advances revisions and maintains the required fields.
- At a fresh common observation cut, compare full base, transformed, and paid-index results in both directions against definitive commits. Require no missing or extra identities and exact values/revisions; at supplied cut 207 the expected paid set is `{22, 43}`.
- Rehearse an old transaction and V0 payload crossing the writer-floor boundary, a cached-schema restart, a held conflicting switch lock, timeout and unknown-outcome reconciliation, successful retry, and rollback or forward repair **after** new writes. Verify serving authority, worker checkpoint, lock cleanup, traffic behavior, and reverse-path completeness each time.

No files were changed and no external service was used.
