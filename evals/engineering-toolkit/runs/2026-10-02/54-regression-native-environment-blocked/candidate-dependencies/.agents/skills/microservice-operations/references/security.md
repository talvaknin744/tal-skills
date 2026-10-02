# Service trust and sensitive data

Use this reference when the operational change adds an exposed interface, alters service identity or authorization, changes secret handling, or moves sensitive data.

Map the caller, acting service, protected resource, and relevant trust boundary. Establish which identity is authenticated and which component authorizes the requested operation. A service identity proves who is calling; it does not establish that an end user may access another user's record. For delegated calls, preserve sufficient trusted context for the responsible service to enforce the intended permission. Verify the denied case as well as the allowed case.

Evaluate the actual path, including traffic that can bypass an edge gateway. Select transport protection, caller validation, and network restrictions according to the threat model and existing platform. Internal network placement alone is weak evidence of authorization. Reuse maintained security mechanisms and verify current primary documentation rather than copying historical protocol or cryptography examples.

Scope credentials to the service's required resources and operations. Identify delivery, expiry, rotation, and revocation behavior. Test a credential change in an authorized environment, including how running instances reload it and how partial rollout behaves. Avoid copying credential values into reports or fixtures; demonstrate permissions through safe observations and configuration references.

Trace sensitive data through persistence, events, caches, logs, traces, and backups. Minimize what is collected and forwarded. Check who can access the data and keys and whether restore procedures retain the needed protection. An encrypted primary database does not demonstrate protected telemetry or recoverable encrypted backups.

Completion means each changed trust boundary has an enforceable identity and permission decision, sensitive data has identified handling controls, and applicable permission or credential-lifecycle checks have results or explicit evidence gaps. Keep a narrow service change distinct from a wider security assessment that the task did not request.
