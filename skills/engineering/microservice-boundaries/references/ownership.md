# Ownership and coordination

Use this when team responsibilities or organizational constraints affect the service boundary.

Map who can change the contract, release the service, handle an incident, and evolve its data. A service can have multiple contributors while retaining a clear accountable owner. Include rarely changed services: inactivity does not remove responsibility for patching or recovery.

Walk one business change across the proposed team boundaries. Record each required handoff and shared release decision. If every feature crosses frontend, business logic, and database teams, separate deployments may preserve the same coordination bottleneck. Compare ownership of an end-to-end capability where that fits the organization.

Distinguish shared capabilities that reduce team burden from centralized approval or domain logic that every service must wait for. A common platform can provide deployment and telemetry conventions while teams retain control of their releases and domain decisions.

Use current responsibilities as evidence, not as a permanent specification of the architecture. Recommend changes only within the user's scope; where an organizational decision is needed, name the decision and its effect on the proposed technical boundary. Completion means the proposal names an accountable owner and exposes unresolved handoffs, rather than assuming a new service creates a new team.
