Recommend a small Domain Model for rental pricing and eligibility, with the existing application operations coordinating calls and `RentalStore` mapping and saving data. Keep staff-note and vehicle-color administration as Transaction Scripts. Reject the application-wide Table Module conversion and ORM introduction: neither addresses the observed problem as directly as giving shared rental rules one authoritative implementation.

This is a read-only design review of `project/design.md`. There is no implementation, schema, or test suite supplied, so the flows below distinguish documented behavior from recommended responsibilities. No dependencies, code, public API changes, or transaction changes are proposed as part of this review.

## Evidence and operation trace

The concrete pressure is rule duplication, not application size. `quoteRental`, `extendRental`, and `replaceVehicle` each load Rental, Vehicle, Customer, and tariff rows, then independently implement pricing and eligibility conditions. Two changes affected all three scripts, and the nightly batch retained an obsolete weekly-cap calculation. There is currently no reliably shared authority for those rules.

For `extendRental`, the documented flow is: application operation → load the rental, vehicle, customer, and tariff data → calculate and validate using a local rule copy → save the changed rental and segments through `RentalStore` within a caller-supplied transaction → return a result. The exact validation order, transaction start, and commit point are not supplied. `replaceVehicle` shares pricing rules and additionally interacts with existing extensions; `quoteRental` duplicates the same rule families. HTTP and batch are both callers of application operations and must reach the same rule implementation.

The proposal should preserve each operation's present read/write behavior. The document does not establish whether quoting persists anything, so do not add a quote write or assume its transaction behavior. It also does not explain how batch retained different logic despite calling application operations; the eventual code review must trace the actual batch call path and any caller-specific branches.

## Where behavior should live

Use ordinary objects or functions organized around rental concepts. The following are responsibilities, not a requirement to introduce a class for every row or rule:

| Responsibility | Recommended home |
| --- | --- |
| Dated tariff selection, prepaid kilometers, distance bands, and day/week caps | One shared rental pricing policy operating on the rental's dated segments and explicit tariff/band values |
| Age restrictions by vehicle group | One shared eligibility policy supplied with customer and vehicle facts |
| Interaction between an existing extension and vehicle replacement | Rental behavior that evaluates the proposed change against the current rental state, using the shared policies |
| Validating and producing an extension or replacement | Rental domain behavior producing a valid proposed state, or a rejection, before persistence |
| Loading inputs, invoking domain behavior, saving accepted changes, transaction coordination, and constructing existing API results | Existing `quoteRental`, `extendRental`, and `replaceVehicle` application operations |
| Joining rows, translating stored values and associations, and writing rental/segment changes | Existing `RentalStore` with extended handwritten mapping |

Quotation should evaluate the same pricing and eligibility policies that mutation operations use. Do not copy conditions into separate quote, endpoint, batch, or service implementations. Whether a particular eligibility rejection blocks a quote or is represented in its response must retain the existing operation contract; sharing the decision does not require identical result handling.

The three existing operations already provide a useful application boundary for HTTP and batch. They can play the coordinating Service Layer role without adding another forwarding layer. Putting all pricing conditions in a new service would centralize some code but leave the rental model without its behavior; that is a procedural alternative, not the recommended Domain Model.

| Alternative | Fit and next-change cost |
| --- | --- |
| Retain scripts and extract shared pure pricing/eligibility functions | A credible, lower-cost first seam. One weekly-cap function would fix duplication. It may remain sufficient if rules mostly remain independent calculations. Interacting replacement/extension state and multi-part pricing favor giving rental concepts explicit behavior as the slice evolves. |
| Focused Domain Model | Recommended target. A cap change belongs in one pricing policy; a replacement/extension change belongs in rental behavior. Requires mapping tests and agreement on domain terminology, but the team already supports ordinary object/function testing and handwritten mapping. |
| Per-table Table Modules | Poor fit for this proposal. A Table Module operates over a table-like record set, normally coordinating multiple rows. Naming a class after a table does not make it a Table Module. No shared mutable record-set representation or toolkit is present, and pricing crosses four tables. Per-table placement would fragment the very rules that should change together. |
| One pattern throughout the application | No demonstrated benefit. The two-field administration scripts have stable tests and no rental policy. Preserve them; do not make them pay for the rental slice's complexity. |

