# PostgreSQL recovery branches

Contract pin: PostgreSQL 18 documentation, checked 29 September 2026. The local
example executed PostgreSQL/pg_dump/pg_restore **18.6**, using the official image
`postgres@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`.
Check the deployed version before applying these commands elsewhere.

## Logical archive

`pg_dump` exports one database consistently; cluster roles are separate
dependencies. An archive made with `--no-owner --no-acl` also requires deliberate
ownership and privilege provisioning. Validate an authenticated application query:
`pg_isready` can report success without valid credentials.

Choose restore failure behavior explicitly. `pg_restore --exit-on-error` stops
at the first SQL error but does not roll back earlier committed work.
`--single-transaction` provides atomic restore commands and implies exit-on-error;
it cannot be combined with parallel jobs and can consume excessive lock-table
resources for large restores. Choose fresh targets when atomicity or retry
semantics are uncertain. Restore schema, data, and post-data constraints before
accepting a normal full restore; a successful partial section is only that section.

Keep independent expected content and business checks. For an order ledger,
assert the intended database/user/system ID, compatible schema, known order IDs,
ledger balance, per-order completeness, amounts, and referential integrity.
Compare the latest acknowledged operation with the recovered one separately.
A counter restored before other tables cannot establish transaction completeness.

## Physical backup and PITR

Select physical tooling only for a compatible physical backup and WAL chain.
`pg_verifybackup` checks a physical backup's manifest/content and required WAL;
it is not a logical-archive validator and does not establish application usability.
Use an actual restore rehearsal even after its checks pass.

Inventory recovery-target semantics, the retained WAL chain, timeline selection,
tablespaces, extensions, roles, and configuration. WAL does not recreate manually
edited server configuration files. Test required keys and external objects where
applicable. A logical dump example cannot certify any of these branches.

Official contracts: [pg_dump](https://www.postgresql.org/docs/18/app-pgdump.html),
[pg_restore](https://www.postgresql.org/docs/18/app-pgrestore.html),
[pg_isready](https://www.postgresql.org/docs/18/app-pg-isready.html),
[pg_verifybackup](https://www.postgresql.org/docs/18/app-pgverifybackup.html), and
[continuous archiving](https://www.postgresql.org/docs/18/continuous-archiving.html).
