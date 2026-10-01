# Retry coordination: primary-source adoption

Reviewed 1 October 2026. The [structured source record](uber-retry-storms.json)
contains exact URLs, dates, reading scope, six-dimension practice cards, inspected
figure hashes, limitations, and proposed test oracles. Research and the reference
addition are complete; the scenarios below have not been executed.

## Evidence from Uber

Uber's [retry-storm account](https://www.uber.com/us/en/blog/protecting-against-retry-storms/)
(17 September 2026) describes error ownership to coordinate existing retry
policies across a service path. The caller nearest an attributed failure can
handle its configured retry opportunity; other ancestors suppress redundant
attempts. Missing metadata and broken context require fallback behavior. When
the nearest caller has no suitable retry policy, ownership is retained upstream
so an already configured ancestor can still have an opportunity. Budget denial
counts as an opportunity handled, rather than permission to bypass the budget.
These conditions are clearer in figures 10–12 than in the prose alone. The
reported production reductions remain Uber's observations; no comparable result
was measured here.

The [dependency-analysis account](https://www.uber.com/us/en/blog/automated-dependency-analysis/)
(15 September 2026) links an inbound request to final outbound outcomes using
middleware context. Its statistical classifications are operational heuristics.
For adoption, endpoint behavior and controlled failures must establish that a
mandatory dependency caused the returned error. Optional dependency failures
coinciding with local faults require separate ownership. The article's
implementation places retry middleware after dependency analysis on the outbound
path, so attribution observes the final result.

## Transfer into the existing skill

The new [retry-coordination reference](../../../../skills/engineering/microservice-operations/references/retry-coordination.md)
is reached by one conditional line in `failure-handling.md`. It addresses a gap
in the existing inventory of retrying layers: layer-local limits do not themselves
establish a call-path bound, and suppression can remove useful configured retry
opportunities. It leaves the skill entrypoint and discovery metadata unchanged.

The operational rules are original synthesis. They require trusted, correctly
linked internal metadata; preserve eligibility, effect identity, deadlines, and
admission as independent decisions; and distinguish retry opportunity from a
mandatory retry. There is no portable ownership header to copy. When a system
lacks shared middleware or causal attribution, an explicit bounded policy remains
necessary; the article does not establish that adding its header alone works.

The arithmetic uses total attempts rather than the article's ambiguous `R`
notation: a 1:1 chain with three independent retry layers, each allowing two
total attempts, can reach eight leaf calls. This is a derived bound for that
model, not measured traffic or a universal formula for fan-out. Similarly,
independent per-layer 10% aggregate allowances yield `1.1³ = 1.331` under the
stated simplifying assumptions. SDK token quotas and Envoy concurrent budgets
are not interchangeable implementations of that ratio model. Squaring an error
probability estimates retry improvement only with the relevant independence and
repeatability assumptions; sustained overload commonly violates them.

## Current contract checks

| Primary source | Finding that constrains adoption |
| --- | --- |
| AWS [retry guide](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html) and [20 May 2026 announcement](https://aws.amazon.com/blogs/developer/announcing-updated-retry-behavior-for-aws-sdks-and-tools/) | Quotas typically belong to an SDK client and are not shared across processes or hosts. The guide describes updated behavior requiring an opt-in flag as checked. Verify installed SDK support and effective configuration; no defaults or token costs are prescribed. |
| Envoy [HTTP routing](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/http/http_routing), [circuit-breaker API](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/circuit_breaker.proto), and [route API](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/route/v3/route_components.proto) | Retry concurrency, allowed retries, and timeout are distinct controls. The route timeout includes retries but begins after the downstream request is fully processed; a per-try timeout is not the complete caller lifetime. Hedging can overlap an initial attempt. `/latest/` currently resolves to development docs, so it is a reading source rather than a dependency pin. |
| gRPC [retry](https://grpc.io/docs/guides/retry/), [deadline](https://grpc.io/docs/guides/deadlines/), and [cancellation](https://grpc.io/docs/guides/cancellation/) guides | Absence of a configured retry policy still permits defined transparent retry cases. Response headers commit the RPC for library retry behavior, not necessarily the business effect. Deadline and cancellation propagation vary with language; application cleanup is cooperative. Cancellation does not prove that a remote write was rolled back. |

## Proposed verification boundary

| Case | Required discriminator |
| --- | --- |
| `RETRY-CHAIN-01` | With persistent deep failure, dispatched leaf calls stay within the declared call-path bound; a control with retries at every layer exposes multiplication. |
| `RETRY-CAUSE-01` | Mandatory dependency failure allows appropriate attribution; optional failure plus an independent local fault preserves local ownership. Mere concurrent errors cannot pass. |
| `RETRY-OPPORTUNITY-01` | Disabled closest retries preserve an existing eligible ancestor opportunity; attempted or quota-denied opportunity suppresses redundant ancestors. Nonrepeatable effects remain ineligible. |
| `RETRY-CONTEXT-01` | Missing/foreign metadata and broken internal context follow a finite declared fallback. No new retry policy is created and residual multiplication is counted. |
| `RETRY-LIFETIME-01` | Attempt timeout, backoff, pool waiting, deadline expiry, and cooperative cleanup share the logical lifetime; uncertain remote effects retain reconciliation. |
| `RETRY-RECOVERY-01` | Useful traffic resumes without a retry surge and unrelated work retains its declared resources. |

These are test specifications, not passing results. A bounded policy model can
check decisions and count assumptions. Actual middleware ordering, transport
metadata, SDK/proxy interaction, remote effects, and recovery require separately
authorized integration evidence. No new public skill, runtime dependency, or
requirement to reread every source on each invocation was added.

## Reading limits

Both Uber articles' substantive text was read. Retry figures 3, 4, 6, 8–12, and
14 and dependency figures 1 and 12 were inspected as pixels; their source URLs
and SHA-256 hashes are in the JSON. Decorative images, simple node diagrams,
the production-radius screenshot, and dependency code images were not separately
inspected. No code-snippet compatibility claim is adopted. The linked USENIX
paper, yarpc source, internal Uber implementations, and external outage news
were not read. AWS's old Builders Library URL now redirects to a page whose body
was unavailable to the reader; it supplies no substantive evidence here.
