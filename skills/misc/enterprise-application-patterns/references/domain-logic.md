# Choosing where business behavior lives

Start from two representative changes: an ordinary operation and a rule variation that touches several operations. Trace which facts and behaviors must move together. Compare the approaches using those changes rather than a preferred class diagram.

**Transaction Script** organizes behavior around an application action. It suits straightforward validation, calculation, and storage whose rules remain understandable as procedures. Shared functions can remove real duplication without introducing an object model. Keep transaction control at a visible operation boundary. A script that calls helpers is still a script; method count is not the decision criterion.

**Domain Model** distributes behavior among meaningful objects and their relationships. Consider it when interacting rules, lifecycle transitions, or policy variants recur across operations. Demonstrate a home for those rules and how a caller invokes them. Account for the extra mapping and team comprehension costs. Moving fields into classes while leaving competing copies of the same rules in controllers does not achieve the proposed behavioral organization.

**Table Module** organizes behavior around a table-like record set, with one module handling multiple records rather than one behavioral object per record. It is a candidate where the application's data access and UI tooling already share that representation. Check how individual rows are identified and related sets are coordinated. A class merely named after a table is insufficient evidence for this choice.

Keep simple administration or reporting paths simple when a complex business slice adopts a model. Explain the seam between approaches so a rule shared across them still has one responsible implementation. Propose an incremental move using an existing variation or duplication problem, with behavior preserved at the boundary.

An application Service Layer can expose operations and coordinate transactions across callers. Judge its value from those callers and workflows; a separate layer is not a prerequisite for every script. Distinguish use-case coordination from reusable domain decisions, and show where each resides. The book records differing preferences about Service Layer richness; treat this as a design tradeoff.
