**Decision: do not ship the proposed acceptance path.** The [contract](../final-project/contract.md) allows at most one final reservation. In the authored [history](../final-project/observations.json), region A accepts one unit and region B independently accepts one unit under different operation IDs. Each local check succeeds, but their union contains two accepted units. Idempotent delivery prevents duplicate copies of *one* operation; it cannot undo either distinct final acceptance.

I ran `python3 -B observe.py`. It reported identical sets at both replicas and `remaining_units: -1`. That establishes the arithmetic of this authored example: the replicas converge **on a state that violates the rule**. It is not a runtime trace or release validation. The 12-second display view contains only A and was not used for final acceptance. That incomplete advisory view is within the contract’s 60-second allowance; it establishes neither a display defect nor a safe acceptance decision. Routing displays to a primary and waiting five seconds would not make the later reservation atomic. See the [proposal](../final-project/proposal.md).

**Smallest supported repair:** put the stock check and durable reservation decision in one authoritative, atomic conditional operation shared by both region APIs. Return `accepted` only after that decision commits; use the operation ID to recover the same outcome on retry. If the authority is unreachable, return pending or unavailable without issuing a final acceptance. Both APIs can remain reachable during a partition, but they cannot both independently promise the last unit. Preallocated, enforceable regional rights are an alternative if final acceptance during disconnection is required, with only one region able to spend this single unit.

The following checks are **proposed, not executed**; they need the actual decision store and API implementation:

| Control | Expected caller result and durable state |
| --- | --- |
| Uncontended request | Accepted; exactly one reservation, zero remaining. |
| Two distinct requests for the last unit | Exactly one accepted; the other rejected for insufficient stock when the authority responds. Never two accepted receipts. |
| Duplicate replay | Same operation ID returns its original outcome; exactly one record and one unit consumed. |
| Authority loss and recovery | No new final acceptance while the decision is unavailable. After an uncertain response, retry by operation ID recovers the committed outcome without consuming another unit. |

Force the competing requests to meet at the conditional decision, repeat delivery in both orders, and check caller receipts **and** durable records. The local arithmetic script cannot validate those datastore and failure semantics.
