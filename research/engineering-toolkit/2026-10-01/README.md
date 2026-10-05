# Distributed systems research — 1 October 2026

This pass revisits **the same 60 publishers** from the original survey. It indexes
**58,178 normalized metadata URLs** and records **29 selected complete substantive
text readings**. Indexing is not article reading, and terminal pagination or a
finite sitemap does not establish every article a publisher has ever published.
The scope includes system design, data placement, capacity, interface evolution,
continuous computation and maintainability, alongside reliability failures.

The [archive manifest](archive-manifest.json) binds each inventory and coverage
record to its exact SHA-256. The crawl index files are stored in the external
[research crawl archive](../../MANIFEST.md#archived-files), which lists their
original repository paths, byte sizes, hashes, record counts, and planned release
URL. The [selected readings](selected-readings.json)
deduplicate the 29 article URLs and link their actual read scope and practice
cards. Every adopted practice identifies its trigger, problem, mechanism,
applicability limits, counterexample and proposed or executed verification.
Company results remain evidence about those workloads, not toolkit benchmarks.

## Coverage and access boundaries

| Lane | Metadata URLs | Selected articles | Evidence |
| --- | ---: | ---: | --- |
| Backend | 2,924 | 4 | [Archive and findings](backend/README.md) |
| Storage | 9,045 | 4 | [Archive and findings](storage/README.md) |
| Messaging | 6,345 | 4 | [Archive and findings](messaging/README.md) |
| Infrastructure | 10,924 | 4 | [Archive and findings](infra/README.md) |
| Quality | 13,099 | 5 | [Archive and findings](quality/README.md) |
| Agent systems | 15,841 | 5 | [Archive and findings](agents/README.md) |
| Requested retry follow-up | Not added to these inventory totals | 3 | [Uber/AWS readings](uber-retry-storms.md) |

Counts describe URL metadata records, not distinct intellectual works. Agent-system
counts include 1,016 labeled Vercel release notes, 121 Hugging Face partner/community
records, and one separately selected Pinterest article. Infrastructure includes two
explicit supplemental readings; one comes from Google Cloud rather than the
surveyed Google Research archive. Stripe's 234-row legacy corporate supplement is
excluded from the main total because its historical Engineering taxonomy is unresolved.
Alias normalization cannot prove semantic equivalence for every unread URL.

Known history/access gaps include Pinterest and Airbnb Medium archives, Netflix's
pre-2020 archive, Stripe's historical classification, JetBrains child maps,
Discord's whole-blog history, eleven initially empty LinkedIn categories, and
MongoDB's repeated API page. Shopify's feed contains entries omitted by its HTML
archive; those were reconciled. Spotify's CMS archive dates are preserved separately
from verified publication dates. Sitemap `lastmod` is never substituted for publication.
Unknown titles/dates remain null or explicitly inferred; their exact counts and
endpoint terminal observations are in each lane's coverage record.

Collectors use public publisher endpoints and bounded timeouts. Request policies
and actual deviations are recorded: some early automatic redirect hops lack
separate pacing evidence, and Airbnb's initial pass continued after rate limits;
its reproducer now stops immediately on HTTP 429. In the infrastructure lane,
final response hashes identify a separate revalidation pass where original hashes
were unavailable. These records retain the limitations of what actually happened.
Full article bodies, hydration payloads and temporary caches are not bundled.

## Implemented guidance

The user approved two new independently installable skills:

- [Stream processing design](../../../skills/engineering/stream-processing-design/SKILL.md):
  time domains, out-of-order and late arrivals, logical duplicates, corrections,
  joins, finality, replay and state lifetime. Operator contributions and external
  business effects have separate contracts.
- [Background maintenance](../../../skills/engineering/background-maintenance/SKILL.md):
  backfills, compaction, reclamation and rebalancing alongside serving; distribution-aware
  policy, constrained resources, useful yield, durable progress and retirement authority.

Focused conditional branches deepen existing packages:

| Concern | Guidance |
| --- | --- |
| Topology and ownership | [Partition choice and movement](../../../skills/engineering/distributed-system-patterns/references/partitioning-and-movement.md), and [asynchronous ownership transfer](../../../skills/engineering/distributed-system-patterns/references/ownership.md) |
| Read-model decisions | [Analytical semantics and physical design](../../../skills/engineering/architecture/references/analytical-read-models.md) |
| Parallel result publication | [Disjoint results, generations and readiness](../../../skills/engineering/microservice-data/references/result-publication.md) |
| Interface evolution | [Behavioral compatibility and affected-path evidence](../../../skills/engineering/microservice-integration/references/compatibility.md) |
| Capacity and admission | [Prepared survivor capacity and useful completion](../../../skills/engineering/microservice-operations/references/capacity.md) |
| Retry amplification | [Retry coordination](../../../skills/engineering/microservice-operations/references/retry-coordination.md) |
| Configuration rollout | [Snapshot/update distribution](../../../skills/engineering/infrastructure-change-safety/references/configuration-distribution.md) |
| Service extraction | [Executable boundary rehearsal](../../../skills/engineering/microservice-extraction/references/boundary-rehearsal.md) |
| Failure testing | [Independent state models](../../../skills/engineering/failure-oriented-testing/references/state-models.md) |
| Agent recovery | [Task, execution, artifacts and receipt lifetime](../../../skills/engineering/a2a-engineering/references/lifecycle-and-effects.md) |

Existing messaging and reliability specialists now declare the two new skill
dependencies. The roster remains **15 agents and eight workflows**; conditional
routing avoids introducing another orchestration layer. Sources such as NAT path
selection, telemetry budgeting and outbox replication remain useful reading cards
where the current packages already cover the underlying contract or further
implementation-specific evidence is needed. A read article does not automatically
justify another skill.

## Review and observable evidence

The [existing-adoption review](review-existing-adoptions.md),
[stream review](review-stream-processing.md), and
[Uber source review](infra/review-uber-source.md) distinguish findings and source
limits from runtime results. Moved corrections were tightened so both source and
destination admission are resolved before either contribution changes; an immutable
window cannot be changed by a partial move. Maintenance proof/admission and feedback
sign corrections are recorded with its package review.

The original [loopback retry example](../../../examples/retry-coordination/README.md)
passed eight author and eight independent checks. Actual HTTP peers demonstrate
nested call amplification and partial propagation; causal classification and budget
schedules are explicitly bounded models. This does not reproduce Uber's middleware,
transparent RPC retries, production quotas, crash durability or network ambiguity.
The [runtime review](review-retry-coordination.md) records closed sockets and owned
threads, the protected fixture scope and source hashes. The first successful author
report is retained separately from the proxy-independent corrected candidate.

The [native skill trial archive](../../../evals/engineering-toolkit/runs/2026-10-01/README.md)
retains nine attempts across all six authored cases. Six completed reviews were
independently scored: **four pass and two partial**. Two startup failures and one
timeout remain visible. The partials concern omitted validation/effect-boundary
details, with their exact scores and observations retained. Every attempt has
inherited-environment limitations and `case_compliant: false`; no causal uplift or
production-engine claim follows from these observations.

The [both-host installation](installation.json) records dependency closure,
repeat installation, preserved settings, and an unowned collision. The later
[packed npx installation](launcher-installation.json) exercises the selectable
launcher against its actual distribution, with complete runtime imports and
protected host configuration. These are filesystem installation observations;
structural packaging, source reading and proposed fault schedules do not establish
native delegation or production correctness. The
[integration review](review-integration.md) preserves discovered archive-binding
gaps, corrections, and independently checked negative controls.

After publication, a [fresh installation from public GitHub](public-installation.json)
resolved the chosen workflow and skill for both hosts and repeated with zero
changes. The [release record](release-record.json) binds the successful 438-test
CI run to `fe36680`. The [later focused research](../../distributed-systems-followup/2026-10-01/README.md)
is a separate batch; its counts are not silently added to this archive pass.

## Publisher inventory

The following table is an index into coverage evidence, not a completeness ranking.
A marked history/access gap remains unresolved even where a narrower sitemap/feed
or current category reached its terminal. All other entries still have the general
unlisted, deleted and private-history boundary described above.

| Publisher | Lane | Metadata URLs | History/access gap | Coverage |
| --- | --- | ---: | --- | --- |
| OpenAI | agents | 36 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-openai-coverage-json) |
| Anthropic | agents | 25 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-anthropic-coverage-json) |
| Hugging Face | agents | 871 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-hugging-face-coverage-json) |
| LangChain | agents | 529 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-langchain-coverage-json) |
| Vercel | agents | 1,673 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-vercel-coverage-json) |
| Databricks | agents | 3,435 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-databricks-coverage-json) |
| Snowflake | agents | 265 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-snowflake-coverage-json) |
| NVIDIA | agents | 5,277 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-nvidia-coverage-json) |
| Pinterest | agents | 11 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-pinterest-coverage-json) |
| Twilio | agents | 3,719 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-agents-twilio-coverage-json) |
| Netflix | backend | 219 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-netflix-coverage-json) |
| Uber | backend | 768 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-uber-coverage-json) |
| Stripe | backend | 26 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-stripe-coverage-json) |
| Shopify | backend | 432 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-shopify-coverage-json) |
| GitHub | backend | 175 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-github-coverage-json) |
| Slack | backend | 194 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-slack-coverage-json) |
| Airbnb | backend | 71 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-airbnb-coverage-json) |
| Spotify | backend | 288 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-spotify-coverage-json) |
| DoorDash | backend | 341 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-doordash-coverage-json) |
| Dropbox | backend | 410 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-backend-dropbox-coverage-json) |
| AWS | infra | 31 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Google | infra | 1,617 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Microsoft | infra | 31 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Cloudflare | infra | 3,641 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Fastly | infra | 1,039 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Datadog | infra | 102 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Grafana Labs | infra | 2,029 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Honeycomb | infra | 669 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| HashiCorp | infra | 1,563 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Fly.io | infra | 202 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-infra-coverage-json) |
| Confluent | messaging | 1,408 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| Temporal | messaging | 433 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| Redpanda | messaging | 437 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| StreamNative | messaging | 365 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| RabbitMQ project | messaging | 181 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| Synadia / NATS | messaging | 297 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| Estuary | messaging | 773 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| Materialize | messaging | 180 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| RisingWave | messaging | 2,125 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| Decodable | messaging | 146 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-messaging-coverage-json) |
| JetBrains | quality | 2,294 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Docker | quality | 948 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Sentry | quality | 926 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| PostHog | quality | 358 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Tailscale | quality | 405 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| GitLab | quality | 2,301 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Snyk | quality | 2,052 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Trail of Bits | quality | 526 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Elastic | quality | 3,127 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Discord | quality | 162 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-quality-coverage-json) |
| Meta | storage | 1,126 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| LinkedIn | storage | 923 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| Cockroach Labs | storage | 901 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| MongoDB | storage | 1,408 | Yes | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| Redis | storage | 1,122 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| ScyllaDB | storage | 1,021 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| Tiger Data (formerly Timescale) | storage | 548 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| PlanetScale | storage | 321 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| Yugabyte | storage | 776 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
| ClickHouse | storage | 899 | See scope | [Evidence](../../MANIFEST.md#file-docs-research-engineering-toolkit-2026-10-01-storage-coverage-json) |
