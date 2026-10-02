# Sources and version limits

Reviewed 2026-09-29. Guidance is original synthesis. The runtime example was observed with **Terraform 1.16.4 on darwin_arm64**, using only `terraform_data`, local state and scratch provisioner effects. It verified partial-apply persistence, fresh-plan recovery, stale-plan rejection after state updates, a same-state move and retained removal. It did not test cloud drift, an external provider, cross-state import or remote locking.

## Books and operating accounts

- Kief Morris, **Infrastructure as Code**, third edition, March 2025. Repository research read complete Chapter 1, printed pages 1–18, from the official 26-page [Thoughtworks excerpt](https://www.thoughtworks.com/content/dam/thoughtworks/documents/books/infra-as-code-3e-free-chapter.pdf). Chapters 19/20 were only introductory previews; complete-book access was not established. The book supports small versioned changes around workload needs; it does not establish Terraform execution guarantees. [Author's edition page](https://infrastructure-as-code.com/book/)
- HashiCorp, **Terraform 1.1 Improves Refactoring and the Cloud CLI Experience**, December 8, 2021. Full substantive article read; its declarative-move account is checked against current language documentation below. [Article](https://www.hashicorp.com/en/blog/terraform-1-1-improves-refactoring-and-the-cloud-cli-experience)
- Cloudflare, **Post mortem on the Cloudflare Control Plane and Analytics Outage**, November 4, 2023. Full substantive article read: hidden dependencies, incomplete failure-domain tests, bootstrap order and recovery load. Speculative physical-failure details and universal availability claims were excluded. [Article](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/)
- PlanetScale, **How PlanetScale makes schema changes**, April 4, 2024. Full substantive article read, covering code/schema sequencing in its Rails/MySQL/Vitess system. Broad product safety language is not adopted as an application guarantee. [Article](https://planetscale.com/blog/how-planetscale-makes-schema-changes)
- AWS Builders' Library, **Timeouts, retries, and backoff with jitter**, Marc Brooker, PDF copyright 2019. Full five-page article read. Used for cold connection setup and bounded retry ownership; no timeout percentile or retry count is prescribed universally. [Article](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf)
- Datadog, **How we scaled fast, reliable configuration distribution to thousands of workload containers**, Gabriel Reid, June 17, 2025. Complete substantive article read on 2026-10-01; diagrams interpreted with adjacent prose, no implementation executed. Supports local configuration copies, routinely exercised snapshot/update paths and bootstrap readiness for small, slowly changing data. Snapshot watermarks, deletion handling and offset/state atomicity are not disclosed; the reference's protocol checks are conditional synthesis. [Article](https://www.datadoghq.com/blog/engineering/scaling-config-delivery-containers/)

## Official contracts

| Source | Inspected scope and applicability |
| --- | --- |
| [Terraform module refactoring](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring) | `moved`, historical chains, instance addressing and provider-dependent type changes; declarative moves require 1.1+. |
| [Terraform state refactoring](https://developer.hashicorp.com/terraform/language/state/refactor) | Cross-state ownership, dependencies and explicit retained removal/import; configuration procedure requires 1.7+. |
| [Removed blocks](https://developer.hashicorp.com/terraform/language/block/removed) | Default destruction versus explicit retention. |
| [Import command](https://developer.hashicorp.com/terraform/cli/commands/import) | Provider-specific identity and one object per managing address. |
| [State locking](https://developer.hashicorp.com/terraform/language/state/locking) | Backend-dependent locking; no lock across independent state files is implied. |
| [Plan](https://developer.hashicorp.com/terraform/cli/commands/plan), [apply](https://developer.hashicorp.com/terraform/cli/commands/apply) | Speculative/saved plans, refresh/target limits, exit codes, sensitive artifacts, partial failure and saved-plan prompt behavior. Pages checked against the 1.16 documentation; local behavior pinned to 1.16.4. |
| [JSON format](https://developer.hashicorp.com/terraform/internals/json-format) | Version compatibility, change actions, import metadata and unknown values. |
| [Terraform source, commit 137cba0](https://github.com/hashicorp/terraform/blob/137cba0aea37d653711ec9e026760eda2b545795/internal/backend/local/backend_local.go) | Saved local plan lineage/serial checks. The absence of a universal remote-freshness guarantee is a code-path inference, not a cloud runtime test. |
| [JSON source at the same commit](https://github.com/hashicorp/terraform/blob/137cba0aea37d653711ec9e026760eda2b545795/internal/command/jsonplan/plan.go) | `forget`, `create,forget`, and import metadata accompanying other actions. This source pin is not a promise about older installed CLIs. |
| [PlanetScale Vitess deploy requests](https://planetscale.com/docs/vitess/schema-changes/deploy-requests) | Current instant/gated deployment, metadata locks, foreign-key validation and revert limits; applies to this product, not every engine. |
| [Apache Kafka 4.3 Design](https://kafka.apache.org/43/design/design/) | Message Delivery Semantics and Log Compaction guarantees checked 2026-10-01: external destinations require output/offset cooperation; deletion-marker retention bounds state reconstruction. Installed Kafka/client versions and the application's snapshot/replay protocol still require inspection. |

Verify the target project's actual CLI/provider versions and current product contract before using API details. Source availability is not proof of a successful production deployment.

## Schema evolution follow-up, 2026-10-02

- Ian Rae, Eric Rollins, Jeff Shute, Sukhdeep Sodhi and Radek Vingralek,
  **Online, Asynchronous Schema Change in F1**, PVLDB 6(11), August 2013,
  pp. 1045–1056. [Official full text](https://research.google.com/pubs/archive/41376.pdf).
  Complete extracted text across all 12 pages read on 2026-10-01: abstract,
  §§1–9, proofs and references, plus extracted figure labels/captions and table
  text. Rendered figure/table pixels were not independently inspected. Used for
  adjacent engine-schema compatibility, intermediate index permissions and
  eligibility enforced at storage commit. This historical implementation does
  not establish current Spanner internals or application rollout leases.
- Shlomi Noach, **gh-ost: GitHub’s online schema migration tool for MySQL**,
  [2016-08-01 account](https://github.blog/news-insights/company-news/gh-ost-github-s-online-migration-tool-for-mysql/).
  Entire substantive article text through acknowledgements read on 2026-10-01;
  navigation/related posts excluded, diagrams not independently inspected.
  Supports separating copy/catch-up, workload control and cutover. Its historical
  MySQL limitations are not a current engine capability matrix.
- Hammad Khalid and co-authors, **Horizontally scaling the Rails backend of Shop
  app with Vitess**, [2024-01-17 account](https://shopify.engineering/horizontally-scaling-the-rails-backend-of-shop-app-with-vitess).
  Entire substantive article text, all migration phases, schema-cache and cleanup
  sections read on 2026-10-01; images not independently inspected. Supports
  observing all-shard readiness and checking reverse-stream ordering before
  promising a rollback route. Its timings/results are not our measurements.

Selected live contracts rechecked on 2026-10-02:

| Source | Read scope and limit |
| --- | --- |
| Vitess 24.0 [postponed migrations](https://vitess.io/docs/24.0/user-guides/schema-changes/postponed-migrations/), [reversion](https://vitess.io/docs/24.0/user-guides/schema-changes/revertible-migrations/), [strategy flags](https://vitess.io/docs/24.0/user-guides/schema-changes/ddl-strategy-flags/) | Completion command versus observed completion; complete revert limitations/implementation; retention and instant-path flags. Supported ALTER reversion catches up from recorded cutover GTID and can fail when new data does not fit the old schema. The revert page's 24h statement and newer retention overrides require checking actual deployed configuration; no universal window is prescribed. |
| PostgreSQL 18 [CREATE INDEX](https://www.postgresql.org/docs/18/sql-createindex.html) | Concurrent-build section and related parameter notes: validity, transaction/snapshot waits and failed unique-index enforcement. Index publication is engine-specific; online creation does not establish application compatibility. |
| Active Record [ModelSchema API](https://api.rubyonrails.org/classes/ActiveRecord/ModelSchema/ClassMethods.html#method-i-ignored_columns-3D) | `ignored_columns` getter/setter and cached-schema rationale. Model-generated SQL exclusions do not constrain handwritten SQL or other writers. Verify the target Rails version. |

Incarnation/revision guards, consistent row observations, rollback writer floors
and bidirectional expected-state checks are original application synthesis.
They are conditional on the authority's actual primitives; no database migration,
model trial or production validation was executed for these additions.