## Persistence ownership and transaction boundary

Use `RentalStore` as the persistence gateway and extend its mapping into a Data Mapper role for the affected rental model. Pricing values span `rental`, `rental_segment`, `tariff_period`, and `distance_band`; their behavior is not naturally one row per object. Domain code should receive usable values and relationships rather than know join details or issue SQL.

Active Record would combine domain behavior and persistence in row-shaped objects. It is a weaker match for these multi-table values and would work against the already isolated store. Data Mapper is a responsibility split, not a requirement to buy an ORM. Keep the handwritten mapper and do not add a persistence dependency.

The representative load/change/save path is:

1. The operation asks `RentalStore` for the rental inputs needed by that operation, including relevant dated tariffs and distance bands. Preserve existing read boundaries; do not silently move reads into a new transaction.
2. Mapping assembles one operation-local representation of each relevant persisted identity, with explicit segment and policy values. Domain behavior evaluates the proposed extension or replacement and returns the accepted change or rejection.
3. The operation explicitly passes the accepted rental/segment changes to the store's existing save path. The store owns row translation and statement ordering required by the actual foreign keys and other constraints.
4. The existing caller owns database commit or rollback. Executing all save statements successfully is not itself a commit; success must follow the existing operation contract.

No ORM change tracker or new Unit of Work is needed merely to implement this design. The operation explicitly supplies changes to save; `RentalStore` translates that explicit change set into inserts, updates, and deletes as required. Whether its present save API replaces all segments or computes a difference is unknown and should be preserved unless a demonstrated problem requires a change.

Keep mutable domain state scoped to one invocation, not shared across requests or batch items. Reuse the assembled instances within an invocation; if repeated loads are actually necessary, verify identity coherence before considering an operation-scoped Identity Map. This is a proposed lifetime, not a claim that the existing store implements an Identity Map. No global identity cache is warranted.

Use explicit loaded inputs and an explicitly constructed result. Domain traversal and serialization should not create hidden database reads. Query counts, fetch completeness, and association mapping cannot be verified from this document; the next implementation check should record store calls for representative quote, extension, and replacement operations. Whole-graph eager loading is not required.

## Preserve correctness without expanding the redesign

The relevant save invariant is that a rental change and its associated segment changes are committed together or neither is committed. `RentalStore` is documented as able to save both in a caller-supplied transaction. The migration must keep that boundary and the existing failure/result contract. Actual atomicity, connection participation, isolation, and commit-failure behavior remain unverified.

There is no stated stale-edit problem or multi-request edit workflow. Offline locking, version columns, sessions, and new conflict responses are outside this review's recommended change. Preserve the current concurrency policy. A concrete lost-update or invalid-state defect, if found, should become a separately stated correctness change with every participating writer identified; do not silently introduce optimistic concurrency as part of extracting rules.

Two unexecuted schedules make the preservation requirement concrete:

- **Competing changes:** A and B load the same rental; A proposes an extension, B a replacement; A saves, then B attempts to save. The redesigned operations must retain the existing accept/reject behavior, while using the same shared policy definitions. The document does not establish whether B is rejected, revalidated, serialized, or permitted to overwrite changes. Characterize that outcome before migration. If both are accepted but their final combination violates the established extension/replacement rule, report a separate defect; the Domain Model alone does not prevent this race.
- **Failed save:** an accepted extension reaches `RentalStore`; its rental-row write succeeds, but a segment write fails before commit. The transaction must roll back the entire save, so a fresh load equals the previous committed rental and segment set. The operation reports failure through its existing API. Discard mutated operation-local objects after rollback and reload before any retry; an in-memory object is not rolled back automatically. Verify this against the real transaction implementation.

