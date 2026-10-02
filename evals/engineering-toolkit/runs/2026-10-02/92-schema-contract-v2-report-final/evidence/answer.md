## Review result

**Hold V2 reads, `status_code`-only predicates, and `refund_pending`.** The proposed sequence exposes the new representation before every shard has the column and index, before the backfill matches the independent commit ledger, and while V0 writes can still arrive. The accepted `COMPLETE` commands do not establish completion: shard `40-80` is still running, with the column absent and index unusable. Publishing a schema cache from `-40` for all restarts would expose that mismatch. [rollout.md](../final-project/rollout.md) · [fleet.csv](../final-project/fleet.csv)

### Current evidence at cut 207

The authoritative mapping is `pending=0`, `paid=1`, `refund_pending=2`; only V2 supports the last value. V0 writes `status_text` alone. V1 maintains both representations in one row transaction and falls back to `status_text` when `mapped_rev` does not equal `source_rev`. V2 reads `status_code` only. These are supplied generation contracts, not proof that every deployed writer follows them. [status-code-contract.json](../final-project/status-code-contract.json) · [versions.csv](../final-project/versions.csv)

| Independent outcome | Expected from committed ledger | Complete supplied derived observation |
| --- | --- | --- |
| `11 / order-a` | pending, code `0`, revision `1` | Matches |
| `22 / order-b` | paid, code `1`, revision `2` | Matches |
| `43 / order-c` | paid, code `1`, revision `1` | **Missing** |
| `99 / order-d` | Deleted at commit `207` | **Extra** row: code `1`, revision `1` |

The rejected update at commit `206` does not change order-a. The expected and actual sets each contain three rows, so equal counts and a 400-row cursor cannot prove correctness. This comparison was run locally against the supplied files; no live database check was executed. [commits.csv](../final-project/commits.csv) · [derived.csv](../final-project/derived.csv)

| Backfill proof | Status |
| --- | --- |
| Independent outcome | **Observed failure** at cut 207: missing `43`, extra `99`; the two shared rows match in code and revision. |
| Atomic publication | **Unresolved.** V1/V2 row transactions are specified, but the backfill’s database guard and the shadow copy/reverse-stream transaction boundaries are not. Require a conditional write against key, non-reused incarnation, and observed `source_rev`, with deletion and retry handling. |
| Foreground writers | **Partly specified, not verified.** V0/V1/V2 revision and representation contracts are supplied. Maintenance writers, replay handlers, handwritten SQL, actual deployment coverage, and commit-boundary enforcement remain unverified. |

### Bounded exposure sequence

1. **Stop advancement now.** Keep source-compatible reads and `pending`/`paid` values. Do not publish the shared cache or start V1 writes on a shard lacking `status_code`. Resolve the missing and extra derived rows.
2. **Finish schema installation.** Require `complete`, column present, and index usable for `orders_status_m17` on **all three shards**. Then validate one cache artifact against each shard and restart representative processes against every shard. Confirm V0 compatibility and the paid-listing index’s actual usability.
3. **Introduce the V1 bridge.** Admit V1 writers only where the schema is ready. Keep V1’s same-row revision-checked point-read fallback and source-compatible paid-listing/reporting predicates. Inventory handwritten SQL and every writer, including jobs and maintenance paths. A point-read fallback does not protect a query that filters only on the new index.
4. **Repair and complete the backfill.** Use a consistent source snapshot and a recorded catch-up cut. Publish each mapped value conditionally on key, incarnation, and revision; a deletion must remove or exclude the derived row. Compare complete source, derived, and index sets in both directions, including codes and revisions. Cut 207 currently fails this gate.
5. **Establish the writer floor.** Before any new-only read or predicate, prevent V0 commits at the actual write/commit boundary, or prove all V0 transactions and 12-hour/24-hour jobs have drained and old payloads cannot replay as V0. A healthy heartbeat or “100% V1” deployment is insufficient. The supplied configuration has no minimum-writer check, so **this gate is presently unmet**. [rollout.md](../final-project/rollout.md)
6. **Expose V2 reads and predicates only after gates 2–5 pass**, with V1/V2 writers still maintaining both representations and with the paid-listing and reporting queries reconciled to source results. Admit code `2` only after every eligible reader and writer supports it and the V0/V1 rollback path has been retired or replaced with a proven translation and repair path.

