# Composing a user experience across services

Use this reference only when a UI consumes multiple services or a gateway/BFF change is part of the request.

Trace one affected screen or action: required data, number of calls, payload size, partial failures, and the teams needed to release a change. Start from its device and experience constraints. A backend for frontend (BFF) can aggregate and filter data for that experience; it earns its cost when it improves those constraints or gives its owning team a useful release boundary.

Keep experience-specific composition with the UI's owner and authoritative business rules with the domain owner. Separately assess generic gateway concerns such as routing and authentication. Moving domain decisions into gateway configuration or duplicating them in several BFFs makes future changes harder to coordinate correctly.

Choose BFF boundaries using experiences and actual ownership. Similar clients maintained together may share one; clients whose behavior and releases diverge may need separate composition. The number of devices or backend services is not a mechanical rule for the number of BFFs.

If independently released UI fragments are already used or explicitly being considered, examine the assembly boundary: navigation, shared state/events, dependency weight, styling, accessibility, and a fragment's failure behavior. Independent deployment is useful only if a real user can still complete the combined journey.

Verify the scoped user journey and a relevant missing or slow dependency. Establish whether the UI should show partial content, pending work, or failure. For a narrow aggregation fix, keep a larger frontend decomposition as an optional observation.
