# Infrastructure and reliability research

Verified 2026-09-29. This lane surveys ten first-party publishers and deeply reads
four articles. The [structured source register](infra.json) separates surveyed
candidates from complete reads and records access limits. Selection favors a
concrete failure mechanism over a company's size or popularity.

## Coverage and useful additions

The existing `microservice-operations` skill already covers end-to-end deadlines,
retry layers, bulkheads, bounded queues, cold caches, and recovery surges.
`graceful-draining` covers retiring-generation admission, checkpoint ownership,
independent retry budgets, and forced interruption. Temporal production readiness,
reliability, and safe deployments already distinguish engine health, business
effects, replay compatibility, and external-effect safety. Preserve those owners;
new skills should supply infrastructure state-change and restore evidence rather
than repeat the same rules.

| Priority | Addition | Observable completion |
|---|---|---|
| 1 | Recovery validation across a complete failure domain | Restore and business checks pass while the declared failed domain remains unavailable. |
| 1 | Infrastructure identity and state transitions | Reviewed plan preserves intended physical objects; ownership and dependency changes are accounted for. |
| 1 | Runtime contract verification | Configured stop behavior matches current platform docs and observed signals/interruption. |
| 2 | Retry and startup budget evidence | Attempts, resource occupancy, and backlog recovery stay within stated limits. |

Cloudflare's incident shows why the recovery test boundary matters: its tests had
left some colocated dependencies available. Recovery also encountered accumulated
request pressure and dependency-ordered bootstrapping. This supports testing the
whole claimed domain and controlled traffic restoration, not inferring recovery
from surviving replicas. [Incident report](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/)

HashiCorp's release account motivates reviewable address transitions alongside
configuration changes. Current documentation sharpens the implementation:
same-state `moved` declarations differ from cross-state `removed`/`import`
migrations. Preserve historical moves for supported upgrade paths; check provider
import identity and inspect both plans. [Release account](https://www.hashicorp.com/en/blog/terraform-1-1-improves-refactoring-and-the-cloud-cli-experience),
[module refactoring](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring),
[state migration](https://developer.hashicorp.com/terraform/language/state/refactor)

As an implementation inference, a multi-workspace transfer needs an explicit
change window and recovery procedure covering the interval between source removal
and destination import. An individual backend lock does not establish a single
transaction across both workspaces. Inspect actual backend locking support;
force-unlocking another active writer can create concurrent writes. [State
locking](https://developer.hashicorp.com/terraform/language/state/locking)

## Advice that needs current contracts

Fly's historical drain article is useful for tracing application-specific signal
semantics and proxy dependencies. Its dedicated-VM 24-hour allowance is obsolete
for current Machines guidance: the current configuration reference permits at
most 300 seconds and calls the allowance best-effort. For the user's 12–24-hour
jobs, this makes verified resumable progress essential on that platform.
[Historical article](https://www.fly.io/blog/graceful-vm-exits-some-dials/),
[current runtime options](https://docs.fly.io/reference/configuration/#runtime-options)

The AWS article's transferable practice is bounded retry ownership and complete
timeout accounting. Use installed SDK behavior for exact defaults, retryable
errors, and quota scope; current documentation explicitly distinguishes total
attempts from retries. Confirm the duplicate-safety contract independently of
whether the client automatically retries. [AWS article](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf),
[current SDK retry behavior](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html)

## Survey and next reading path

The ten publishers are [AWS](https://builder.aws.com/learn/topics/builders-library),
[Google](https://research.google/blog/),
[Microsoft](https://devblogs.microsoft.com/engineering-at-microsoft/),
[Cloudflare](https://blog.cloudflare.com/), [Fastly](https://www.fastly.com/blog),
[Datadog](https://www.datadoghq.com/blog/engineering/),
[Grafana Labs](https://grafana.com/blog/),
[Honeycomb](https://www.honeycomb.io/blog),
[HashiCorp](https://www.hashicorp.com/en/blog), and [Fly.io](https://fly.io/blog/).
Company domains, index branding, staff authors, and official product/documentation
links establish publisher provenance. AWS's index redirects to a client-rendered
site; the article's first-party PDF supplied its complete text.

Follow-up candidates in the register include Honeycomb's cold-cache incident,
Datadog's recovery tooling and Kafka abstractions, Fastly's configuration-triggered
outage, and Grafana's gateway load testing. Their deployment sizes and custom
abstractions are examples to investigate, not defaults to copy. Google's scheduling
article is mathematical research; verify its arrival assumptions before applying
it to real queues. Microsoft's flaky-test account belongs with testing workflow
research. These candidates were surveyed, not included in the four complete reads.

## Evaluation scenarios to adopt

- **False resilience:** three service replicas survive a simulated host loss, but
  their restore tool or configuration store remains in the missing facility.
  Passing requires identifying and removing the untested dependency assumption.
- **Stateful rename:** a Terraform database address changes while its physical
  identity must remain. Passing requires a reviewed migration plan, version/provider
  checks, and supported upgrade paths; a textual rename alone fails.
- **Interrupted transfer:** source ownership is removed before target import
  succeeds. Passing requires discoverable resources, paused competing changes,
  and a bounded recovery procedure without recreating the database.
- **Stale shutdown advice:** a historical article suggests a 24-hour stop allowance
  for a platform now documenting a five-minute best-effort limit. Passing requires
  a verified finish-or-resume design and an earlier-interruption check.
- **Recovery storm:** dependency service returns while clients and queued work
  retry simultaneously. Passing requires bounded admission/retries and measured
  backlog completion without duplicate effects.

These are proposed evaluations. This research lane ran no production fault
injection, infrastructure apply, restore, or runtime benchmark.
