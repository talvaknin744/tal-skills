# Focused skill opportunities

Research date: 2026-10-14.

The strongest bounded addition is an `agent-evaluation` skill. The strongest
existing package improvements are sampled trace interpretation in
`performance-diagnosis` and session compatibility in `database-performance`.
Two further reference candidates address cached wire representations and
shuffle sharding. These are recommendations from source reading and local gap
inspection, not executed evidence that a revised skill works.

## Scope and candidate identity

The local audit used commit `07891113a5112650a11e619a248b23c0ffcdc640`.
It enumerated the skill entrypoints, read the root catalog, repository instructions,
contribution and evaluation contracts, prior company selected readings and the
distributed systems followup. It then read the relevant canonical packages and
references named below. Enumeration is not a full behavioral audit of every skill.
No skill, catalog, adapter, evaluation fixture or historical result was changed by
this research workstream.

The source tree already contains concrete schema writer floors, cutover recovery
records, tenant resident ownership, borrowing and reclamation, serialized deadline
domains, retry coordination, cache load protection and coalescing. Earlier research
proposals therefore cannot be counted as newly missing capabilities merely because
their original report called them proposals. The current canonical files govern.

| Inspected canonical file | SHA256 at the audit checkpoint |
| --- | --- |
| `skills/engineering/failure-oriented-testing/SKILL.md` | `7c0ee7c9e5be042db75a65da063882b6eaa7a3ec5a03a117693b15e677f33ae8` |
| `skills/performance/performance-diagnosis/SKILL.md` | `78a2565d8baeb6efc1fe8ef85769f36d00975582025bd2c9ba2a80e57717246d` |
| `skills/performance/performance-diagnosis/references/distributed-paths.md` | `8a8404c6eefdcbd1376c7552039ec66b568d05ac08b5f188ac801accf1566944` |
| `skills/performance/database-performance/SKILL.md` | `14d000e143c29aa9e14b3fb10fe5679ef3c2b81ac5fd71538f2b61a7868d50ab` |
| `skills/performance/database-performance/references/application-and-pools.md` | `cff9497126da8c43ac0762a7e796dcc03f65460519f44ca044b3dd406720b444` |

These identities describe the inspected baseline. The integration owner must freeze
and identify each revised candidate separately before evaluation.
The integration owner subsequently selected and staged ranks 1 through 3. Gap
assessments in this report remain comparisons with the original commit, not claims
that the resulting staged packages still lack those additions. Their executed
behavior and independent scores belong to the integration evaluation record.

## Ranked capability and ownership map

| Rank | Concrete capability | Existing owner and boundary | Recommended scope |
| --- | --- | --- | --- |
| 1 | Evaluate a stateful AI agent or harness using outcomes, valid graders and repeated isolated trials | `failure-oriented-testing` supplies deterministic software oracles, but does not own stochastic agent comparisons or model grader calibration | New narrow `agent-evaluation` package, preserve the software testing boundary |
| 2 | Interpret sampled and incomplete traces before diagnosing endpoint latency | `performance-diagnosis` already owns critical paths, matched cohorts and overhead | Conditional reference extension, preserve ordinary pool and runtime diagnosis |
| 3 | Validate session semantics before using a database pooler as a latency repair | `database-performance` already owns pool assignment and connection lifetime | Conditional reference extension, preserve correctness and concurrency ownership |
| 4 | Keep cached wire payloads compatible with every producer and consumer | `microservice-integration` owns negotiated representation compatibility, existing cache references own identity and freshness | Reference candidate, no extra cache package |
| 5 | Confine harmful tenant work to bounded worker subsets | `distributed-system-patterns` owns serving topology, `overload-control` owns admission and useful completion | Reference candidate, no scheduler or isolation package |

Ranks 1 through 3 are a coherent small implementation batch. Ranks 4 and 5 remain
separate proposals until their cases and candidate checks can be completed.

## 1. Agent evaluation

The local catalog has protocol, workflow reliability and deterministic failure
testing skills. The repository also has extensive development evaluation rules,
but those repository rules do not travel as an independently installable capability
for somebody evaluating their own AI product.

