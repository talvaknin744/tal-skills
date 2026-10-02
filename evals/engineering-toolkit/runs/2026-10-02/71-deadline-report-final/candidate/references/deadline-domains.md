# Deadline clock domains and completion

Use when a deadline crosses a clock domain or serialization boundary, or when
cancellation controls cleanup and resource release. Keep the operation's budget
allocation in [failure-handling.md](failure-handling.md).

## Preserve the budget across representations

Name each clock and conversion: local elapsed time, wire timeout, or persisted
epoch. Use a monotonic deadline for local elapsed waiting. Declare suspend behavior;
monotonic does not imply that system suspend counts toward the allowance or that
the value remains meaningful after restart or on another host.

In Go, `time.Now().Add(budget)` retains monotonic data. JSON/text/binary encoding
and reconstruction lose it; `UTC`, `Round`, and similar transformations can also
strip it. `Sub` and comparisons use monotonic readings only when both operands
retain them. Keep the original local deadline for budget decisions instead of
round-tripping it through a wire representation. A reconstructed context timer
is not necessarily a timer that continually rechecks wall time: inspect the
conversion that supplies its duration.

In Python asyncio, `timeout_at()` and `call_at()` consume the event loop's clock
domain. A local absolute deadline can be `loop.time() + remaining`; an epoch
from `time.time()` is not interchangeable with that value.

For an RPC, inspect the actual transport's propagation contract. gRPC deducts
elapsed time when propagating a remaining timeout, with language-specific
enablement. Custom wire or persisted deadlines need a declared epoch authority
and skew policy, or a duration-transfer policy covering handoff delay. Cap new
local allowances by the remaining operation budget and any earlier parent
deadline. A fresh per-hop or retry timeout must not renew the caller's lifetime.

## Observe completion after cancellation

Assess these distinct bounds to support the final completion record:

- **Caller:** state the response target, where its budget starts, and which
  acquisition, execution, and cleanup waits count toward it.
- **Work:** name the current and proposed cancellation/join primitives and report
  whether their total wait can exceed the allowance. Go `CancelFunc` and
  `Context.Done()` signal cancellation without joining. Python `wait()` returns
  pending tasks without cancelling them. Inspect
  the actual awaitable and runtime version instead of assuming a separate child
  task or immediate termination. Include observed or unverified cleanup completion.
- **Reuse:** name who retains each connection or permit until owned work finishes,
  or who takes supervised cleanup ownership while that resource stays accounted
  for. State the safe release condition, cleanup waiting limit, and observable
  escalation when work remains active. If the adapter cannot guarantee stop or
  safe disposal, report that no recovery-time bound is established; cap retained
  work and define backpressure.

Preserve cancellation propagation and the existing reconciliation rule for an
uncertain remote effect. A caller timeout bounds neither termination nor reuse
without the supporting completion contract.

## Verify the boundaries

Exercise forward/backward wall adjustments before and after conversion, earlier parent
deadlines, host skew, handoff delay, and expiry during acquisition or execution.
Compare the original local budget with the encoded/reconstructed representation
at the conversion or acquisition point and at later supplied observations. Name
the clock and cap governing each allowance; do not substitute a later reading
for the initial timer duration.
For cancellation, observe pending work, actual termination, exactly-once resource
release, and useful work resuming after cleanup. Declare suspend/restart behavior
separately. Fake-clock arithmetic and source inspection do not establish runtime
timer, wire, or cleanup behavior; mark proposed checks as unexecuted.

For a timeout/cleanup review, give acceptance observations for expiry before
resource acquisition, cancellation before dispatch, and cancellation after an
effect may have been accepted. After actual cleanup, demonstrate a subsequent
useful operation completing; a returned permit or a healthy pool count alone
does not show recovery. Keep these checks proposed until executed.

The [source ledger](sources.md#deadline-clock-and-completion-contracts) records
checked editions and reading limits; these rules require no other skill package.
