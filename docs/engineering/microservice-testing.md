# microservice-testing

## What it does

Designs tests that show a service can change without breaking consumers. It selects test boundaries by the failure they expose and feedback they provide, and makes real versus controlled processes/resources explicit.

## When to reach for it

Design or review tests across independently deployed services. Use for consumer contracts, service isolation, or release-coupling end-to-end suites; exclude ordinary unit tests within one application. Use `failure-oriented-testing` for broader failure-testing methods and `microservice-integration` to design the interaction itself.

## It's working if

- Each in-scope risk names an observable incorrect outcome, affected user/consumer, and evidence needed.
- Every risk maps to a credible test scope, with real services/resources and controlled dependencies identified.
- Affected consumer/provider versions and behavioral expectations are verified or have an owner and next check.
- Required stages have known triggers, owners, failure signals, and environments; remaining release coupling is explained.
- Passed, failed, and unrun checks are distinguished, and every original risk links to evidence or an explicit gap.

## Where it fits

This is the service-boundary testing specialist. It neighbors `microservice-integration` for contract design, `failure-oriented-testing` for fault scenarios, and `technical-deprecation` for evidence that consumers have migrated. See [the testing skill](../../skills/engineering/microservice-testing/SKILL.md) and [failure-oriented testing path](../reading-paths.md).