[Anthropic's agent evaluation article](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
distinguishes the observable environment outcome from the agent's account of it,
capability tests from preservation tests, and repeatable trials from one successful
response. It also motivates clean trial environments, valid alternative solutions,
grader calibration and an explicit Unknown when evidence cannot support a verdict.
The separate [NVIDIA task completion article](https://developer.nvidia.com/blog/how-to-evaluate-ai-agents-from-tool-calls-to-task-completion/)
supports reporting outcome success together with process diagnostics and resource
cost. These company accounts motivate the package, they do not establish local
benchmark scores or a production guarantee.

The proposed activation is a request to design, implement or review evaluations
for an AI agent or harness that uses tools, changes state, or spans multiple turns.
The failure mechanism is a fluent completion message receiving a pass despite an
absent or wrong effect, or a favorable one trial result obscuring contamination,
grader defects or unreliable behavior. A deterministic test of a retry handler
continues to belong to `failure-oriented-testing`.

The package should establish the actual agent, harness, tool and environment
identity. It should define task outcomes and critical side effect constraints
before choosing graders, keep regression cases intact, isolate relevant state
between trials, retain complete available trajectories and outcomes, and report
blocked or incomplete runs separately. Validate graders against both known valid
solutions and seeded consequential failures. Process steps are mandatory only
when the task contract makes them mandatory. Judge disagreement or unavailable
outcome evidence stays explicit.

Choose reliability measures from the product claim. A chance of at least one
success and a requirement that every repeat succeeds answer different questions.
An observed score range is not automatically a confidence interval, and a fixed
three to five trial rule is not appropriate for every task. Keep all attempted
work in resource totals, state the denominator, and leave cost per success
undefined when there are no successes. Define the local meaning of trial because
the two articles use different aggregation terminology. These are proposed
authoring decisions inferred from the sources and repository contract.

| Case role | Suggested case or existing case ID | Required distinction |
| --- | --- | --- |
| New positive | `agent-outcome-and-grader-sensitivity` | Agent claims a refund completed, but ledger is unchanged. Reject it, accept a valid alternate tool route, retain a seeded unauthorized side effect |
| New positive | `agent-isolated-repeated-trials` | Leftover files or cache entries artificially improve a second attempt. Reset relevant state and report all trial outcomes with configuration identity |
| New failure boundary | `agent-grader-unknown-and-zero-success` | Missing final state prevents a pass. No successes leave cost per success undefined. Setup failure remains distinct from a task failure |
| New nontrigger | `deterministic-worker-regression` | A concrete deterministic worker bug uses its software invariant and reproduction, without launching an agent benchmark |
| Existing boundary regression | `failure-oriented-testing/race-clean-lost-update`, `failure-oriented-testing/green-transaction-fake`, `failure-oriented-testing/pure-format-assertion` | Preserve software oracle, fake limitation and ordinary edit boundaries |

These IDs for new cases are proposals. None was executed by this report.

## 2. Sampled trace and critical path evidence

The current distributed path reference already prevents adding independently
computed stage percentiles and counting only successful leaves. It also asks for
the critical path and correlated root cohort. The remaining gap is how to decide
whether the trace evidence preserves the population and dependencies needed for
that diagnosis.

[Uber's CRISP article](https://www.uber.com/us/en/blog/crisp-critical-path-analysis-for-microservice-architectures/)
separates total work from a dependency critical path and shows how host clock skew
can distort apparent span overlap. Its particular overlap and truncation heuristics
are historical implementation choices. [Sentry's sampling article](https://blog.sentry.io/sample-ai-traces-at-100-percent-without-sampling-everything/)
provides a concrete root sampling failure: matching a future AI child cannot
recover a root trace already dropped. [OpenTelemetry sampling guidance](https://opentelemetry.io/docs/concepts/sampling/)
and the [collector tail sampler documentation](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md)
describe selection timing, buffered state, early eviction and late spans.

Extend the current reference to identify head and tail decisions, population,
inclusion rule, loss points and retained sample completeness. Distinguish direct
metrics from metrics derived after selective sampling. Missing spans leave work
and causal edges unknown. Trace durations and parent relationships are evidence
with instrumentation and clock limits, not proof that every child was awaited.
Use unsampled counters or a justified probability correction for population
claims. A route enriched or error enriched trace cohort remains useful for
diagnosis while its unweighted histogram may not describe all requests.

Keep examples conditional on the pinned collector and SDK. Do not import blanket
100 percent tracing, vendor price comparisons, unbounded user metric labels,
success only instrumentation wrappers or source span count inconsistencies.
Bound telemetry overhead and retain rejected, timed out and unfinished operations
in the observation record. This extension follows from the source mechanisms,
it has not run a live collector.

| Case role | Suggested case or existing case ID | Required distinction |
| --- | --- | --- |
| New positive | `sampled-critical-path-review` | Parallel leaves overlap, expensive background work is not awaited, selected slow traces are oversampled. Do not sum spans or present sample percentiles as population percentiles |
| New failure boundary | `dropped-root-late-span` | Dropped root with a later tool call, or tail buffer eviction, leaves incomplete evidence. Separate unknown work from observed absence |
| Existing preservation | `performance-diagnosis/held-pool`, `performance-diagnosis/throttled-container` | Keep a measured pool or host constraint ahead of unnecessary observability redesign |
| Existing nontrigger | `performance-diagnosis/format-only` | Do the requested label correction without a trace campaign |

## 3. Pooler compatibility and reusable sessions

The current pool reference separates application acquisition, pooler assignment,
database execution and cancellation cleanup. It does not yet enumerate the
session features that a proposed pool mode can invalidate.

[PgBouncer's feature matrix](https://www.pgbouncer.org/features.html) assigns a
backend only for the duration of a transaction in transaction pooling. Session
advisory locks, LISTEN and ordinary SET/RESET are incompatible with that mode.
Protocol prepared statement support has its own configuration condition and is
different from SQL PREPARE. [PostgreSQL 18 advisory lock documentation](https://www.postgresql.org/docs/18/explicit-locking.html#ADVISORY-LOCKS)
also shows that a session lock can survive rollback while a transaction lock is
released at transaction end.

Add a conditional compatibility inventory before changing pool mode or reducing
connection lifetime. Name the driver, application and proxy pools, actual engine
and versions, backend assignment lifetime, prepared statement mechanism,
notifications, session settings, temporary state and lock ownership. A client
connection object does not prove one stable database session. Choose transaction
scoped state only when its actual lifetime preserves the required invariant,
or keep the necessary session ownership. Check cancellation, rollback, checkin
and a fresh operation for residual state and safe reuse.

The [Cloudflare Hyperdrive MySQL account](https://blog.cloudflare.com/hyperdrive-mysql/)
supplies a related concrete cleanup failure: reset restored a server default
character set rather than the negotiated encoding. Its corrective command is
MySQL specific. The general inference is to verify the required post reset
session contract, rather than count a successful reset call as complete cleanup.
No live database or pooler was exercised here.

| Case role | Suggested case or existing case ID | Required distinction |
| --- | --- | --- |
| New positive | `transaction-pool-session-state` | Proposed latency fix moves session locks, settings or LISTEN across changing backend assignments. Identify the incompatibility and retain the required authority |
| New failure boundary | `pool-reset-contract` | Reset clears tenant state but changes required encoding or setting. Reinitialize and verify the next checkout, without applying a MySQL command to PostgreSQL |
| Existing preservation | `database-performance/pool-and-lock`, `database-performance/cardinality-skew` | Preserve measured constraint selection and representative data or parameter checks |
| Existing nontrigger | `database-performance/transaction-only` | Duplicate effect correctness alone does not justify pool tuning |

## 4. Cached wire representation compatibility

The cache guidance already includes response varying keys and authorization or
freshness equivalence. The [Cloudflare Hyperdrive MySQL account](https://blog.cloudflare.com/hyperdrive-mysql/)
adds a distinct representation failure. Client and Endpoint nodes could share a
cache and the same query identity, while storing payload bytes encoded under
different negotiated capability sets. Cross reads could produce empty rows or
hangs. The account reports canonical internal bytes with translation at delivery
as its repair. Its production percentages are company reports, not reproduced
results.

The proposed owner is `microservice-integration/references/compatibility.md`, with
a concise conditional cache pointer. State which representation producers write,
which consumers interpret, and whether capability or format differences belong
in the key or are normalized to a canonical internal format. Verify a warmed
cache under producer A and consumer B in both directions, mixed supported
capabilities, colocation and separated caches, and empty versus nonempty results.
An entry with current business data can still be the wrong wire format. Keep that
failure separate from invalidation order and version freshness.

Suggested positive case: `mixed-capability-cache-producers`. Suggested failure
boundary: `old-wire-cache-after-rollout`. Preserve
`microservice-integration/mixed-version-response` and
`microservice-integration/event-meaning-drift`, then run its existing nontrigger
`microservice-integration/local-json-pretty-print-nontrigger`.

## 5. Bounded worker subset isolation

The serving topology reference covers ordinary replication, sharding,
scatter/gather and survivor capacity. [AWS's shuffle sharding account](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding)
introduces overlapping bounded worker subsets so harmful traffic does not
automatically visit the entire fleet. Availability still depends on routing to a
usable member and enough capacity. The account's 28 possible pairs is a property
of its small example, not a general failure probability or security guarantee.

Extend `distributed-system-patterns/references/serving.md` only when a topology
decision needs tenant blast radius containment. Record stable subset assignment,
overlap assumptions, physical failure domains, surviving capacity and the
permitted retry destinations. Test a fully poisoned subset, two simultaneous
harmful tenants whose union covers another tenant's subset, and fallback that
escapes the assigned subset. Virtual worker separation does not isolate a shared
database, host or network bottleneck. `overload-control` continues to own resource
admission, borrowing and useful completion.

Suggested positive case: `tenant-worker-subset`. Suggested failure boundary:
`subset-retry-escape`. Preserve `distributed-system-patterns/search-topology` and
`distributed-system-patterns/batch-takeover`, then run its existing nontrigger
`distributed-system-patterns/local-retry-nontrigger`. If a routing change also
changes admission, select `overload-control/tenant-fanout` and
`overload-control/status-copy` without transferring its historical scores.

## Other useful discoveries and overlap decisions

| Discovery | Decision and reason |
| --- | --- |
| [Uber MCP Gateway](https://www.uber.com/us/en/blog/designing-mcp-gateway/) | Useful `mcp-engineering` reference candidate for progressive discovery and governed tool definition rollout. Discovery can populate disabled entries, then an owner enables a reviewed configuration. This is application policy, not a mandatory MCP gateway architecture |
| [gRPC hedging](https://grpc.io/docs/guides/request-hedging/) and [cancellation](https://grpc.io/docs/guides/cancellation/) | Existing distributed path and deadline references already require repeatability, attempt budgets and actual cleanup. Defer a new package. A future conditional hedge case can distinguish accepted winner semantics from loser effect or resource cleanup |
| [Auth0 key rotation](https://auth0.com/docs/get-started/tenant-settings/signing-keys/rotate-signing-keys), [revocation](https://auth0.com/docs/get-started/tenant-settings/signing-keys/revoke-signing-keys) and [JWKS client examples](https://github.com/auth0/node-jwks-rsa/blob/master/EXAMPLES.md) | Existing service security and MCP cache references already own identity, permission and credential lifecycle. A focused future case should separate ordinary overlap from emergency revocation and bound unknown key refresh. No broad security skill is established by these sources |
| [PostHog asynchronous migrations](https://posthog.com/blog/async-migrations) | Crawler reported resumed migration and version upgrade gates. Current schema and background maintenance ownership fit. Fresh install, resumed old install and upper version gate are useful future cases, not a new migration package |
| Agent session resumption | Current managed agent, durable workflow, effect recovery and worker lifecycle guidance already supplies part of the boundary. Require a concrete discriminating session continuity task before a separate package |

These deferred recommendations must get their own focused positive, failure and
nontrigger cases before any behavioral capability claim. More retrieved articles
do not by themselves establish user demand for additional public skills.

## Consolidated deferred source map

The following table also preserves useful discoveries from the parallel company
crawlers. Crawler reading means a teammate read the primary substantive article
and supplied the mechanism and limits. It does not imply an independent second
reading by this report's author. Current owner documentation is explicitly named
where a crawler crosschecked it. Every row remains deferred, either because the
selected batch already covers the nearest boundary, existing guidance already
covers the mechanism, or focused candidate evaluation remains unfinished.

| Capability and existing owner | Source, reading and contract status | Proposed discriminating case and reason deferred |
| --- | --- | --- |
| Cache wire format, `microservice-integration` | [Cloudflare Hyperdrive MySQL](https://blog.cloudflare.com/hyperdrive-mysql/), independently read external extracted main body. Canonical cache bytes and reset encoding are implementation reports, no runtime reproduction | Producer A warms a shared cache, consumer B uses different capabilities, repeat in reverse. Rank 4 awaits focused compatibility evaluation |
| Worker subset routing, `distributed-system-patterns`, with `overload-control` for resource policy | [AWS shuffle sharding](https://builder.aws.com/content/3F06NpJ8YeoIGP8VHTw4n81pFn8/workload-isolation-using-shuffle-sharding), independently read main prose. Diagram pixels and deployment behavior unverified | Poison a subset, combine two harmful tenants, and force retries outside assignment. Rank 5 awaits topology and admission boundary cases |
| Runtime configuration snapshot ownership, `infrastructure-change-safety`, operational response in `microservice-operations` | Crawlers identified rollout and runtime flag concerns. Existing [configuration distribution reference](../../../skills/engineering/infrastructure-change-safety/references/configuration-distribution.md) already declares source position, version ordering, deletion, freshness and replay expiry | A disabled feature must stay disabled across old snapshots, missing updates and a restart. No distinct missing flag package established, select current writer and consumer generation evidence before adding guidance |
| Runtime feature flag retirement, `code-and-docs-cleanup`, support retirement in `technical-deprecation` | [DoorDash flag cleanup](https://careersatdoordash.com/blog/automating-feature-flag-cleanup-at-scale-with-a-multi-agent-llm-system/), crawler read full main prose and tables. Runtime metadata, dependency injection wrappers and deep callers matter, deployed API behavior and model evaluation not reproduced | A 60 percent tenant rollout cannot become one global constant. Propagate a confirmed complete string target through wrappers and callers and check residual references. Await cleanup behavior and mixed rollout cases, article manual checkpoints do not override existing task authorization |
| Governed MCP tool registry, `mcp-engineering` | [Uber MCP Gateway](https://www.uber.com/us/en/blog/designing-mcp-gateway/), independently read main article. Disabled discovery, owner reviewed config and incremental retrieval are application policies, no protocol conformance run | Change tool description or schema after discovery and before invocation. Bind the enabled version and authority, preserve the old reviewed version. Await focused registry and stale schema cases |
| MCP metadata before invocation, `mcp-engineering` | [Trail of Bits line jumping](https://blog.trailofbits.com/2025/04/21/jumping-the-line-how-mcp-servers-can-attack-you-before-you-ever-use-them/) and [wrapper design](https://blog.trailofbits.com/2025/07/28/we-built-the-security-layer-mcp-always-needed/), crawler read complete main bodies. No wrapper, guardrail or model benchmark run, universal compatibility unverified | A connected server changes parameter descriptions or instructions while the user requests another trusted tool. Keep metadata in its untrusted channel, enforce authority outside the model, visibly escape terminal controls. First review can still accept poison, await publication and pre invocation authority cases |
| Composed executable tool authority, `mcp-engineering/references/tool-dataflow.md` | [Vercel network boundaries](https://vercel.com/blog/a-sandbox-without-a-network-boundary-is-only-half-a-sandbox), [Vercel Run](https://vercel.com/blog/introducing-run) and [Anthropic code execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp), crawler read main text and snippets, no sandbox integration or security verification | Generated code tries unauthorized refund, arbitrary network export and a secret read through permitted compute. Enforce host and egress authority, retain ambiguous committed effects. Await runtime enforcement cases, no broad sandbox package |
| Evidence snapshot and negative evidence, existing `agent-evaluation` candidate and `architecture` | [Cloudflare agentic security operations](https://blog.cloudflare.com/agentic-security-operations/), crawler read complete main text. Versioned subject, time, tenant and admitted evidence scope are beta implementation decisions, not general production assurance | Missing global telemetry must yield an unknown global claim, checked local absence must stay scoped, citation IDs must belong to the admitted snapshot. The selected new package owns grader evidence, extra architecture changes require independent cases |
| Semantic metric definitions, nearest existing `microservice-data`, exact ownership unresolved | [Pinterest Metrics Board](https://medium.com/pinterest-engineering/metrics-board-building-an-agent-ready-metrics-layer-2c8fefe68756), crawler read main prose and shown YAML. [Snowflake semantic routing](https://www.snowflake.com/en/blog/engineering/cortex-agents-unified-data-intelligence/) is an older preview account. No metric runtime or adoption result verified | A definition is published before first computation, or misses quality checks. Return pending or unverified data rather than stale certified output. A distinct semantic governance package needs user demand and its own evaluation, copying protocol guidance would miss this boundary |
| Analytical context and owner corrections, nearest existing `microservice-data`, exact ownership unresolved | [LinkedIn Data Context Layer](https://www.linkedin.com/blog/engineering/infrastructure/inside-linkedins-data-context-layer-curating-trustworthy-context-for-humans-and-agents), crawler read complete substantive text. Stable asset identity and curated context survive generated summary refresh, no benchmark, code or current ACL verification | Similar datasets have different grain and required filters. Keep owner correction through regeneration and fetch full caveats before producing plausible but wrong SQL. Query execution success does not establish analytical meaning, await a discriminating task before new data analysis skill |
| Semantic answer cache eligibility, existing `microservice-operations` cache guidance, AI workflow owner conditional | [Redis semantic cache techniques](https://redis.io/blog/10-techniques-for-semantic-cache-optimization/), crawler read all ten textual sections. Tenant, permission and version guards are authored inference, no LangCache API or cost benchmark executed | Similar account questions cross tenants, permissions are revoked or policy expires. Permit a valid paraphrase but reject false factual reuse, report correctness precision beside hit rate. Await semantic answer oracle and nontrigger cases |
| Client observed cache consistency, `concurrency-correctness` | [Meta cache made consistent](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/), crawler reread complete textual body. Client window metric and delayed authority checks remain workload dependent | A later authority check differs but the permitted client time window did not. Check the declared metric without hiding uncertainty or overwhelming authority. Existing invalidation and stale fill guidance already covers the main mechanism |
| Request collapsing result eligibility, `microservice-operations`, saturation in `overload-control` | [Fastly request collapsing](https://www.fastly.com/blog/request-collapsing-demystified), crawler read complete body and [current collapsing contract](https://www.fastly.com/documentation/guides/concepts/cache/request-collapsing/). Private or unusable responses can repeatedly serialize followers, no provider runtime reproduced | Warm a hot request with a private or zero lifetime response, then expire every follower. Observe origin attempts and follower wait, separate cacheability from shareability. Existing coalescing identity and cancellation coverage fits, await result eligibility and error path cases |
| Causal retry ownership, `microservice-operations` | [Uber retry storms](https://www.uber.com/us/en/blog/protecting-against-retry-storms/), crawler read complete main body. Existing retry coordination already distinguishes originating versus propagated failure, missing internal context and surviving retry opportunity | Break propagation in the middle of a mixed fanout and count residual retry layers. Preserve correlated overload limits. Main mechanism already covered, another retry package or duplicate reference is unwarranted |
| CDC backfill recovery tuple, `stream-processing-design`, maintenance scheduling in `background-maintenance` | [Estuary CDC backfill](https://estuary.dev/blog/postgres-cdc-backfill/), crawler read complete main body. Connector version contracts and examples not independently verified or executed | Restart at 80 percent with cursor, source position, checkpoint, slot and retained log. Then lose the slot or delete rows during outage. Reject restart only and XID only completeness claims. Await real connector or bounded model cases |
| CDC source transaction completeness, `stream-processing-design` | [Decodable transactional boundaries](https://www.decodable.co/blog/aggregating-change-data-capture-events-based-on-transactional-boundaries), crawler read main text, experimental implementation not executed. [RisingWave atomic CDC](https://risingwave.com/blog/atomic-cdc-transactions-in-risingwave/) has unresolved barrier prose contradictions | Later small transaction completes before earlier large transaction, duplicate event must not satisfy expected unique counts. Require an actual sink transaction and bounded durable state. Do not promote article barrier claims until implementation and current contract agree |
| Share consumer acknowledgement dispositions, `messaging-reliability` | [Confluent Share Consumer GA article](https://www.confluent.io/blog/kafka-queue-semantics-share-consumer-ga/), crawler read complete main body. [Current client documentation](https://docs.confluent.io/cloud/current/client-apps/share-consumers.html) was crosschecked and contradicts the article pseudocode: RELEASE retries, REJECT prevents further delivery | Poll while the previous async batch is unfinished, transient failure releases, terminal rejection has durable quarantine, lock expiry overlaps effect. Preserve the contradiction, use installed client docs and execute focused broker boundary cases before adoption |
| Standalone Activity durable acceptance, `temporal-reliability` | Crawler read two primary articles and [current Temporal Standalone Activity documentation](https://docs.temporal.io/standalone-activity). Running conflict and closed reuse policies differ, retention bounds deduplication. No runtime run | Broker redelivery follows a completed activity, same resource path now has a new revision. Acknowledge only durable acceptance and preserve business operation identity. Await targeted Temporal cases, no new orchestration package |
| Native memory owner versus allocator fragmentation, `performance-diagnosis` | [Confluent Flink OOM account](https://developer.confluent.io/blog/flink-oomkills/), crawler read complete body, code and captions. Screenshots and native allocator experiment unexecuted | Repeated job rebuilds leak an old cache absent from current cache metrics. Compare allocated, active, resident, RSS and cgroup slopes before attributing growth. Await native ownership and fragmentation cases, generic runtime reference already supplies the diagnostic owner |
| Observer amplification, `performance-diagnosis` | [Honeycomb tracing Refinery](https://www.honeycomb.io/blog/tracing-refinery), crawler read complete main body. Separate temporary capture is implementation evidence, article trace thresholds are not defaults | An overloaded sampler tails its own telemetry and further overloads itself. Use a bounded independent observation path and measure overhead. Selected trace extension covers evidence limits, extra observer changes need their own case |
| State owner secret authority and rotation, `infrastructure-change-safety` | [Terraform ephemeral values](https://www.hashicorp.com/en/blog/ephemeral-values-in-terraform) and [write only managed resource arguments](https://www.hashicorp.com/en/blog/terraform-1-11-ephemeral-values-managed-resources-write-only-arguments), crawler read main bodies through web tool while direct crawl got 429. Provider versions and renewal or close contracts unverified | Secret store write succeeds, database password update fails. Resume the same intended secret and version from the separate authority, reconcile artifacts. Await provider specific checks, sensitive display suppression does not prove absence from state |
| Backup format versus configuration compatibility, `recovery-validation` | [Litestream v0.5](https://fly.io/blog/litestream-v050-is-here/), crawler read main article. New LTX backup format cannot be assumed to restore old WAL archives, no tool executed | New binary accepts old config but cannot restore the retained backup. Retain a compatible restore engine and verify actual artifact format. Existing restore owner fits, await focused old and new format cases |
| Safe epoch deletion, `background-maintenance`, recovery claims in `recovery-validation` | [Redpanda Level Zero garbage collection](https://www.redpanda.com/blog/cloud-topics-level-zero-garbage-collection), crawler read complete body. Per partition safe epochs and their aggregate minimum are product architecture, no runtime reproduction | Lagging partition, missing member or stale leader must not permit premature deletion. Verify membership and epoch authority. Existing reclaim ownership boundary fits, no new garbage collection package |
| Repair and delayed writes, `background-maintenance` | [ScyllaDB repair based tombstone collection](https://www.scylladb.com/2022/06/30/preventing-data-resurrection-with-repair-based-tombstone-garbage-collection/), crawler read complete body and [current tombstone options](https://docs.scylladb.com/manual/stable/cql/ddl.html#tombstones-gc-options). No live engine run | Delete, repair, collect, then admit an older timestamp write. Successful repair alone cannot justify safe retirement. Require propagation eligibility and table or replication specific contracts before adopting |
| Historical refresh coverage, `stream-processing-design`, `background-maintenance` | [Tiger Data refresh explanation](https://www.tigerdata.com/blog/continuous-aggregate-refresh-demystified) and [refresh policies](https://www.tigerdata.com/blog/continuous-aggregate-refresh-policies-solar-wind-scada), crawler read main bodies and [current policy docs](https://www.tigerdata.com/docs/build/continuous-aggregates/refresh-policies). No live Timescale run, broad competitor claims excluded | Late correction lies outside every refresh window, green recent job and real time tail hide stale history. Check retention interaction and partial batches. Await historical correction cases and installed version checks |
| Stateful stream rescaling, `capacity-planning`, operator compatibility in `stream-processing-design` | [Netflix Flink autoscalers](https://netflixtechblog.com/a-tale-of-two-flink-autoscalers-e9f6a1b1492b), crawler read complete public RSS body while article access stayed 403. Private Flink fork and production numbers unverified | CPU looks idle while operators are busy, fixed sink limit backpressures, rescale resets stabilization and changes forward edge parallelism. Validate checkpoint headroom and operator topology before action. Await engine version and restart cases |
| Transaction snapshot memory bounds, `capacity-planning` | [StreamNative snapshot comparison](https://streamnative.io/blog/a-comparison-of-transaction-buffer-snapshot-strategies-in-apache-pulsar), crawler read complete body. Both reported tests hit OOM and time narrative is inconsistent | Run an abort and retention mix long enough to inspect memory slope and restart loading. Do not convert segmented write savings into memory stability. Await primary implementation contract and measured workload |
| Physical database lock overlap, `database-performance`, invariant authority in `concurrency-correctness` | [Shopify high concurrency deadlocks](https://shopify.engineering/mitigating-deadlocks-in-high-concurrency-environments), crawler read main body. Simplified gap lock explanation still needs current MySQL docs | Logically disjoint accounts overlap physical index or gap locks. Reproduce actual isolation and secondary indexes before changing clustering. Await engine contract, lock observation and update correctness cases |
| Captured database workload replay, `load-testing`, diagnosis in `database-performance` | [Airbnb database capture and replay](https://airbnb.tech/infrastructure/beyond-synthetic-testing-capturing-and-replaying-real-database-workloads-at-airbnb/), crawler read complete main prose. Diagrams and real ProxySQL replay unexecuted | Preserve transaction order, timestamp pacing and the same snapshot for two target comparisons. Captured ID rewrites must leave native ID generation explicitly untested. Await representative replay fidelity and effect isolation cases, no claim of production workload equivalence |
| Retrieval labels and unjudged documents, `failure-oriented-testing`, task quality in `agent-evaluation` | [Elastic search relevance evaluation](https://www.elastic.co/search-labs/blog/evaluating-search-relevance-part-1), crawler read full article. No BEIR experiment reproduced | Duplicate or relevant unjudged document must not silently become a known negative. Audit labels, judge disagreement and query families before a mean nDCG verdict. Existing independent oracle guidance overlaps, await retrieval specific sensitivity cases |
| Verification preserving deprecation, `technical-deprecation` | [Docker Content Trust retirement](https://www.docker.com/blog/docker-content-trust-retirement-and-migration-guidance/), crawler read complete main body. Product dates do not become generic deadlines, no signing or admission experiment | Disabling verification fixes pulls but removes publisher trust, digest pinning proves content identity without authenticated publisher. Verify replacement enforcement and consumer cohorts. Existing deprecation owner fits, await security equivalence case |
| Executable authority descriptors, nearest `mcp-engineering`, exact sandbox ownership unresolved | [Docker Sandbox Kit](https://www.docker.com/blog/docker-sandbox-kit-spec/), crawler read main article and [spec repository README](https://github.com/docker/sandbox-kit-spec). Experimental, normative capability pages and conformance suite unread | Removing deny widens effective authority, ordinary OCI run may leave annotations inert. Require actual host grants and enforcement. Preserve research only status until normative contract and bounded runtime tests exist |
| Trusted proxy identity context, `microservice-integration`, trust operations in `microservice-operations` | Crawler read Tailscale capability article and crosschecked [current Serve docs](https://tailscale.com/docs/features/tailscale-serve). Header stripping, direct backend warning and public Funnel distinction documented, no deployment run | Forged capability header reaches backend directly while proxied valid request succeeds. Enforce path provenance and application permission schema. Existing gateway bypass guidance overlaps, await new capability seam case |

For any deferred extension, first select the nearest existing regression IDs from
that owning package, then add a positive, its failure boundary and a nontrigger.
Do not reuse the selected batch's scores for these mechanisms. Some rows expose
an unresolved capability owner, that is a research gap rather than permission to
create another broadly triggered package.

| Deferred owning package | Existing regression and boundary IDs worth selecting from |
| --- | --- |
| `mcp-engineering` | `private-resource-handle`, `mcp-disconnect-after-effect`, `plain-json-rpc-helper` |
| `stream-processing-design` | `window-finality`, `historical-enrichment`, `local-date-group-nontrigger` |
| `background-maintenance` | `sparse-tail-metadata-pressure`, `reclaim-after-owner-takeover`, `finite-local-cleanup-nontrigger` |
| `microservice-data` | `saga-interleaving`, `stale-projection-authorization`, `local-transaction-nontrigger` |
| `code-and-docs-cleanup` | `similar-policy-cleanup`, `newcomer-setup-path`, `new-export-format` |
| `technical-deprecation` | `periodic-export-client`, `config-channel-migration`, `private-format-helper` |
| `load-testing` | `closed-arrivals`, `generator-ceiling`, `unit-assertion` |
| `capacity-planning` | `zone-loss`, `backlog-drain`, `inventory-only` |
| `temporal-reliability` | Existing shared Temporal corpus: `payment-response-loss`, `compensation-registration-gap`, `calendar-temporal-nontrigger` |

Select cases by the actual changed boundary. This table is a future coverage
starting point, not an assertion that every listed case is relevant to every row
or that an existing generic case proves a new capability.

## Reading and access record

Retrieval, substantive reading and execution are distinct. The crawler archive
counts bodies fetched, while this report uses the reading scopes below. It does
not assert that every archived company article was read.

| Source | Actual reading scope in this workstream | Execution or access limit |
| --- | --- | --- |
| Anthropic agent evaluation | Structure, grader types, agent types, nondeterminism, task design, clean environments, grader validation and maintenance sections | Diagrams and linked benchmarks not reproduced, no agent suite executed |
| NVIDIA task completion | Complete substantive narrative, metric table and example trajectory through benchmarking your workload | Model benchmark claims and figures not reproduced, promotional links not used as evidence |
| Uber CRISP | Complete main textual body including critical path, clock skew, aggregation and hardware selection | Figure captions read, pixels not independently decoded, code and performance results not executed |
| Sentry sampling | Complete substantive main body and shown JavaScript or Python examples | SDK examples not executed, prices not verified, arithmetic inconsistencies excluded |
| OpenTelemetry sampling | Head and tail selection, stateful capacity and combination sections | No collector executed, current documentation can change |
| Collector tail sampler README | Decision timing and cache settings, monitoring, early eviction and late span sections | Mutable main branch, no deployed version pinned or conformance claim |
| PgBouncer features | Pool modes and complete SQL feature matrix | No live pooler or driver verification |
| PostgreSQL 18 locking | Advisory lock semantics and relevant release behavior | No database query executed |
| Cloudflare Hyperdrive MySQL | Complete substantive extracted article supplied by the infrastructure crawler, including both cross cache directions and reset behavior | Web tool returned an access error, crawler public HTTP retrieval succeeded, body independently read from its external archive. Diagram captions read, pixels and commands not executed |
| AWS shuffle sharding | Complete main article from introduction through conclusion | Image descriptions read, diagrams and production claims not reproduced |
| Uber MCP Gateway | Complete main body through conclusion and acknowledgments | Diagrams not independently decoded, no gateway implementation or protocol conformance run |
| gRPC hedging and cancellation | Policy, shared deadline, pushback, throttling and cooperative cancellation sections | No language SDK support verified beyond the displayed guidance |
| Auth0 rotation, revocation and JWKS examples | Key states, rollover impact, revoke prerequisites, cache, stale fallback and refresh rate limits | Mutable documentation and source branch, no identity provider action executed |
| PostHog asynchronous migrations | Discovery and full reading reported by quality crawler, used only as a deferred candidate | This workstream did not independently read its complete body or verify current commands |

## Required implementation evidence

All new case IDs above are authored proposals. Existing IDs identify cases that
should protect their respective boundaries, none was rerun by this research
report. Source reading establishes relevance and mechanisms, packaging validation
establishes package structure, and only a frozen candidate trial with independent
scoring establishes the selected agent behavior.

For the selected batch, the integration owner should author the new cases, freeze
the revised candidate, execute relevant preserved cases plus positive, failure
and nontrigger cases, retain partial or failed attempts, and record independent
scores and critical gates. A new package needs its own two relevant cases and
nontrigger. Shared routing changes also need changed boundary cases for the
affected siblings. Preserve model settings, report exact host and harness, and
leave an unavailable supported host as a gap.

No independent behavioral scores, live collector experiment, live database test,
native host trial or production acceptance was produced by this report. Repository
validation and final selected behavioral checks belong to the integration workstream.
