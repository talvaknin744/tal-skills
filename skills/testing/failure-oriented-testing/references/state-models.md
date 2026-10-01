# Test operations against a state model

Use this branch when the meaning or legality of an action depends on earlier
operations: a lifecycle, protocol, resource owner, or business workflow. Start
with the promised behavior, then model enough state to distinguish it.

1. Define initial state, observable states, actions, transition preconditions,
   results, and invariants. Justify expectations from the contract independently
   of the production branches. Decide which actions should be rejected and whether
   rejection changes state. Keep unresolved policy visible.
2. Execute actions against both the model and the real implementation, comparing
   contractual results and state after each step. Generate legal histories using
   state-aware preconditions or values produced by earlier actions. Check rejected
   actions separately: excluding them from generation leaves their contract
   untested. Include initialization, repeated actions, and terminal states where
   the actual lifecycle permits them.
3. Demonstrate sensitivity with a wrong initial state or a missing transition.
   Shrink the history while preserving the necessary earlier state and expected
   violation. Save explicit actions and inputs, expected and observed outcomes,
   reset procedure, and implementation identity; retain the replay outside the
   generator's temporary database.
4. State the explored action and history budget and what the model omits. A
   sequential model checks selected behavior, not concurrent scheduling, crash
   durability, transport behavior, or all possible histories. Add a separate
   experiment at those real boundaries when the requirement depends on them.

**Evidence:** a contract-derived model rejects a representative incorrect
transition, and a retained history can be replayed against the candidate. A
plan supplies the concrete wrong transition and expected observation without
claiming execution. Use the existing tool for the project's runtime; a small
lifecycle does not require a new modeling platform.

[Trail of Bits' state-machine example](https://blog.trailofbits.com/2018/05/03/state-machine-testing-with-echidna/)
provides the historical case. [Hypothesis stateful testing](https://hypothesis.readthedocs.io/en/latest/stateful.html)
provides a maintained example of rule preconditions and invariants. See
[sources.md](sources.md) for scope and limits.
