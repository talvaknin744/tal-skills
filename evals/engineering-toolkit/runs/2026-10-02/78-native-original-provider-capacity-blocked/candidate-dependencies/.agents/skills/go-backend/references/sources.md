# Sources and limits

Research snapshot: 2026-09-29. This package contains original implementation guidance, not redistributed book text or sample code. Discover the target repository's installed versions before applying version-sensitive behavior.

## Learning Go

Jon Bodner, *Learning Go: An Idiomatic Approach to Real-World Go Programming*, **second edition, January 2024**. [Publisher edition](https://www.oreilly.com/library/view/learning-go-2nd/9781098139285/), [author site](https://learning-go-book.dev/).

Inspected scope: publisher contents, the [Chapter 14 opening context preview](https://www.oreilly.com/library/view/learning-go-2nd/9781098139285/ch14.html), and availability of previews for Chapters 9, 13, and 15. No complete second-edition prose chapter was read. The author's free generics chapter is from the revised first edition. An unfinished third edition listed for April 2027 was not substituted for the published second edition.

Nine complete author example files were read at these immutable commits:

| Source | Files inspected |
| --- | --- |
| [Chapter 12, `08720ea422a3c0f0076ed6efc11147687f47163d`](https://github.com/learning-go-book-2e/ch12/tree/08720ea422a3c0f0076ed6efc11147687f47163d/sample_code) | `backpressure/main.go`, `context_cancel/main.go`, `pipeline/ABProcessor.go`, `pipeline/CProcessor.go`, `pipeline/main.go`, `time_out/main.go` |
| [Chapter 14, `71878380fe1c02a872f55fdba65ed44ac7ef997b`](https://github.com/learning-go-book-2e/ch14/tree/71878380fe1c02a872f55fdba65ed44ac7ef997b/sample_code) | `cancel_http/main.go`, `nested_timers/main.go`, `own_cancellation/main.go` |

Direct code review found that `time_out` does not pass context into its worker, `backpressure` releases capacity after its callback, and `cancel_http` leaves successful response bodies unclosed. These observations motivate ownership checks; they are not claims about surrounding unread prose. The author samples were read, not executed. Proposed tests for worker completion, recovered panic capacity, and body closure are evaluation designs, not recorded passes.

## Runtime and driver authority

- Sameer Ajmani, [Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines), March 13, 2014: additional research read the complete article and in-page examples, including bounded parallelism; linked videos and full downloadable programs were not separately read or run. [Current select specification](https://go.dev/ref/spec#Select_statements) corroborates ready-case selection and operand evaluation. The known-cancellation checkpoint is an application recommendation, not an atomic effect fence.
- [Go context](https://pkg.go.dev/context): cancellation requests and cancel-function ownership.
- [Go net/http](https://pkg.go.dev/net/http): response-body ownership.
- [Go encoding/json](https://pkg.go.dev/encoding/json): decoding, number preservation, and unknown-field handling.
- [Go race detector](https://go.dev/doc/articles/race_detector): exercised-path limits.
- [Go 1.25 release notes](https://go.dev/doc/go1.25): stable `testing/synctest`; the book predates this API.
- [pgx API](https://pkg.go.dev/github.com/jackc/pgx/v5): connection and transaction ownership. Driver behavior below is pinned to **pgx 5.11.0**, commit `5e583fa7aabfa88b796292f849fc9d7d75ac159d`: [BeginTx](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgxpool/pool.go#L811-L837), [Rollback](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/tx.go#L216-L234), [pool transaction release](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgxpool/tx.go#L21-L44), [network cleanup](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgconn/pgconn.go#L768-L813).
- [pgx construction timeout](https://github.com/jackc/pgx/blob/5e583fa7aabfa88b796292f849fc9d7d75ac159d/pgxpool/pool.go#L277-L280) and [puddle acquisition ownership](https://github.com/jackc/puddle/blob/bd09d14bd4018b6d65a9d7770e2f3ddf8b00af1c/pool.go#L411-L468): source-inspected construction behavior.
- PostgreSQL [cancellation](https://www.postgresql.org/docs/current/libpq-cancel.html), [Read Committed](https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED), [ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT), and [timeout settings](https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-STATEMENT-TIMEOUT): transaction and timeout semantics, distinct from Go caller state.

## Executed feasibility probes

The recorded local research used **Go 1.27.1, pgx 5.11.0, PostgreSQL 18.6**, a pool of one, a loopback disposable container, and enabled `fsync`/`synchronous_commit`.

| Probe | Observed result |
| --- | --- |
| Cancel after BEGIN and mutation, between commands | The connection remained acquired and PostgreSQL remained idle in transaction. |
| Roll back with the canceled context | Rollback returned an error, retired the connection, and the pool wrapper released it. This did not demonstrate a permanent pool leak. |
| Roll back with a fresh three-second cleanup context | Rollback was acknowledged and the same connection remained usable. Three seconds was a probe setting, not a production prescription. |
| Three cancellations after observed database lock waits | Each returned `context.Canceled`, retired the connection, completed cleanup, and permitted fresh work in 8–12 ms locally. |

The source-inspected cleanup path has an internal 15-second allowance, and default connection construction has a two-minute timeout. These are pinned implementation facts, not service-level deadline guarantees. Connection-construction cancellation was not fault-injected. The probes did not cover every cancellation race, broken network cleanup, production drain schedule, or Go-native loss of COMMIT acknowledgement. A separate storage probe recovered a real committed receipt after suppressing its acknowledgement; it used synchronous Python and is not Go-driver evidence.

All owned application work was awaited and the research fixtures were cleaned up. Local timings do not establish production bounds. The transaction phase model, fresh rollback budget, runtime-validation guidance, and acceptance scenarios are original synthesis from inspected APIs and observed probes. Real-commit response suppression proves only the induced response-loss history; reopening clients does not establish power-loss durability, failover, backup recovery, or external exactly-once effects.
