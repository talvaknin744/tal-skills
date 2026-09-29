Recommend a small behavioral rental model behind the existing application operations, with `RentalStore` retaining persistence. Keep the staff-note and vehicle-color scripts unchanged. The redesign should address the duplicated, interacting rules and the batch's stale weekly-cap calculation; converting every operation to Table Module, introducing an ORM, and moving all conditions into a new service layer do not follow from those problems.

The evidence is the [rental design](/tmp/book-skill-trials-20260929/enterprise-application-patterns/project/design.md:7): all three operations duplicate rules, two changes touched all three, and the batch diverged. Pricing spans four related tables, while an existing store already isolates database access and accepts a caller-supplied transaction. This is design-document evidence; no implementation, schema, or executable tests were supplied.

| Choice | Fit and cost for this application |
| --- | --- |
| Retain Transaction Scripts and extract shared functions | A credible, inexpensive first step. One shared pricing function fixes formula duplication. It becomes harder to keep extension and replacement invariants together if every script still coordinates those decisions independently. |
| Focused Domain Model | Recommended for rental pricing and eligibility because dated segments, bands, caps, vehicle restrictions, and extension/replacement interactions recur together. Ordinary objects plus pure calculation functions are sufficient; the cost is a small explicit model and mapping changes. |
| Per-table Table Modules | Poor fit here. A Table Module operates on a table-like set of records; naming a class after a table is insufficient. The application has no shared Record Set tooling, and the rules cross table boundaries. Per-table modules would still need cross-table coordination. |
| A new service layer containing every condition | Shared entry points are useful, but the existing application operations already serve HTTP and batch. Keep use-case coordination there. Relocating all conditions to another procedural layer alone does not establish a reusable behavioral model. |

For a future weekly-cap rule change, the target is one pricing implementation and its contract tests, with unchanged endpoint and batch callers. For a replacement-during-extension rule change, the target is one rental eligibility decision. Those are the reasons for the model, rather than application size or uniformity.

Assign responsibilities as follows:

| Participant | Responsibility |
| --- | --- |
| Existing `quoteRental`, `extendRental`, `replaceVehicle` application operations | Preserve public inputs, outputs, error conventions, and existing transaction boundaries. Load the required facts through `RentalStore`, invoke the model, persist accepted changes where the operation currently writes, and construct the existing result. HTTP and batch use the same operations. |
| `Rental` behavioral object | Own rental dates, segments, and extension/replacement state. Validate and produce a valid extension or replacement using the supplied customer, vehicle, and tariff facts. Keep the interaction between replacement eligibility and an existing extension here. |
| Shared rental-pricing calculation, used by `Rental` | Implement prepaid kilometers versus excess-distance charges, day/week caps, and rate changes over dated segments and distance bands. Use explicit value inputs and return a price/breakdown without database access. Do not invent rounding or boundary rules during extraction. |
| Vehicle-group eligibility policy | Own the age restriction decision using customer and vehicle-group facts. `Rental` combines this decision with its existing extension/replacement constraints. |
| `RentalStore` and its handwritten mapping | Load and assemble the necessary rows into the model and value inputs; write accepted rental and segment changes. SQL, keys, relationship mapping, and write ordering remain here. No pricing rules or self-saving domain objects. |

For example, `extendRental` enters its existing transaction scope, loads the rental and relevant facts, asks the rental to validate and calculate the extension, saves the accepted rental and segment changes through `RentalStore` with that same transaction, and returns its existing result after the established commit behavior. `replaceVehicle` follows the same boundary and shares both pricing and eligibility behavior. `quoteRental` shares the calculation without acquiring new write responsibilities. The document does not specify the precise current load/commit order, so implementation must verify it before extraction; this review does not authorize shifting that boundary.

This is a Data Mapper direction for the complex slice: one behavioral rental and its pricing values span `rental`, `rental_segment`, `tariff_period`, and `distance_band`. Extend the existing mapping rather than adopt an ORM. Active Record would fit the simple row-shaped administration better than this rental slice, but there is no reason to rewrite either administration script. Keep one primary rental save path through `RentalStore`.

Make changes explicit: an accepted model operation produces changed state or a change set, and `RentalStore.save` coordinates the necessary inserts, updates, and deletes in dependency order. A generic change tracker or Unit of Work is unnecessary unless the existing save path cannot handle this coordination. Executing those writes is a flush; only the existing transaction owner commits. Neither mapping nor a successful flush guarantees commit.

Keep mutable model instances scoped to one application operation. Assemble each rental once and pass that instance through the operation; if a mapping path can load the same identity twice, use an operation-scoped identity map or otherwise guarantee a single mutable instance. Do not introduce a process-wide mutable cache. Load the relevant tariff intervals and distance bands explicitly, and construct the result from loaded values so result rendering does not cause hidden database reads. Actual query counts and current load behavior remain unverified.

The focused migration seam is the boundary between existing input-record assembly and the duplicated calculation/eligibility blocks:

1. Characterize the existing public operations and mapping, including the corrected endpoint weekly-cap cases and the batch discrepancy. Establish the intended weekly-cap rule with the existing requirements/tests before treating either calculation as authoritative.
2. Extract that calculation into one pure implementation behind the current record-shaped input/output contract. Route all three operations, including their batch path, through it and remove duplicate formulas. This first increment can remain Transaction Script plus shared functions.
3. Introduce the rental behavioral object for the interacting extension/replacement decisions behind the same boundary. Extend `RentalStore` mapping only as needed; retain the application APIs, transaction ownership, and simple administration paths.

Correcting the batch's old weekly-cap result is a separately identified behavior correction supported by the reported inconsistency. It must have an explicit expected-value regression. Other behavior should remain unchanged.

The write invariant is that an accepted extension or replacement satisfies rental policy and its rental/segment changes become durable together. Proposed review checks, none executed here, are:

| Scenario | Expected result or evidence needed |
| --- | --- |
| Prepaid-distance threshold; day/week-cap boundary; interval crossing a tariff change | One approved price and breakdown across quote, extension, and replacement where their inputs describe the same pricing case. Exact rounding and interval semantics come from existing behavior. |
| Customer at an age threshold for a vehicle group; replacement after an extension | The shared policy accepts or rejects consistently for HTTP and batch, with existing error behavior. |
| Rental/segment mapping round trip | All relevant dates, bands, associations, and values survive load/change/save/reload; no new unexpected reads during result construction. |
| Rental write succeeds, then segment write fails before commit | Transaction rolls back both; no partial durable extension or replacement. The failed in-memory model is discarded or reloaded, not reused as committed state. Verify this against the actual store/database integration. |
| Two overlapping operations load the same rental, then each attempts an update | Characterize the current locking/version/isolation policy and preserve its outcome. If conflicts are currently rejected, the loser must leave neither parent nor child writes behind. If lost updates are possible, report that as a separate defect rather than silently adding a concurrency policy to this refactor. The supplied document cannot establish which outcome currently occurs. |

No multi-request editing workflow, user-held lock, or temporary edit state is described, so offline locking and session redesign are outside this recommendation. An operation-scoped identity map would not protect concurrent requests. If a stale read/submit workflow is later established, its conflict policy must cover the read-to-save interval and every participating writer; that would be a separately scoped design choice.

I inspected the supplied design and relevant pattern references and checked the proposed responsibility and failure paths against them. No application tests, database checks, dependency additions, or code changes were performed. The next validation step is to inspect the real application operations, `RentalStore`, schema, and existing tests for the mapping, transaction, and conflict guarantees called out above.
