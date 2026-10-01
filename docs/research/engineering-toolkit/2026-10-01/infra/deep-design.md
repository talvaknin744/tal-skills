# Infrastructure: positive design mechanisms

Verified 2026-10-01. Exactly **three new article text deep reads**, with twelve
current documentation/maintainer cross-checks and one historical example-policy
section check, are recorded in [the structured register](deep-design.json).
This is research; no skill, package, runtime experiment, deployment, fault
injection, or model evaluation was created or executed.

## Reading and deduplication boundary

The prior [infra lane](../../lanes/infra.json), all extension JSON registers, the
cache-load-protection and failure-evidence narratives, and the current
`microservice-operations`, `distributed-system-patterns`, and
`infrastructure-change-safety` entrypoints were inspected for overlap. Exact URL
matching found only the Grafana article in an earlier **candidate survey**; none
of these three was an existing complete read. Retry ownership, bulkheads, cache
surges, recovery-domain validation, and Terraform identity remain covered by
their existing owners.

| Article and first-party provenance | Date and actual read scope |
| --- | --- |
| AWS, Becky Weiss and Mike Furr, [Static stability using Availability Zones](https://d1.awsstatic.com/builderslibrary/pdfs/static-stability-using-availability-zones.pdf) | Publication date not established; PDF copyright 2019. Complete text of all ten PDF pages: separation of planes, both serving patterns, zonal foundation, deployment and durability tradeoffs. Diagram pixels were not inspected. |
| Google Cloud, Myk Taylor (Site Reliability Engineer), [Shrinking the impact of production incidents using SRE principles](https://cloud.google.com/blog/products/devops-sre/shrinking-the-impact-of-production-incidents-using-sre-principles-cre-life-lessons) | Structured publication date 2019-09-09; live localized display 2019-09-10, with `published_time` carrying `+0300`. Editorial clarification 2019-12-12. Complete article text and captions through the footnote; linked articles/videos and graph pixels not read. Browser follow-up fetches timed out; direct HTTPS retrieval from the same official URL supplied the remaining body and metadata. |
| Grafana Labs, Fatjon Nebiu and Marco Musso (Professional Services), [How to scale Alloy as a central telemetry gateway](https://grafana.com/blog/how-to-scale-alloy-as-a-central-telemetry-gateway-capacity-planning-load-testing-and-production-lessons/) | 2026-08-21. Complete article text, code blocks and captions: sizing, gateway topology, generators, metrics, production claims, lessons and deferred work. Diagram/dashboard pixels and linked load scripts not inspected. |

“Complete” here means the article's accessible textual body, not complete access
to every embedded graphic or linked implementation. An anonymized customer
account and historical design examples do not establish reproduced benchmarks.

## Six-dimension practice cards

These cards are conditional application transfers. Verification steps are
proposals, not claims that the publishers or this task executed those schedules.

### INFRA-DESIGN-STATIC — Continue useful serving during control failure

- **Trigger:** A replicated service promises to survive a zone or provisioning impairment.
- **Problem:** Replacement-based recovery adds launch and startup dependencies during failure.
- **Mechanism:** Separate serving from changes; keep usable state and survivor capacity ready before loss. Choose zonal isolation where foundational dependencies require it. [AWS article](https://d1.awsstatic.com/builderslibrary/pdfs/static-stability-using-availability-zones.pdf)
- **Limits:** Capacity, durability, and permitted stale configuration need independent contracts. Zone-local routing is a conditional topology choice; normal regional composition remains valid.
- **Counterexample:** Three replicas share one zonal egress path, or survivors require a fresh configuration download before serving.
- **Verification:** In a scoped rehearsal, remove one domain and deny provisioning/config updates; measure successful operations and survivor saturation, then verify update resumption.

### INFRA-DESIGN-SLO-COST — Buy the reliability the operation needs

- **Trigger:** A team must choose reliability work, extra capacity, or feature delivery.
- **Problem:** Infrastructure uptime and unpriced “more nines” do not identify valuable improvements.
- **Mechanism:** Define eligible user outcomes and an SLO; use observed incident phases and written learning to prioritize reliability spending. [Google article](https://cloud.google.com/blog/products/devops-sre/shrinking-the-impact-of-production-incidents-using-sre-principles-cre-life-lessons)
- **Limits:** The article's cost curve is explanatory, not a transferable cost law. Availability budgets do not permit corruption or waive security obligations.
- **Counterexample:** Good average success hides a critical tenant's repeated failures; additional replicas do not repair the user's limiting dependency.
- **Verification:** Compare alternatives with the same outcome definition, window, failure consequences, and cost assumptions; retain the worse-case cohort and review the decision after measurement.

### INFRA-DESIGN-TELEMETRY — Observe the ingestion path while it is stressed

- **Trigger:** Many producers depend on a shared telemetry gateway.
- **Problem:** Centralization can concentrate pressure and hide its own failure.
- **Mechanism:** Keep gateway diagnostics on a separate path; size an immediately usable baseline and test signal mixes through the real ingress. [Grafana article](https://grafana.com/blog/how-to-scale-alloy-as-a-central-telemetry-gateway-capacity-planning-load-testing-and-production-lessons/)
- **Limits:** Customer sizing and utilization thresholds are examples. A separate collector route can still share destination, credentials, network or cluster resources.
- **Counterexample:** Accepted-span counts rise while export fails; adding pods cannot lift a downstream tenant quota.
- **Verification:** Reconcile generated, admitted, retried, rejected, and delivered identities during pressure and restart; check diagnostic visibility and catch-up after recovery.

## Current-contract corrections

**AWS examples need mode and client boundaries.** Current guidance preserves
pre-provisioned capacity and avoiding recovery-path changes. It does not certify
an application's configuration, credential-refresh or discovery dependencies.
[Static-stability guidance](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/static-stability.html)

For **zonal** NAT, sharing one gateway across zones imports its failure domain.
Current regional NAT is a distinct option; expansion to a newly occupied zone can
take up to 60 minutes, during which traffic crosses zones. Regional NAT does not
support private NAT. Inspect the actual availability mode and warmed topology;
the article's universal-sounding zonal example is historical.
[Zonal NAT basics](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html),
[regional NAT](https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateways-regional.html)

An RDS Multi-AZ DB instance can fail over automatically, but existing connections
must be re-established and DNS caching matters. Include a client reconnection
path and a recovery interval. This check covers DB instances, not every RDS
deployment type. [RDS failover](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html)

**Cost decisions need bounded objectives.** Google's current framework asks for
cost-benefit analysis, application consequences and RTO/RPO. Its illustrative
availability target is not a universal default.
[Realistic reliability targets](https://docs.cloud.google.com/architecture/framework/reliability/set-targets)
The workbook's policy explicitly accommodates security fixes and scoped users;
its window and numeric thresholds are an example, not this toolkit's policy.
[Example policy, SLO Miss Policy](https://sre.google/workbook/error-budget-policy/)

**Telemetry buffering is component-specific.** Current Alloy documentation
identified itself as **v1.20 (latest)** on inspection. For `otelcol.exporter.otlp`,
retrying is enabled by default, with a default five-minute elapsed limit before
discard. Its default queue is in memory; configured storage supplies persistence.
Overflow returns a retryable error unless configured to block. Component health
alone checks configuration and cannot prove delivery.
[OTLP exporter](https://grafana.com/docs/alloy/latest/reference/components/otelcol/otelcol.exporter.otlp/)

`prometheus.remote_write` has its own metric WAL and truncation/retention rules;
unsent samples can be lost. It is not a blanket durability contract for logs and
traces. [Remote-write retention](https://grafana.com/docs/alloy/latest/reference/components/prometheus/prometheus.remote_write/#data-retention)

The Go runtime's `GOMEMLIMIT` is soft and excludes memory the runtime does not
manage. It may exceed the target to avoid pathological collection; live queued
payloads remain live. Treat a GC-driven CPU increase as observed behavior to
validate, not a dependable admission or autoscaling protocol.
[Go memory limit](https://go.dev/doc/gc-guide#Memory_limit)
HPA utilization is a percentage of resource **requests**, and its control loop
runs intermittently. Verify requests, metric availability, readiness and node
capacity before assigning meaning to thresholds.
[HPA mechanics](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/#how-does-a-horizontalpodautoscaler-work)

A receiver refusal or failed send records a stage outcome, not necessarily
terminal end-to-end loss. Metric names also depend on Collector version and
export format. [Internal telemetry](https://opentelemetry.io/docs/collector/internal-telemetry/#summary-of-values-observable-with-internal-metrics)
Alloy's limiter documentation describes rejection; the pinned upstream contract
clarifies non-permanent errors and required predecessor retry. Neither GC nor
refusal guarantees preservation when upstream retention expires.
[Alloy limiter](https://grafana.com/docs/alloy/latest/reference/components/otelcol/otelcol.processor.memory_limiter/),
[pinned upstream functionality](https://github.com/open-telemetry/opentelemetry-collector/blob/17657ded70ae99a74637ae43859a58f737fa08cf/processor/memorylimiterprocessor/README.md#functionality)
The pinned upstream file is a maintainer cross-check, not proof of the dependency
revision shipped inside a particular Alloy binary.

## Placement decision and proposed checks

Recommend conditional references under **existing skills**, with no distinct new
public skill. `microservice-operations` already owns capacity, telemetry and user
objectives. Its missing depth is a control/serving dependency inventory, a costed
SLO decision, and a telemetry delivery/diagnostic boundary.
`distributed-system-patterns/references/serving.md` could point to the isolation
decision; `infrastructure-change-safety/references/rollout.md` could point to
pre-existing survivor capacity. These are placement recommendations only.

| Case | Original proposed discriminating check | Passing evidence |
| --- | --- | --- |
| `INFRA-STATIC-01` | Compare surviving warmed replicas with a design that needs replacement. Deny launch/config calls during domain loss; separately expire required local state. | The declared operation meets its scoped target without forbidden control calls; stale-state policy remains safe and update recovery succeeds. |
| `INFRA-SLO-COST-01` | Give a cheap aggregate-success improvement and a costlier critical-cohort improvement. Include one integrity failure outside the availability budget. | The decision prices the actual outcome, preserves the integrity constraint, and records assumptions that would reverse the choice. |
| `INFRA-TELEMETRY-01` | Send finite identifiable spans while the sink rate-limits, then restart the gateway; compare memory and persistent queues and expire a retry budget. | Reconciled sink results expose loss/duplicates instead of equating admission with delivery; bounded resources, observable failure and a measured recovery deadline hold. |

No passing outcomes are claimed. A local model can test bookkeeping but cannot
certify AWS zone isolation, sink persistence, deployed HPA behavior or a production
workload. The environment, authorization and acceptance boundary must be supplied
before those experiments run.
