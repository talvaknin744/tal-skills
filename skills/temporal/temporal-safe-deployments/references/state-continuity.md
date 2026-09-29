# State continuity

## Evolve recorded data deliberately

Enumerate producers and consumers of changed Workflow inputs, Activity
arguments/results, Signals, Updates, continued-run inputs, and external state.
Exercise actual old payloads through the candidate converter and domain code.
Missing-field defaults, renamed fields, enums, encoding, and encryption-key
availability can break compatibility even when command replay still succeeds.

Use explicit schema versions or compatible decoding when the format changes.
Test the direction required by rollback as well as forward rollout. Keep a
reader or migration path for histories and old callers still in use.

When configuration controls orchestration, obtain it through recorded input or
an Activity and decide when it becomes effective. Preserve the selected version
for the current business cycle; apply later changes at an intentional boundary
or through a recorded message. Reading a live feature flag during Workflow
replay can change the emitted command sequence.

## Bound long-running execution

Estimate growth from repeated Activities, timers, messages, and payloads.
Inspect current service limits and available SDK Continue-As-New suggestions.
Choose a checkpoint boundary early enough to carry work forward within those
bounds. A timer-driven polling loop also grows history; use an appropriate
interval and explicit completion or recovery condition.

Define a continued-run input that carries every required business fact: cursor,
unfinished work, accepted but unprocessed messages, configuration/schema
version, and the deduplication state or durable references needed to avoid
repeating effects. Bound this state; moving an ever-growing collection into the
next input merely moves the size problem.

Use the main Workflow path to Continue-As-New after asynchronous handlers
finish and queued work is processed or included in the checkpoint. Test a
message arriving as the boundary is reached. Specify how producers address the
ongoing Workflow and retry boundary races without losing business identity.
For Go, drain buffered Signal channels using nonblocking receives; waiting for
Update handlers does not drain those channels. Update ID deduplication is scoped
to a run, so preserve business deduplication across runs when resubmission is
possible.
Run IDs change across the boundary; use a stable logical-operation identifier
for effects that must deduplicate across runs.

Account for pending child Workflows and their Parent Close Policy. A continued
parent run does not automatically inherit child handles; either finish the
children or arrange their intended lifecycle and explicit reconnection.

Pinned Workflows ordinarily continue on their pinned version. Upgrading at a
Continue-As-New boundary requires a supported, explicitly configured option;
check its current release status and SDK support. Validate the outgoing state
against the new version. Retain the old Worker until its runs actually leave.

## Boundary tests

Force rollover in a test environment rather than waiting for production-sized
history. Assert the new Run ID, preserved Workflow identity, correct carried
state, and a single business effect across old and new runs. Include duplicate
messages, an unfinished handler, a buffered Go Signal, a pending child, and an
older input schema when those paths exist. Verify message results and final
business state, not just that Continue-As-New occurred.

Keep replay tests for historical command compatibility and these execution
tests for state transfer and side effects; neither substitutes for the other.
