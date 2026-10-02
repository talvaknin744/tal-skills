# Deployment and cutover

## Select the compatibility mechanism

Inspect the actual SDK and service versions before selecting APIs. Use the
current Worker Deployment model where supported; legacy versioning examples
may describe different routing semantics.

| Execution class | Required treatment |
| --- | --- |
| Pinned to an immutable build | Keep that build available for its assigned runs; deploy incompatible changes under a distinct version. |
| Auto-Upgrade or unversioned, reaching new code | Preserve historical command behavior with the SDK's patch/version mechanism where needed. |
| Pinned run deliberately moved to another build | Replay its history against the destination and check payload and dependency compatibility before moving. |
| New run following Continue-As-New | Validate carried inputs against the destination. Verify the explicit version-selection option rather than assuming it upgrades. |

Worker pinning does not isolate shared databases, provider contracts, or
Activities served elsewhere. Check their compatibility with older callers.
Preserve old Activity type registrations and argument decoding while pending
work can still require them. Treat Build IDs as immutable code identities.

For patching, use a stable change ID and preserve the old command path for
histories that need it. Follow the SDK's staged deprecation and removal rules.
Record which live, retained, or resettable histories still require each stage;
elapsed time alone is insufficient evidence to delete a branch.

## Prove the candidate can accept its intended histories

Build a coverage matrix from affected execution states, not only recent happy
paths. Include a run waiting before the changed command, a run past it, every
supported patch generation, message/cancellation paths, and old serialized
inputs. Test both existing-run replay and fresh execution behavior.

Use the same Workflow artifact, converter, and codec configuration that will be
deployed. If production histories are unavailable, generate representative
histories with the old build in a test environment and disclose the coverage
limit. Keep payload scrubbing compatible with decoding and branch behavior.

## Ramp, recover, and retire

Define the observation window and thresholds from the workload's completion
times and service objectives. Include sleeping runs that wake after deployment.
Observe Workflow Task failures as well as closed failures: an execution can
remain open while repeatedly failing to make progress. Check routing exceptions,
including eager-start behavior if the application enables it.

Restoring the prior current/ramping version controls incoming traffic; already
pinned runs remain on their assigned version. Inventory those runs separately.
Choose a compatible repair or supported recovery operation according to their
history, state integrity, and external effects. Resetting history or starting a
replacement does not undo prior effects. Preserve operation identities and
reconcile uncertain effects before any re-execution. Record handled run IDs for
batch recovery; repeating a reset of closed executions can create additional runs.

Retire a version after current drainage evidence and dependency checks support
it. Include closed-Workflow Query needs, retained histories needed for reset,
and availability of artifacts/codecs in the retirement decision. Read current
deployment limits instead of copying fixed counts into a runbook.

## Migrate an existing workload

Define the migration unit: new starts, one entity's next business cycle, or an
active history using supported migration tooling. Inventory active runs,
timers, schedules, incoming callbacks, identities, and the systems that own
their effects. Starting a new Workflow with original arguments is not an
active-history transfer.

Design a durable routing/ownership handoff per unit. Rehearse a cohort with
one effect-producing owner; shadow comparisons must suppress duplicate effects.
Maintain a mapping from legacy identity to Workflow identity and preserve the
deduplication/reconciliation contract through the handoff.

Reconcile accepted work, unfinished work, emitted effects, and final outcomes
before advancing a cohort. Test a callback and a crash at the boundary. A
rollback must identify which owner continues each already-moved operation;
flipping new-start routing alone leaves that question unanswered. For a
service/namespace migration, verify current tooling eligibility, payload keys,
client endpoints, and reversal limits. A customer's managed migration is not
evidence that the same procedure applies to this deployment.
