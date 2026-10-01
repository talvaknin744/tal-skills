# Rehearse a proposed boundary

Use this branch when an extraction's proposed code or data boundary is uncertain,
or when many existing paths must obey the future separation. Reuse the current
application and tests to make that boundary executable before committing to a
physical split.

1. Declare the proposed owner of each affected model, operation, and background
   task. Inventory crossings, including foreign keys, cascades, bulk writes,
   scheduled work, and callers that bypass the normal service interface. Explain
   the business behavior replacing each lost database guarantee.
2. Choose the smallest enforcement seam available in the project: a restricted
   interface, access policy, test adapter, or runtime boundary check. Make a
   forbidden crossing fail with the attempted operation and declared owner. Use
   annotations or framework patches only when their maintenance and diagnostic
   costs are justified; the case study's mechanism is not a universal prescription.
3. Run representative journeys against both the current arrangement and the
   proposed boundary, comparing contractual outcomes. Keep comparison effects
   isolated. Enable enforcement incrementally for covered slices, and record
   uncovered branches and temporarily permitted crossings with their exit
   conditions. A passing suite establishes only the paths it exercises.
4. Before moving authority, test the remaining physical assumptions with real
   selected stores and transport in a suitable environment: routing, serialization,
   lost constraints, latency, remote failures, and task delivery. A simulated call
   crossing does not exercise a network or establish a distributed transaction.
   Retire temporary checks only after another control owns their useful invariant.

**Evidence:** an intended forbidden crossing is rejected, a representative legal
journey works under the proposed boundary, and each material unexercised crossing
or physical assumption has a next check. For a design request, supply those
scenarios and expected observations; report them as executed only when run.

The [Sentry boundary simulation account](https://blog.sentry.io/removing-risk-from-our-multiregion-design-with-simulations/)
motivates this rehearsal. Its tests still missed branches later found in staging.
See [sources.md](sources.md) for the reading scope and current framework crosscheck.