No durable edit state or abandonment mechanism is introduced. Any existing workflow in which people read, wait, then submit would need a separate investigation before claiming that the current short transaction protects the whole interval.

## Focused migration seam

Start at the common boundary between `RentalStore`'s mapped inputs and the duplicated rental rule blocks. Keep the three public operation signatures, response shapes, and caller-owned transaction scopes fixed.

First capture the current pricing and eligibility outcomes through all three operations and their HTTP/batch callers. Then extract the dated-segment pricing calculation into one shared implementation, initially accepting the existing mapped records if that keeps the change small. Route all three operations through it before removing the duplicate pricing blocks. Move age eligibility and the extension/replacement interaction into shared rental behavior next; enrich the mapped domain values only where their behavior requires it. Keep all row loading and saving behind `RentalStore` throughout.

The known batch weekly-cap discrepancy requires an explicit distinction between refactoring and correction. Establish the approved weekly-cap expectation from the existing endpoint correction and its tests. Sharing the corrected calculation will intentionally change the obsolete batch result; record that as the specific defect fix, preserving API shape and transaction behavior. Do not make old batch output the new authority merely to force behavioral equivalence. No numeric approved cap or business formula is supplied here.

This seam allows a representative next weekly-cap change to touch one rule implementation and its shared tests, while operation-level tests demonstrate that every caller receives it. It also leaves both unrelated administration scripts unchanged.

## Validation specification — not executed

| Scenario | Concrete input or setup | Expected result |
| --- | --- | --- |
| Weekly-cap reuse | Illustrative fixture only: seven chargeable days at 50 each, weekly cap 300, no distance or other charges, one tariff period | 300 rather than 350 from the shared calculation, exercised through quote, extension, and replacement for equivalent resulting rental facts, plus HTTP and batch paths. Replace these illustrative numbers with the approved production rule. |
| Rate-period mapping | Illustrative fixture only: two chargeable days at 50 followed by three at 60; caps do not bind and distance charges are zero | 280, with the boundary date using the correct tariff. Loading and saving must preserve the dated segments and their tariff associations. |
| Distance policy | Existing approved example with one prepaid allowance and travel crossing a distance-band threshold | Every operation produces the same approved distance component for identical facts. The document does not specify band arithmetic or allowance precedence; obtain the existing expected amount before testing. |
| Age boundary | Approved minimum age `m` for a vehicle group; customer ages `m − 1` and `m`, all other conditions satisfied | Shared eligibility rejects the first and accepts the second for this condition, with each operation retaining its existing rejection/result semantics. Verify the real age calculation date and threshold first. |
| Replacement with an extension | Existing example in which an extension changes replacement eligibility; evaluate otherwise identical rental facts with and without that extension | Quote and mutation paths use the same approved interaction decision. The document does not supply which combination is eligible; characterize the business expectation rather than invent it. |
| Persistence round trip | A rental with multiple dated segments, a tariff-period boundary, and associated distance bands; apply an accepted extension, save, commit, and load fresh | Identifiers, dates, values, and associations are preserved; recomputing the price yields the same approved result. No duplicate or missing segments. |
| Partial-save failure | Inject the segment-write failure described above after a rental write | No durable rental or segment changes; existing error behavior preserved. |
| Competing extension/replacement | The A/B schedule above, exercised through endpoint and batch write paths where applicable | Existing concurrency outcome is characterized and preserved; any invariant violation is separately reported. No unsupported guarantee of stale-write rejection. |

The checks actually performed were reading the supplied request, design, skill, and its domain-logic, persistence, and transaction references, plus verifying input-file hashes while writing this review. No application tests or database checks were run because no implementation or runtime was supplied. The next validation step is a targeted inspection of the three operations, their endpoint/batch callers, `RentalStore`, and existing tests to establish authoritative rule expectations and transaction behavior before implementing this seam.
