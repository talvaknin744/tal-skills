# Language sources for backend implementation

Research date: 2026-09-29. This report proposes three focused skills: `python-backend`, `typescript-backend`, and `go-backend`. They should translate established backend contracts into the target language's resource, error, concurrency, and testing primitives. Existing architecture, idempotency, concurrency, consistency, durability, and draining skills retain ownership of their cross-service decisions.

The [structured source ledger](books-languages.json) contains the book findings, exact reading scope, limitations, and proposed verification. No complete-book reading is claimed. No source prose, diagrams, or example code is redistributed. Evaluations below are proposals, not reported execution results.

## Edition and access ledger

| Book | Verified edition | Material actually inspected | Access limit |
| --- | --- | --- | --- |
| [Architecture Patterns with Python](https://www.cosmicpython.com/) — Harry Percival and Bob Gregory | First edition, 2020 | Complete author-hosted Chapters 6 and 7, including examples, trade-offs, and footnotes; diagram source inspected | Entire HTML book is available, but only these chapters were read. Its ORM examples need current API checks. |
| [Effective Python](https://www.informit.com/store/effective-python-125-specific-ways-to-write-better-9780138172183) — Brett Slatkin | Third edition; print publication November 20, 2024, copyright 2025 | Publisher metadata, contents, complete HTML Items 30, 32, 36, 37, and 38; selected matching PDF passages | The 80-page publisher sample includes frontmatter, Chapter 5, and index. It is not 80 pages of robustness guidance. Remaining chapters were not read. |
| [Effective TypeScript](https://effectivetypescript.com/2024/05/21/second-edition/) — Dan Vanderkam | Second edition, 2024 | Complete author samples for Items 36 and 74, a complete 2023 documentation article, and repository contents | The 2023 article is titled Item 30; the second-edition contents number that topic Item 31. Full second-edition text was not accessed. |
| [Learning Go](https://www.oreilly.com/library/view/learning-go-2nd/9781098139285/) — Jon Bodner | Second edition, January 2024 | Publisher contents, Chapter 14 opening preview, and nine complete author example files at recorded commits | No complete prose chapter read. The author's free generics chapter belongs to the revised first edition. The publisher lists an unfinished third edition for April 2027. |

Public searches did not establish authenticated, freely accessible complete copies of the latter three editions. Search-result claims and unverified mirrors were not used as reading evidence. Published teaching examples were examined critically: limitations identified in code are not attributed to unseen surrounding prose.

## Current runtime and driver checks

| Area | Implementation guidance supported by the inspected documentation |
| --- | --- |
| Python task ownership | Prefer an explicit lifetime owner for related tasks. `TaskGroup` waits for children; cancellation cleanup normally belongs in `try/finally`, followed by propagation of `CancelledError`. Swallowing cancellation can disrupt structured-concurrency components. [Python 3.14 task documentation](https://docs.python.org/3.14/library/asyncio-task.html) |
| Python resource ownership | Close asynchronous generators deterministically when exiting iteration early. Treat database transaction lifetime separately from session lifetime; use an `AsyncSession` per concurrent task when the project uses SQLAlchemy. [contextlib](https://docs.python.org/3.14/library/contextlib.html), [SQLAlchemy session concurrency](https://docs.sqlalchemy.org/en/21/orm/session_basics.html#is-the-session-thread-safe-is-asyncsession-safe-to-share-in-concurrent-tasks) |
| Python concurrency assumptions | Do not assume the GIL makes multi-step application invariants atomic, or that all Python builds prohibit CPU-parallel threads. Free-threaded builds have distinct runtime conditions; explicit synchronization still matters. [Python free-threading guide](https://docs.python.org/3.14/howto/free-threading-python.html) |
| TypeScript execution | Native Node.js TypeScript execution removes supported syntax without checking types. Require a separate project-configured typecheck, such as `tsc --noEmit`, and test against the declared Node baseline. Local Node 25 behavior does not establish Node 22 compatibility. [Node TypeScript documentation](https://nodejs.org/api/typescript.html) |
| TypeScript boundaries | Assertions are erased. Use runtime validation for untrusted input and discriminated unions for outcome states. Check generated schemas themselves: listing `properties` does not make them required. [TypeScript assertions](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions), [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [JSON Schema objects](https://json-schema.org/understanding-json-schema/reference/object) |
| Go cancellation | A `CancelFunc` requests cancellation and releases associated resources; it does not wait for work to finish. Give workers a completion path and propagate context to blocking operations. [context](https://pkg.go.dev/context) |
| Go resources and checks | Close HTTP response bodies. A race-detector pass covers executed schedules, not all possible races. `testing/synctest` became generally available in Go 1.25 with an API different from its 1.24 experiment; use the project's minimum version. [net/http](https://pkg.go.dev/net/http), [race detector](https://go.dev/doc/articles/race_detector), [Go 1.25 release notes](https://go.dev/doc/go1.25) |

For the shared PostgreSQL example, use a single checked-out `pg` client throughout each TypeScript transaction and release it on every path. A transaction cannot be spread across `pool.query` calls. [node-postgres transactions](https://node-postgres.com/features/transactions), [pool ownership](https://node-postgres.com/features/pooling).

Psycopg operations sharing one connection also share its transaction state. Use independent pooled connections for independent concurrent units of work. Async task cancellation asks PostgreSQL to cancel an operation but does not prove that the statement failed to complete. Pin the installed driver and inspect its version's behavior; the online documentation inspected identified itself as 3.3.7.dev1. [Psycopg concurrent operations](https://www.psycopg.org/psycopg3/docs/advanced/async.html).

A `pgx.Conn` is not safe for concurrent use. A context passed to `Begin` controls that command; it does not arrange automatic rollback when later cancelled. The transaction owner must clean up explicitly, and a cleanup attempt needs a usable, bounded context. The latter is a design recommendation derived from the documented API, not a claim that cancellation always leaves a reusable connection. [pgx connection and transaction contract](https://pkg.go.dev/github.com/jackc/pgx/v5).

## Shared example contract

Use one original backend operation in all three languages. The following is an evaluation design, not an implementation of a particular book example.

1. Authenticate the tenant before selecting the operation namespace. A stable `(tenant, operation_key)` identifies one logical request across retries.
2. Define semantic payload equality explicitly. Reusing a key with an equivalent request replays its stored result; different semantic input returns a conflict. Avoid accidental cross-language differences in JSON formatting, numeric representation, and default values.
3. Commit the database effect and replayable result under one PostgreSQL transaction. Concurrent duplicates converge on one effect. This covers effects within that transaction, not external payments, messages, or arbitrary remote calls.
4. Drop the response after a confirmed commit, then retry the same key and observe the original result. Separately represent an interrupted commit acknowledgement as an unknown outcome; do not infer rollback from the caller's exception.
5. Exercise cancellation before mutation, between mutation and commit, and after confirmed commit. Cancellation before commit should follow the chosen rollback contract; cancellation after commit cannot undo committed state. Resolve ambiguous outcomes using the durable operation identity.
6. Close cursors, rows, bodies, checked-out connections, and owned tasks on every exercised exit. After cancellation or an error, demonstrate that subsequent work can obtain capacity and complete.

The storage research owns the concrete SQL protocol, isolation level, collision behavior, and unknown-commit reconciliation. Language skills should call that contract and make its runtime implementation correct. PostgreSQL's transaction isolation documentation is the authority for engine behavior; an in-memory lock or a version field alone is insufficient evidence. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

## Minimal idiomatic primitives

| Language | Proposed primitives | Checks that remain necessary |
| --- | --- | --- |
| TypeScript | `pg` pool/client; explicit transaction owner; `try/catch/finally`; tagged result variants; `AbortController` for operations documented to support it; awaited task ownership; promise-based test latches | Typecheck separately from runtime tests. Do not assume passing an `AbortSignal` cancels a PostgreSQL query without verifying the installed driver's API. Record the transaction outcome independently of caller connectivity. |
| Python | Psycopg `AsyncConnection` and cursor/transaction contexts; independent connection per concurrent unit; `TaskGroup`; `try/finally`; propagated `CancelledError`; `asyncio.Event` test latches | Exercise cancellation through actual driver I/O. Confirm cleanup and transaction state from a fresh connection. Do not block the event loop with synchronous driver calls or share one transaction across unrelated tasks. |
| Go | `pgxpool`; context passed to operations; explicitly owned transaction and rollback path; `defer` for acquired resources; completion channels or `WaitGroup`; channels for test latches | Run ordinary tests and `go test -race`. Check row iteration errors and closure. Cancellation must be followed by observing owned work finish; a returned timeout alone is insufficient. |

Use real disposable PostgreSQL for engine-dependent behavior and small in-memory models only for semantic schedules. Docker availability makes a shared PostgreSQL contract practical and avoids comparing three unrelated SQLite driver stacks. Deterministic gates should expose the intended interleaving; no fixed sleep should stand in for a transaction milestone. Do not place a barrier where the second participant cannot arrive because the first already holds the database lock it needs.

A process-local model cannot establish recovery after restart or database persistence. A disposable PostgreSQL test demonstrates only the failure modes it actually induces. Unless explicitly tested, it says nothing about power loss, replication failover, disk loss, backup recovery, or remote exactly-once effects. Keep those claims with the existing durability and idempotency skills.

## Proposed skill evaluations

Each language skill should pass the six shared histories above and its own runtime-specific cases. Include a non-trigger evaluation so the skill does not expand every small change into an architecture rewrite.

| Skill | Distinctive evaluations | Non-trigger |
| --- | --- | --- |
| `python-backend` | Cancel one child during database work and observe sibling/resource cleanup; call a mutable-default helper twice and expose shared state; preserve valid zero/empty outcomes through wrappers | A pure local calculation with no I/O, shared state, or API boundary does not require a service-layer framework. |
| `typescript-backend` | Reject a missing required runtime field even when an assertion compiles; add a response variant and detect missing handling; execute valid erasable TypeScript that deliberately fails the separate typecheck | A cosmetic frontend edit does not trigger a backend persistence redesign. |
| `go-backend` | Cancel before consuming a result and observe worker completion; recover a callback panic at a deliberate boundary and verify admission capacity returns; verify response-body closure across repeated requests | A sequential transformation does not require goroutines, channels, or a new pool. |

Reviewers should ask for the observed effect count, replayed result, conflict result, transaction outcome, and resource state. A passing happy-path test or a newly added lock is not sufficient evidence. Implementation and independent review should reference the same scenario names and state what was actually executed.

## Follow-up limits

The ledger separates book prose, author sample code, official runtime documentation, and original recommendations. Book-derived findings remain short and source-scoped; the workflow and evaluation design are original synthesis. Before implementation, discover each repository's actual language, compiler, driver, and database versions. Preserve its established abstractions unless a demonstrated failure requires a change.
