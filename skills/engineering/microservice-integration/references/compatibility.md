# Compatibility and independent rollout

Use this reference when changing an existing API, event, schema, or client library.

## Consumer expectations

Compare old and proposed contracts using actual supported consumers. Review field presence, optionality, types, units, meaning, defaults, errors, ordering, and completion semantics where affected. Adding a required request field can break old callers; adding a response value can break an exhaustive enum reader. A schema comparison can catch structural changes, while behavioral checks are needed for meaning changes.

Consumers should read the fields they depend on and tolerate compatible extensions. Keep validation of required business meaning intact: tolerance is not permission to guess missing identifiers or silently accept invalid values. Check the actual serializer and generated clients rather than treating a format name as proof of compatibility.

## Rollout

For a compatible change, show that supported old consumers still work. For a break, prefer an adapter or coexisting interfaces when it allows the service and consumers to move separately. Record which provider/consumer combinations exist during rollout and rollback. New consumers may need to wait until providers support their requirements even when old consumers remain compatible.

If different service versions coexist, account for their shared persistent state and the cost of fixes across versions. A brief rolling deployment and months of supporting an old API have different operational costs. A tightly coordinated release can be a conscious bounded choice within one team; identify it as such instead of claiming independent rollout.

Assign migration ownership and an agreed retirement condition. Track usage by interface and consumer where possible; include buffered events, replays, and slow-upgrading clients in the compatibility window. A date or version number communicates intent but does not prove that remaining consumers are safe to retire.

For implementation, validate schema compatibility where suitable tooling already exists and exercise meaningful consumer behavior against the changed provider. Report unavailable consumers as a validation gap. Keep unrelated platform changes outside the scoped fix.
