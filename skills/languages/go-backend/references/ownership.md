# Work and resource ownership

## Context and goroutines

A `CancelFunc` requests cancellation and releases context resources; it does not wait for work to stop. Pass the request context through acquisition and blocking operations, invoke each derived cancel function, and give every owned goroutine a completion path that its owner observes before cleanup is declared complete.

Returning from a `select` on `ctx.Done()` establishes only that the caller stopped waiting. A buffered result channel can prevent one abandoned send; it cannot stop a worker that never receives the context. For workers that may outlive response delivery, name the supervising owner and how shutdown joins them. Keep sends, receives, and other waits cancellation-aware where their peers can disappear.

When cancellation and a communication are both ready, `select` may choose either; cancellation has no priority. If the operation contract rejects already-canceled dispatch, check `ctx.Err()` after acquisition and before dispatch, releasing any abandoned resource. That checkpoint does not exclude cancellation arriving afterward or fence an external effect. Channel operands and send values are evaluated before case selection, so `case out <- performEffect():` can run the effect even when the cancellation case wins. Keep effectful work out of send operands and under its explicit operation contract. [Go select specification](https://go.dev/ref/spec#Select_statements)

Use the same end-to-end deadline through the work. A fresh full timeout at every operation silently expands that deadline. Choose bounded, separately owned cleanup when cleanup must survive request cancellation; its completion is still observable work.

## Resource scopes

- **Admission capacity:** acquire before scheduling the protected work, then install deferred release in the scope that owns its full lifetime. Transfer token ownership to a worker when needed so caller return cannot release capacity early. If a callback can panic, recovery belongs at an existing deliberate boundary; capacity must still return, and recovery must retain a failure outcome.
- **HTTP responses:** close every successfully acquired response body, including rejected status codes and early exits. Choose bounded consumption suitable for the operation. For repeated requests, use a helper that returns and runs its `defer` within each iteration, or close explicitly before the next iteration; a loop block alone is not a defer scope.
- **Rows:** close acquired rows on every early exit and inspect the terminal iteration error. Follow the installed driver's ownership behavior rather than assuming iteration always completes successfully.
- **Connections and transactions:** distinguish the lease owner from the transaction owner. Finalization and pool release are separate responsibilities unless the chosen API explicitly combines them; see [transaction outcomes](transaction-outcomes.md).

Preserve the primary error and its `errors.Is`/`errors.As` identity when adding context. A cleanup failure is additional information, not evidence that the original operation succeeded or that an uncertain effect rolled back.

## Checks for the affected ownership path

Use channels or explicit test hooks to expose the intended milestone, with an overall test deadline. Cancel before result consumption and observe worker completion. If changing admission handling, recover a callback panic at the deliberate boundary and prove the next request can acquire capacity. If changing HTTP ownership, instrument a test transport and count body closures across success, rejection, and early cancellation.

Use the project's minimum Go version for test APIs. `testing/synctest` became generally available in Go 1.25 with a different API from its Go 1.24 experiment. Its availability does not replace real database tests. `go test -race` detects races exercised by that run; it does not prove all schedules safe.
