# Storage and consistency research

Verified 2026-09-29. The [machine-readable record](storage.json) contains exactly ten publishers, candidate links, access observations, four deep article reads and supporting documentation. The four article bodies were read in full; other candidates were screened for relevance and availability. This is a curated engineering survey, not a popularity ranking or a claim to have read each publisher's archive.

## What should change

The existing `concurrency-correctness`, `idempotency`, and `microservice-data` skills already cover stale fills, authority boundaries, unknown commits, duplicate effects, projection recovery and forced interleavings. Preserve that coverage. Add narrow operational and verification guidance instead of creating another generic database agent or duplicating those skills.

| Priority | Target | Concrete addition |
| --- | --- | --- |
| 1 | `recovery-validation` | Restore with a replacement identity, prove completion and query recovered business state; retain dependencies required by the chosen restore point. |
| 1 | `failure-oriented-testing` | Represent successful, rejected and uncertain operations separately in histories; verify the checker itself against allowed ambiguity. |
| 1 | `infrastructure-change-safety` | Test application/schema compatibility across rollout stages and rollback, including long-lived old workers. |
| 2 | `concurrency-correctness` | Add bounded observation of convergence and explicit invalidation-channel loss tests for client caches. |
| 2 | Language backend skills | Distinguish driver-supported commit retry from rerunning the transaction body; never wrap every exception in the same loop. |

These are repository recommendations derived from the sources below, not claims that the cited companies use these agent workflows.

## Four deeply read operating accounts

**Meta — cache consistency.** The useful addition is observability: sample a declared freshness invariant, recheck at explicit timescales, and distinguish delayed propagation from incorrect cache transitions. Existing cache-version and eviction guidance needs no duplication. A new failure case should verify the monitor tolerates permissible lag but reports an entry that remains stale after the relevant invalidation. [Article](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/)

**Cockroach Labs — a rare Jepsen failure.** Preserve unknown outcomes in consistency histories. Correlation with one injected fault is a hypothesis, and passing broad workloads is weaker evidence than a targeted regression for the discovered schedule. Add an evaluation where a commit response disappears but a later read proves the write occurred; the agent must neither classify this as a definite abort nor claim the database is faulty without checking its contract. [Article](https://www.cockroachlabs.com/blog/jepsen-tests-lessons/)

**PlanetScale — coordinating schema and code.** Adopt a compatibility matrix and explicit deployment sequence. Online DDL still needs application-level reasoning. The source describes its Rails/MySQL/Vitess workflow; its broad safety language must not become a universal guarantee. Add a case where old background jobs still reference a column after new request handlers stop using it. [Article](https://planetscale.com/blog/how-planetscale-makes-schema-changes)

**ClickHouse — externally stored backups.** The useful boundary is the replacement environment: exported backup bytes do not establish that a new service can access and restore them. Test target identity, location, dependencies and usable state. Treat the 2025 feature-launch defaults as historical; current documentation must govern actual setup. [Article](https://clickhouse.com/blog/introducing-external-backups-on-clickhouse-cloud)

## Current contract checks and limits

- **Transaction retries:** CockroachDB distinguishes restart errors (`40001`) from ambiguous completion (`40003`); connection loss at commit does not prove rollback. The existing idempotency skill already supplies durable identity and reconciliation. MongoDB's driver contract adds a concrete distinction: retry the transaction for `TransientTransactionError`, but retry the commit operation for `UnknownTransactionCommitResult`; callback and core APIs differ in automatic handling. Check the installed driver/version before implementation. [CockroachDB errors](https://docs.cockroachlabs.com/docs/stable/common-errors), [MongoDB driver transaction API](https://www.mongodb.com/docs/manual/core/transactions-in-applications/)
- **Do not overgeneralize commit warnings:** Yugabyte's retry page warns about unknown commit/autocommit outcomes while separately allowing confirmed serialization failures to restart. Error classification and outcome evidence determine safety; the SQL statement's name alone does not. [YSQL transaction retries](https://docs.yugabyte.com/stable/develop/learn/transactions/transactions-retries-ysql/)
- **Client caches:** Redis documents a two-connection invalidation/fill race and clearing local cache when the invalidation connection fails, with bounded connection-health detection. This concerns a Redis client cache, not atomic synchronization with a separate primary database. Test delayed invalidation, connection loss and repopulation before adopting a client library's caching mode. [Redis client-side caching](https://redis.io/docs/latest/develop/reference/client-side-caching/)
- **Migration limits:** Current Vitess deploy-request docs say instant changes cannot be gated or reverted and may terminate queries holding locks; adding a foreign key through a deploy request does not validate existing rows. Reverting a newly added column discards values stored only there. Therefore, specify the algorithm, data-validation step and rollback limits explicitly. These are Vitess product semantics, not all PlanetScale engines. [Deploy requests](https://planetscale.com/docs/vitess/schema-changes/deploy-requests)
- **Restore completion:** Current ClickHouse docs say an asynchronous restore's immediate success is acceptance, not completed recovery; inspect `system.backups`. They also describe configured schedule and retention for external backups, differing from the launch article's lifecycle account. Use current docs and verify configured behavior; do not freeze old launch defaults in a skill. [Backup and restore](https://clickhouse.com/docs/products/cloud/guides/backups/bring-your-own-backup/backup-restore-from-ui)

## Publisher selection and reading boundaries

The lane covers Meta, LinkedIn, Cockroach Labs, MongoDB, Redis, ScyllaDB, Tiger Data, PlanetScale, Yugabyte and ClickHouse. Each canonical index was opened; ScyllaDB's first fetch succeeded but later attempts timed out. Candidate records distinguish HTML reading from search discovery. Tiger Data's [company announcement](https://www.tigerdata.com/newsroom/timescale-becomes-tiger-data-defining-a-new-standard-as-the-fastest-postgresql-platform-for-modern-applications) establishes the Timescale rename; they count as one publisher.

Further reading candidates are LinkedIn's Venice derived-data architecture, ScyllaDB's repair-dependent tombstone retention, Tiger Data's Postgres backup/restore operation and Redis's client-library rollout. They can inform future focused work but are not additional deep-read evidence here. Vendor product comparisons and marketing performance claims were excluded from recommendations. No service, cluster, account, database or recovery drill was changed or executed in this research lane.