| Transition | Reader paths | Writer eligibility and ordering |
| --- | --- | --- |
| V1 bridge | V0 source reads; V1 revision-checked point fallback; no new-only predicates | V0 and V1 may coexist only while reads tolerate stale codes. Verify V1 dual writes. |
| V2 exposure | V2 code-only reads and predicates; V1 fallback may remain | First enforce a V1-or-later commit floor, drain/reject V0 work, and reconcile all rows and index entries. |
| Back out V2 reads | Restore fallback **and disable every code-only predicate** across app and SQL clients | Keep the V1 writer floor while any new-only path remains. Admit V0 only after those paths are gone and code `2` is absent or repaired; then backfill and reconcile again before re-exposure. |
| Code `2` enabled | V2-compatible readers only | V2-compatible writers only; V0/V1 rollback is no longer a simple deployment rollback. |

### Rollback and switch limits

A 24-hour retained table and a reverse stream reporting five minutes of lag do not establish a rollback point. The retained table’s serving identity, copy checkpoint, reverse-stream coverage of post-switch updates and deletes, lock behavior, and rename semantics are not supplied. A 24-hour job can overlap the entire retention period, and old broker payloads can replay later. A rename could also discard post-switch writes. [rollout.md](../final-project/rollout.md)

The following are **proposed decision bounds, not observed engine guarantees**. The migration owner must verify that the deployed engine supports the lock timeout, worker pause/checkpoint, and authority checks before attempting a switch.

| Switch outcome | Proposed owner action and bound | Traffic and recovery limit |
| --- | --- | --- |
| Before switch / copying | Migration owner holds advancement now; record the actual serving table, copy position, and durable replay checkpoint. Pause copy at a verified checkpoint within **5 minutes** if those cannot be established. | Keep only proven source-compatible traffic. Partial shard completion already blocks exposure. |
| Blocked or confirmed failed | Use a configured **5-minute maximum lock wait**, then inspect authority, migration status, locks, and worker checkpoint; abort/clean up only under the engine’s confirmed-failure contract. | Do not retry until old authority and catch-up eligibility are confirmed. |
| Unknown outcome | Migration owner reconciles catalog/routing, status, worker position, and durable writes within **15 minutes**; then freeze further switch or cleanup and escalate if unresolved. | Permit only traffic shown compatible with the authority actually found. A timeout alone does not prove failure. |
| Confirmed success | Service and migration owners verify new authority, post-switch write coverage, and reverse-stream position within **15 minutes**. Stop incompatible admission if acceptance fails. | Retain the V1-or-later writer floor. Use forward repair unless a rehearsed rollback proves complete post-switch write preservation and value compatibility. |

### Checks still requiring execution

- Exercise a partial shard, shared-cache restart, V0 transaction committing across the writer-floor change, and replay of a V0 job payload. Verify the commit boundary rejects or safely translates old work.
- Verify every mutation advances `source_rev` atomically; exercise an intervening update, delete/recreate with revision `1`, retry, and deletion during backfill. Confirm the database conditional write cannot publish a stale or resurrected row.
- Reconcile all identities, codes, revisions, and paid-listing index entries at one definitive cut. Include the reporting scripts and both missing **and** extra results.
- Rehearse a switch with an independent lock holder, its configured timeout, an ambiguous reply, and a successful retry. Then make post-switch updates and deletes and rehearse the claimed rollback, checking retained-table and reverse-stream coverage.

The supplied files support the **hold** decision and the cut-207 mismatch. They do not establish a safe authority switch, live database atomicity, fleet-wide writer coverage, or a recoverable V0 rollback. All files remain unchanged.
