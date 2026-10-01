# Independent source review: retry coordination

Reviewed 2026-10-01. No source-correctness findings in the reviewed reference
snapshot. The guidance preserves the important distinctions between a configured
retry opportunity, an actual dispatched attempt, and a local resource limit.
Streaming remains a transfer limit requiring an implementation-specific contract;
this review does not establish streaming applicability or a measured traffic bound.

## Reviewed snapshot

The reviewer did not author the retry reference. This review read
[retry-coordination.md](../../../../../skills/engineering/microservice-operations/references/retry-coordination.md)
in full, the retry section of the
[source ledger](../../../../../skills/engineering/microservice-operations/references/sources.md#retry-coordination-contracts),
and the [research narrative](../uber-retry-storms.md) and relevant practices,
crosschecks, and figure records in the [research JSON](../uber-retry-storms.json).
The earlier independent review was not used to reach this conclusion.

| File at review time | SHA-256 |
| --- | --- |
| `retry-coordination.md` | `a1c969db3d171b4af3dfcc05a2ee432991be57712e64687daebf2465e8e83e60` |
| `sources.md` | `f9792d7574604d654612de924b9cfbf9bf46349782ab825f98198c86e650acb0` |

## Claims checked

| Area and reference lines | Independent assessment and primary evidence |
| --- | --- |
| Amplification and budget scope, 9–23 | The two-attempt product is a derived bound for the stated 1:1 failure model. The aggregate ratio example is also explicitly conditional. Uber distinguishes service-local budgets from call-path amplification. Envoy's retry budget limits concurrent retries using active/pending demand; it is not a per-logical-operation attempt allowance. Its limits are per cluster and priority, shared by worker threads, with possible race overruns. The reference correctly asks for deployed scope and configuration rather than treating these controls as a global strict bound. [Uber retry account](https://www.uber.com/us/en/blog/protecting-against-retry-storms/), [Envoy budget API](https://www.envoyproxy.io/docs/envoy/latest/api-v3/config/cluster/v3/circuit_breaker.proto), [Envoy circuit breaking](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/circuit_breaking). |
| Initial attempts and client scope, 18–23, 57–59 | AWS's documented retry quota affects retries; adaptive mode's separate rate limiter can delay or block initial requests. Its token budget is typically client-local, may differ by SDK, and is not shared across processes or hosts. The currently described 2026 behavior requires opt-in. The reference makes no claim that initial traffic is universally quota-limited or that its SDK quota is process-wide. [AWS retry guide](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html). |
| Per-call attempts versus throttling, 10–23, 57–59 | gRPC's configured `maxAttempts` includes the original call, and the deadline spans attempts. Throttling is a distinct client mechanism keyed by server name in the design. A targeted current Go source check places the throttler on `ClientConn`, loaded by each stream; this does not establish one process-wide pool across independent channels. The reference does not prescribe either scope. Transparent retry remains a separate reason to inspect effective behavior. [gRPC retry guide](https://grpc.io/docs/guides/retry/), [implemented gRFC A6](https://github.com/grpc/proposal/blob/master/A6-client-retries.md), [Go client connection](https://github.com/grpc/grpc-go/blob/master/clientconn.go), [Go client stream](https://github.com/grpc/grpc-go/blob/master/stream.go). |
| Opportunity preservation and quota denial, 37–44 | Actual figure 10 marks eligible-but-budget-denied and downstream-suppressed opportunities as satisfied. Figures 11–12 preserve an existing upstream opportunity when the closest caller has no configured retry; they do not create a retry policy. The reference matches this distinction and avoids converting the article's heading into a guarantee of a dispatched retry. [Uber retry account, edge cases](https://www.uber.com/us/en/blog/protecting-against-retry-storms/). |
| Metadata and context propagation, 27–53, 73–75 | Uber uses intra-service request context and shared memory to link inbound/outbound results, plus an internal ownership response signal between services. Its dependency middleware observes outbound results after retries finish; earlier application retries are excluded by its implementation assumptions. Figure 14 explicitly leaves two retrying layers when internal context breaks. The reference retains this residual amplification and requests middleware/wire integration evidence. Provenance and trust-boundary rules are operational synthesis, not a claimed public Uber or HTTP protocol. [Uber dependency analysis](https://www.uber.com/us/en/blog/automated-dependency-analysis/), [Uber context-drop example](https://www.uber.com/us/en/blog/protecting-against-retry-storms/). |

## Streaming transfer limit

The Uber articles establish the illustrated request/response middleware mechanism;
they do not specify a portable contract for long-lived streams. The reference's
instruction to observe a final outbound outcome must be instantiated at the actual
stream completion boundary. An ownership signal learned after response commitment
cannot itself authorize replay. This is an inference about adoption, not an Uber
streaming claim.

gRPC commits an RPC when response headers arrive or outgoing retry buffering
overflows. A client or bidirectional stream must fit in the replay buffer to be
retried. The selected Go implementation also checks commitment before retrying.
[gRFC A6, validity and buffering](https://github.com/grpc/proposal/blob/master/A6-client-retries.md),
[Go stream implementation](https://github.com/grpc/grpc-go/blob/master/stream.go).

Envoy's documented gRPC retry condition reads status from response headers;
status in later trailers does not trigger that retry logic. Its per-try timeout
applies before response content is sent downstream. Thus moving an ownership flag
to trailers or enabling a retry policy does not establish recovery after a partial
response. [Envoy router contract](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/router_filter).

No defect is asserted because lines 37–44 require an eligible configured policy,
lines 57–64 keep eligibility and resource controls independent, and lines 73–75
require integration evidence. Before claiming streaming support, add an explicit
transport commitment/replayability condition and an oracle for failure before
headers, after headers or a partial response, and after replay-buffer exhaustion.
These are proposed checks; none were executed here.

## Reading and verification limits

- Independently reread all substantive retry-article text (published 2026-09-17),
  the dependency article's request tracking and retry-order sections (published
  2026-09-15), and the selected current contracts described above. This was not a
  complete reading of the dependency article or vendor manuals.
- Inspected original-resolution local copies of retry figures 10, 11, 12, and 14
  and dependency figure 12. Their SHA-256 values matched the research record.
  Other figure pixels and image-only code were not inspected in this review.
- gRFC A6 is marked implemented; its historical background and obsolete metrics
  section were not adopted. Go source inspection was limited to throttler storage
  and loading, retry decisions, header commitment, and replay buffering. Mutable
  `master` source is not a deployed version pin or cross-language proof.
- Envoy `/latest/` returned development documentation with differing build suffixes
  across pages. The review checks documented semantics, not a pinned Envoy release.
  AWS SDK support and effective application configuration were not inspected.
- No internal Uber implementation, yarpc implementation, application runtime,
  model run, integration test, fault injection, or production observation was
  performed. Source evidence does not certify causality in an arbitrary service,
  suppression efficacy, duplicate-effect safety, or recovery behavior.

This task writes only this new report; it does not modify the skill, packages,
case specifications, or source records.
