# Colocated helpers

Use this branch when an application needs a capability attached to each instance, or when a companion should mediate an interface. Start with the direction and purpose of the interaction:

- A **sidecar** augments the application, such as synchronizing local configuration or providing an additional capability.
- An **ambassador** brokers the application's connection to another service, such as hiding remote discovery or shard routing behind a local endpoint.
- An **adapter** presents the application's existing behavior through the interface a consumer expects, such as translating vendor metrics into the monitoring system's format.

These roles can overlap. Describe the actual responsibility before choosing the name. A colocated helper is useful when a stable local interface permits independent implementation and reuse. Compare it with a library, platform facility, or shared service when local coupling adds little value. A shared proxy has a different scaling and ownership boundary from one companion per application instance.

Specify the helper's entire interface: ports and bind addresses, shared files and their publication rules, configuration parameters and units, credentials, signals, and startup dependencies. A parameter retaining its name while changing its units is still a compatibility change. Define which component reports readiness when useful application behavior depends on the helper. State how restart and shutdown interact with in-flight work.

Failure checks added by this workflow: restart the helper independently; delay its initialization; exhaust its allocated CPU, memory, or disk; and present an incompatible configuration. Check whether application behavior remains valid or becomes explicitly unavailable. Colocation shares a failure domain; separate containers alone do not prove resource or security isolation. When configuration crosses a shared file, test incomplete publication and application reload behavior. When an ambassador mirrors traffic, identify whether the second destination can cause real effects before proposing that experiment.

Finish with the selected role, the local contract, placement rationale, and observed or proposed restart evidence. The source basis is Chapters 2–4, mapped in [sources.md](sources.md); the explicit failure checks are original synthesis.
