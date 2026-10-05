# Controlled failure and recovery histories

Use this branch for retries, timeouts, cancellation, concurrent transitions, or
restart behavior. Start from the actual responsibility boundary.

| Boundary | History worth checking | Observable contract |
| --- | --- | --- |
| Effect versus response | Commit succeeds, response is lost, same request retries | The promised effect count and replay/conflict semantics |
| Ownership | Parent is cancelled while child holds a connection | Owned work finishes or transfers explicitly; resources close |
| Ordering | Old work completes after a newer operation | The declared revision/ownership rule wins |
| Recovery | Stop after durable intent but before acknowledgement, then replay | State converges under the documented durability assumptions |

1. Identify legal ordering constraints and the exact interruption point. Use
   barriers, controlled failpoints, or event acknowledgements; elapsed sleeps
   usually establish neither state nor order. Bound every wait and experiment.
2. Capture observations from the affected boundary: externally visible effects,
   committed state, ownership, pending work, and returned outcomes. Assertions on
   external emissions can be contractual even when internal call order is not.
3. Distinguish a known pre-effect failure from an unknown outcome after dispatch.
   A cancellation request or timeout is not evidence of remote rollback. Retrying
   or abandoning work must follow the declared identity and reconciliation policy.
4. Reset the entire relevant state between trials. A warm cache may legitimately
   differ from an empty cache; specify each expected outcome. Enumerate bounded
   legal schedules where feasible and record the limits of the model.
5. Replay after interruption and check the final contract, including unfinished
   work. An in-memory simulation cannot establish crash durability or transaction
   isolation. Test those claims against the real selected dependency when needed.

For shrinking, remove unrelated actions while retaining the original fault point,
required prior state, and violated invariant. A shorter trace that fails because
setup is invalid is a different failure.

**Evidence:** the relevant unsafe schedule fails an identified assertion, recovery
passes it, and the report distinguishes simulated ordering from actual concurrent
or distributed execution.

## Progress after faults settle

For a recovery-progress claim, separate fault exploration from a stable recovery
phase. Declare the reachable quorum or required participants, retained inputs/log,
and resource assumptions such as available storage. Establish those conditions,
stop changing unrelated faults, and hold permitted remaining faults fixed. Record
which pending operations must complete and by what deadline; observe their actual
completion separately from safety assertions. A quiet run with no wrong results
may still be stuck.

Exercise the stalled implementation under the same conditions. Report unavailable
quorum, missing required data, or exhausted resources as unmet preconditions rather
than silently counting them as recovery success. A permanent partition is covered
only if the declared reachable participants and data suffice for this protocol;
continuous fault injection gives no general eventual-progress guarantee.
[TigerBeetle's liveness account](https://tigerbeetle.com/blog/2023-07-06-simulation-testing-for-liveness/)
and its [historical simulator exclusions](https://github.com/tigerbeetle/tigerbeetle/blob/9ff5f4a470ed6d66b4be535e689c39eee9f24993/src/simulator.zig)
motivate this conditional experiment.

## Delayed response evidence

For retried reads or confirmations, distinguish logical operation identity,
attempt correlation, and the authority/version evidence a response carries.
Use distinct attempt IDs where reuse could validate the wrong context; the ID
alone does not establish freshness. Keep a business operation's idempotency
identity stable across attempts.

Retain two controls. First, complete write W before starting a new read, then
deliver confirmation belonging to an older read; it must not authorize a result
predating W when fresh reads are promised. Second, time out attempt A1, start A2
for the same logical read, and deliver A1's still-valid response while A2 remains
pending. Accept it when the protocol permits: rejecting every nonlatest attempt
can break progress. State why its authority remains valid. [etcd's retry
fix](https://github.com/etcd-io/etcd/pull/21399) preserves that distinction; apply
the paired regression idea to the actual protocol rather than copying its IDs.
