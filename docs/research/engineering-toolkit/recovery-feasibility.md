# Executed PostgreSQL recovery acceptance probe

Completed 2026-09-29 at 08:20:43 UTC. **A successful restore command and a healthy database listener were insufficient for application recovery.** The real PostgreSQL probe reproduced missing identity, latent business-data corruption, and an interrupted restore. Each was rejected by application acceptance checks; a clean retry passed. Full observations and sanitized commands are in [recovery-feasibility.json](recovery-feasibility.json).

## Environment and acceptance contract

The probe used PostgreSQL **18.6**, including matching `pg_dump` and `pg_restore`, pinned to `postgres@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`. This is the same image digest used by the earlier storage probe. Both synthetic containers had `--network none`, no published ports, and PostgreSQL data on tmpfs. Administrative and application passwords were independently generated; temporary credential files had mode `0600`. Cleanup removed only the probe's named containers; the label-filtered container list was empty afterward.

Four tables represented a small service: a logical system/schema identity, orders, a two-entry ledger for each order, and a committed-operation watermark. Transactions 1–3 committed before a custom-format logical dump. Transaction 4 committed afterward and remained on the source. The source stayed available for measuring this known data gap; actual source loss was not injected.

Application acceptance ran through authenticated TCP inside the target container as a restricted `probe_app` login. It required the expected database, login, logical system ID, schema revision, watermark, order count, balanced ledger entries, matching order amounts, absence of orphan entries, and an order digest captured independently before the dump. This was executed SQL acceptance logic, not an HTTP readiness endpoint or a deployed application.

## Observed scenarios

| Scenario | Restore/listener signal | Application evidence | Verdict |
| --- | --- | --- | --- |
| Missing runtime identity | `pg_restore` exit 0; `pg_isready` exit 0 | Authenticated query failed because `probe_app` did not exist | Reject recovery |
| Restored data plus recreated identity/grants | `pg_restore` exit 0 | All nine acceptance checks passed; three orders and six ledger entries | Accept the declared backup recovery point |
| Wrong expected logical system | SQL query succeeds | Logical identity check fails | Reject wrong target/backup association |
| Structurally valid archive with latent bad data | `pg_restore` exit 0 | One ledger is unbalanced and its amount differs from its order | Reject recovery |
| Interrupted data restore | `pg_restore` exit 1 | Watermark 3 exists, but orders are absent and six ledger entries are orphaned | Reject partial state |
| Fresh target after interruption | `pg_restore` exit 0 | All acceptance checks and baseline digest pass | Accept retry at watermark 3 |

The missing dependency was concrete: a database dump does not contain cluster roles. This archive also deliberately excluded ownership/ACL restoration. Creating the login and granting the expected access completed the dependency repair. PostgreSQL documents the database/cluster distinction, and `pg_isready` does not need a valid application identity to report server readiness. [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html), [pg_isready](https://www.postgresql.org/docs/18/app-pg-isready.html)

The latent corruption case incremented one ledger entry by one cent before creating a new archive. SQL constraints remained valid, so restoration completed; domain checks detected the defect. Row counts and the order-table digest alone would have missed it.

The interruption used a deterministic lock barrier during a real `pg_restore` `COPY public.orders`. After `pg_stat_activity` confirmed the wait, the probe terminated that restore backend and released the lock. Pre-data and data phases were deliberately separate and non-atomic. A watermark table happened to restore before the orders table: **a restored watermark is not itself proof that all corresponding data restored**. `--exit-on-error` stops an erroring restore but does not reverse prior committed work; `--single-transaction` has different behavior and was not exercised. [pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html)

## Recovery timing and data loss

The monotonic recovery timer started immediately before provisioning the clean target, after source watermark 4 was observed. It stopped only after role/grant repair and successful application acceptance. Observed duration was **0.914433 seconds**. The restore command alone finished at **0.745668 seconds**, while application acceptance still failed.

This timing includes container startup, restoration, missing-role detection, role/grant recreation, and validation. It excludes incident detection, backup creation, image download, real storage transfer, and traffic cutover. No production RTO was supplied or certified; this is a local feasibility measurement using a **4,656-byte** archive and tmpfs, not a production performance estimate.

The latest acknowledged source watermark was **4**; the accepted restore reached **3**. Exactly **one known committed operation**, order 4, was missing. This meets the probe's one-operation allowance and fails a zero-loss requirement. The measured acknowledgement gap between watermarks 3 and 4 was **0.144005 seconds**. Those are client-observed acknowledgement times, not exact PostgreSQL commit timestamps or a general proof of temporal RPO.

## Use in the later skill and example

The research supports an executable acceptance sequence for `recovery-validation`: declare the recovery point and service requirements; restore into isolation; reconstruct required runtime dependencies; authenticate as the real application identity; validate logical contents and invariants; measure elapsed recovery and known missing commitments; only then consider admission/cutover.

Keep these deterministic cases in the later example: command success with missing login; valid archive with invalid business data; wrong logical system; interrupted restore with an apparently correct watermark; fresh retry after failure; and a correctly restored backup that still violates zero-loss expectations. These cases make the difference between storage recovery and usable-service recovery observable. They operationalize the SRE recovery rehearsal guidance without claiming Google-scale validation. [SRE data integrity](https://sre.google/sre-book/data-integrity/)

No physical backup, WAL-chain verification, PITR, `pg_verifybackup`, encryption-key recovery, actual failover, multi-store reconciliation, or disk-loss durability test ran. `fsync` and `synchronous_commit` were on, but tmpfs cannot establish persistence across host failure. Scratch scripts and synthetic archives remain outside the repository; this record is research evidence, not the final public runnable example.
