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
