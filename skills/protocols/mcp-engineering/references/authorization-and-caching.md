# Verified callers and private results

The TypeScript HTTP handler accepts trusted authentication information; it does not verify tokens itself. Verification middleware runs first. `toNodeHandler` forwards `req.auth` as factory `authInfo` and callback `ctx.http.authInfo`; fetch-based integrations pass `handler.fetch(request, {authInfo})`.

Resolve the application user and tenant from verified claims or trusted lookup results. OAuth `clientId` identifies an application and may be shared by many users. Tool arguments, `_meta`, arbitrary identity headers and opaque handle knowledge are not proof of ownership. Check current authorization and object ownership before an effect. Treat tool annotations as hints, not authorization or a retry guarantee.

At a protected HTTP boundary, validate the token's intended resource, issuer, validity and required permissions using the deployment's actual authentication scheme. A fixture mapping synthetic strings to users proves request routing only.

When tools combine untrusted content, private reads and publication, or a deployment requires gateway-mediated access, read [tool dataflow and access paths](tool-dataflow.md). These branches need application policy beyond a valid token for each individual call.

For every Streamable HTTP deployment, validate incoming `Origin` headers against the deployment's allowed origins before invoking the handler. Reject a present but invalid `Origin` with HTTP 403. For localhost serving, also install host-header checks and bind explicitly to loopback.

Private caches partition by authorization context as well as operation and relevant parameters. A principal-only key can leak across changed credentials or permissions. Include a safe credential/context identifier and the relevant tenant, authorization version and scopes; never log raw credentials. Re-authorize before returning application-cached data. Credential rotation, permission changes and revocation need explicit invalidation/revalidation behavior.

`cacheScope: private` and a positive `ttlMs` are protocol hints, not an access-control implementation or a freshness guarantee. Results continued with `inputResponses` or `requestState` are not cacheable. Verify client/gateway behavior separately from a server's internal cache.

For a targeted check, use two users sharing an OAuth client ID. Alternate the same URI, attempt the same owned handle, forge caller hints, rotate a token and reduce permissions. Observe each caller's payload and the effect count; denial must precede cache disclosure or mutation.
