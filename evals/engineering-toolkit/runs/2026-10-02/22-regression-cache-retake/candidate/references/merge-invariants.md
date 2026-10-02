# Invariants across a merge

Use when replicas or offline participants independently accept mutations that
are later combined. Define the business acceptance rule separately from eventual
agreement and reader freshness.

| Dimension | Decision to establish |
| --- | --- |
| Trigger | Several participants accept changes without consulting one authority. |
| Problem | Valid local states can merge into a state violating the business rule. |
| Mechanism | Test the rule against reachable branch states and the actual merge; protect a decision that fails this test through a suitable authority, allocated rights, or an explicitly different business contract. |
| Limits | Convergent outputs do not establish latest reads, serializable transactions or arbitrary invariant preservation. |
| Counterexample | With one unit of stock, A accepts sale A and B accepts sale B. Set union preserves both sales and makes replicas agree, but over-reserves stock. Deduplication cannot remove two distinct accepted sales. |
| Verification | Force independent acceptance, merge in different orders and repeat deliveries; inspect each caller's acceptance and the business invariant as well as replica agreement. |

## Check which decisions need coordination

Write the common ancestor, allowed local transactions, resulting states and
merge rule. Find two reachable states that each satisfy the constraint but whose
merge does not. A datatype name or associative/commutative/idempotent merge is
insufficient evidence that those business decisions are safe.

Choose the smallest enforcement that covers the rule. Serialization at an
authority may be suitable. Disjoint allocation can permit independent acceptance
only within enforceable rights, including their transfer and recovery. A
compensation scheme changes an irrevocable acceptance rule only with business
authorization; later cancellation does not prove that over-reservation never
occurred. Define the conflict/unavailable result at the acceptance boundary.

## Verify semantics separately

Maintain expected state from definitive committed/accepted operations and
rejections, using their identities and authoritative order where required.
Calculate it independently of the merge code. At a supported observation cut,
compare complete expected and actual identities/values in both directions to
find missing and extra effects. Reconcile uncertain outcomes first. Convergence,
business validity and freshness each need their own observation; agreeing on a
stale or invalid value can pass only the first.

Use the actual datastore boundary when the repair relies on transactional or
conditional-write guarantees. Finite schedules can expose a counterexample;
they do not certify every execution or crash recovery. The conceptual basis and
reading limits are recorded in [sources.md](sources.md).
