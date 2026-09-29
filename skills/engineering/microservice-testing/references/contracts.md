# Consumer contracts and trustworthy doubles

Use this reference when a service interface changes or a test replaces another service with a double.

Start from how a real consumer uses the interface: the operation it invokes, fields it reads, relevant provider state, and decisions it makes from the response or event. Include the meaning of values and errors, not only a syntactically valid payload. For example, a field retaining its numeric type while changing units can break a consumer without breaking its schema.

Capture expectations in the project's contract mechanism. Exercise the consumer against those expectations and verify them against the provider's actual boundary with controlled setup. Ensure the verification reaches the provider implementation; a provider test that returns only the same canned fixture proves little. Keep provider states reproducible and free of dependence on another team's mutable test data.

Record which contract version was verified against which provider artifact. Cover consumers that remain deployed, not just the newest branch of each repository. For a staged migration, specify which old/new combinations can coexist and which change must be introduced first. Verification failure should identify the affected consumer and expectation so a maintainer can fix compatibility or plan an explicit breaking change.

Test doubles represent assumptions. Where the tooling permits, run the same behavioral expectations against the double and the real provider. Otherwise document how drift is detected. For third-party services that cannot run consumer contracts, use available schemas, authorized sandbox checks, representative recorded responses with sensitive data removed, and monitoring as complementary evidence. State their limits: recordings age, schemas miss semantics, and a sandbox may differ from production.

Contracts establish selected interactions. They do not demonstrate the complete user journey, production capacity, security controls, or every possible provider state. Add another test only for a named remaining risk. Completion means supported consumer expectations, versioned verification evidence, and a concrete disposition for any unverified interaction.
