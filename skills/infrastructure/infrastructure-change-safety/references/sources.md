# Sources and version limits

Reviewed 2026-09-29. Guidance is original synthesis. The runtime example was observed with **Terraform 1.16.4 on darwin_arm64**, using only `terraform_data`, local state and scratch provisioner effects. It verified partial-apply persistence, fresh-plan recovery, stale-plan rejection after state updates, a same-state move and retained removal. It did not test cloud drift, an external provider, cross-state import or remote locking.

## Books and operating accounts

- Kief Morris, **Infrastructure as Code**, third edition, March 2025. Repository research read complete Chapter 1, printed pages 1–18, from the official 26-page [Thoughtworks excerpt](https://www.thoughtworks.com/content/dam/thoughtworks/documents/books/infra-as-code-3e-free-chapter.pdf). Chapters 19/20 were only introductory previews; complete-book access was not established. The book supports small versioned changes around workload needs; it does not establish Terraform execution guarantees. [Author's edition page](https://infrastructure-as-code.com/book/)
- HashiCorp, **Terraform 1.1 Improves Refactoring and the Cloud CLI Experience**, December 8, 2021. Full substantive article read; its declarative-move account is checked against current language documentation below. [Article](https://www.hashicorp.com/en/blog/terraform-1-1-improves-refactoring-and-the-cloud-cli-experience)
- Cloudflare, **Post mortem on the Cloudflare Control Plane and Analytics Outage**, November 4, 2023. Full substantive article read: hidden dependencies, incomplete failure-domain tests, bootstrap order and recovery load. Speculative physical-failure details and universal availability claims were excluded. [Article](https://blog.cloudflare.com/post-mortem-on-cloudflare-control-plane-and-analytics-outage/)
- PlanetScale, **How PlanetScale makes schema changes**, April 4, 2024. Full substantive article read, covering code/schema sequencing in its Rails/MySQL/Vitess system. Broad product safety language is not adopted as an application guarantee. [Article](https://planetscale.com/blog/how-planetscale-makes-schema-changes)
- AWS Builders' Library, **Timeouts, retries, and backoff with jitter**, Marc Brooker, PDF copyright 2019. Full five-page article read. Used for cold connection setup and bounded retry ownership; no timeout percentile or retry count is prescribed universally. [Article](https://d1.awsstatic.com/builderslibrary/pdfs/timeouts-retries-and-backoff-with-jitter.pdf)

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

Verify the target project's actual CLI/provider versions and current product contract before using API details. Source availability is not proof of a successful production deployment.
