# Request contract

## Identity and equivalent intent

Bind a caller-provided token to a trusted scope and one operation type. Compare the new command with the remembered intent before returning a prior result or resuming work. Reject conflicting intent through the API's documented error contract. Keep separate client, business, and downstream identifiers when their lifetimes differ; preserve an established client's semantics when extending the API. [AWS guidance](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)

Fingerprint a validated semantic representation. Specify treatment of omitted defaults, nulls, case, decimal precision, arrays, resource path parameters, and versioned behavior. Normalize only equivalences the API actually promises; transport credentials are not part of business intent. Persist the comparison version so a deploy cannot silently reinterpret an outstanding operation. A deploy must not create a fresh lookup namespace for still-valid retry identities.

Canonical JSON serialization alone does not decide business equivalence. If using JCS, account for its numeric precision constraints and unchanged string values; use an exact domain representation before serialization. Hashing cannot repair lossy number parsing. [RFC 8785](https://www.rfc-editor.org/rfc/rfc8785.html)

## Access and observable result

Bind identity to authenticated context, not an untrusted tenant field. Check the caller's permission to retrieve the remembered object as well as to invoke the endpoint. The replay path must not bypass the authorization applied to a fresh read. [OWASP object authorization](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)

Choose original-result replay, a stable operation receipt, or a documented current representation. Preserve the corresponding status, relevant headers, representation version, and access rules. Equal business effects do not require byte-identical responses. HTTP method semantics also do not establish a guarantee for every incidental effect. [RFC 9110, §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2)

Classify validation failures, business rejection, throttling, and server failures using actual execution evidence and the existing contract. A provider may retain failures: Stripe, for example, stores the first executed result including a 500, but does not store pre-execution validation or concurrent-request conflicts. Do not generalize this policy to every API or switch keys to bypass a retained uncertain result. [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)

## Lifetime and transitions

Publish the retry horizon and the behavior beyond it. Separate expiry of sensitive response data from the evidence needed to recover unresolved effects. Retain or deliberately retire old comparison/response versions for outstanding requests. Cleanup must not turn unresolved work into an apparently unseen operation. These are contract decisions, not merely cache tuning. [Dochia article](https://blog.dochia.dev/blog/idempotency/)

Use state names already meaningful to the project. Specify one action for each relevant case: acquire unused identity; reject changed intent; observe active work; return an authorized final result; retry a proven pre-effect failure; reconcile uncertainty. Use a bounded wait or a documented pending/status response for active work. Select status codes consistently with the existing API; 425 is reserved for the HTTP early-data situation described in [RFC 8470](https://www.rfc-editor.org/rfc/rfc8470.html#section-5.2), not a generic worker-busy signal.
