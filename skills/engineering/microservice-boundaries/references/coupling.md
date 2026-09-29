# Test the seam

Use this when proposing a network boundary or investigating services that cannot change independently. Apply the relevant probes to a concrete user journey and a likely business change.

| Probe | Evidence to inspect | Decision it informs |
|---|---|---|
| Change together | Actual changes, imports, schema changes, coordinated releases | Repeated joint changes suggest related behavior belongs together; distinguish a genuine domain dependency from accidental sharing |
| Know internals | Queries against another service's tables, shared domain objects, leaked storage fields | Move decisions behind the owning service's business contract; distinguish a published reporting schema from private persistence |
| Control another lifecycle | Caller assembles low-level state changes in another service | Move invariant enforcement to the state owner and expose a business operation |
| Wait together | Synchronous call chains, fan-out, startup dependencies | Bound user-visible failure and latency; messaging removes a wait only if the business can accept deferred completion |
| Share mutable state | Multiple writers, shared cache ownership, schema coordination | Name the authority for each transition; separate database infrastructure can be optional, separate ownership cannot be imaginary |
| Join remotely | A local query becomes many service calls | Measure the expected work; consider bulk contracts, a suitable projection, or retaining the boundary |

Information hiding is the test: can the owner change its internal representation while consumers continue using the same business contract? Sharing a transport client or a stable protocol definition differs from sharing domain logic that requires every consumer to upgrade together.

Keep an aggregate's state and rules cohesive. If every useful change requires a new cross-service workflow, reconsider the split before adding orchestration. Conversely, a measured isolation or scaling need can justify a technical boundary; record the benefit rather than applying a universal ban.

Finish with the specific coupling, its consequence, and the smallest boundary or contract change that addresses it. A diagram with separate boxes is not evidence of independent deployment.
