# Authorization and validation

Use this when accepting messages, authorizing task operations, or trusting an
Agent Card. Establish caller identity before deriving storage scope or starting
an executor.

## Enforce the request contract before effects

For each Part, require exactly one supported content member. On continuation,
look up the task through caller-scoped storage; only then compare any explicit
context ID with the stored context. An omitted context can be inferred. Validate
business inputs as well as the protocol envelope.
[Message and Part contracts](https://a2a-protocol.org/v1.0.1/specification/#414-message)

In Python 1.1.5, the stock handler accepted an empty Part and a conflicting
explicit context on a valid task. Local probes observed executor effects in both
cases. Narrow handler guards checked `Part.WhichOneof("content")` and compared
`message.context_id` with `await task_store.get(task_id, call_context)` before
both send methods dispatched. The guarded probes rejected invalid requests while
preserving task-only continuation. These checks cover two gaps, not the whole
specification; keep ordinary SDK validation and domain validation active.

**Verification:** exercise both `SendMessage` and `SendStreamingMessage`; assert
no effect and no unauthorized state transition. Include missing required fields,
conflicting content members, incorrect context, valid inferred context, and a
foreign caller using a valid task ID.

## Bind identity and scope explicitly

Authorize get, list, send/continue, cancel, subscribe, and notification changes.
A task ID, context ID, advertised security scheme, or transport connection alone
does not grant access. Verify real token issuer/audience and permitted tenant
before constructing a store key. Include the identity namespace where two
issuers can issue the same subject.

Python's default owner resolver uses `user_name`, and its Starlette adapter maps
that from `display_name`. Supply a stable verified identity rather than a mutable
human label. A per-user store is appropriate for a single-tenant contract; a
multi-tenant service needs an authorized tenant-plus-principal policy. A direct
store probe isolated those scopes only after configuring an explicit resolver.
[Owner resolver](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/owner_resolver.py),
[identity adapter](https://github.com/a2aproject/a2a-python/blob/v1.1.5/src/a2a/server/routes/common.py)

**Verification:** two callers cannot read or alter one another's tasks, including
active registry/cache paths. Repeat with the same principal across tenants when
the application promises tenant isolation. Local fixed bearer strings test
identity propagation only; they provide no token-verification evidence.

## Apply the application's network policy

An Agent Card describes an interface; establish trust in its origin and selected
endpoint before forwarding credentials. For discovery redirects, embedded URLs,
and push destinations, enforce the application's allowlist, address policy,
credential scope, payload limit, and timeout at the actual network boundary.
Treat fetched content as untrusted input to the application.

Push notifications require destination authorization and replay handling as well
as caller authorization to configure them. A deduplicated notification transition
is separate from idempotency of the underlying effect. Apply these checks when
those features are used; a loopback JSON-RPC example does not test them.
[Protocol security](https://a2a-protocol.org/v1.0.1/topics/enterprise-ready/)
