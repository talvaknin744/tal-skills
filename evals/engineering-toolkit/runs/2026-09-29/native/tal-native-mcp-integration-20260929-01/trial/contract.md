# Gateway integration contract

`pins.json` fixes MCP 2026-07-28 and the intended Python SDK artifact. This revision
carries protocol version and client capabilities on each request. The HTTP version,
method, and name headers must match the corresponding request body values. Earlier
initialization-session semantics are not enabled for this gateway.

`Gateway.call(headers, body, verified_principal)` runs at an application boundary.
`verified_principal` comes from a trusted upstream authenticator; this synthetic
fixture does not verify OAuth tokens. Body metadata, arguments, and extra client
headers are untrusted. Each request must use its own verified caller. Explicit
handles name application-owned private resources; knowing a handle is not an access
grant. A caller can read only its own handle, including after another caller has
warmed the cache. Repeated read calls have no external mutation effect.

The tool `read-private` accepts a handle. Results are private to the authorized
request context. The local adapter currently returns the application value as a
dictionary; the real pinned SDK would package it as a tool result. Envelope rejection
belongs before application dispatch. The fixture does not establish real HTTP,
SDK interoperability, authorization-server behavior, or full schema conformance.

`python3 -B probe.py` prints local observations, not a passing conformance result.
Request vectors use the pinned JSON-RPC envelope and per-request metadata names.
