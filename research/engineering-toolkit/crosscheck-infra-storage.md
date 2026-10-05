# Infrastructure and storage cross-check

Independent review on 2026-09-29 of [the storage records](lanes/storage.json) and [synthesis](lanes/storage.md). The four principal articles and the contract sections cited below were retrieved independently. Recommendations are for subsequent implementation; no infrastructure, account policy, database or recovery drill was changed.

## Storage findings and qualifications

**Recovery authorization needs an isolated rehearsal.** The ClickHouse launch article demonstrates restoring into a new service whose identity must receive access to the external backup. Refine “deny old-service identity” to “in an isolated rehearsal, make the old identity unavailable to the restore process.” Revoking a production identity is neither necessary nor implied. The test must fail when the replacement identity lacks access, then succeed after the intended access is configured. [Launch article](https://clickhouse.com/blog/introducing-external-backups-on-clickhouse-cloud)

**Backup dependencies are format-specific.** Current ClickHouse external backups are complete, independent backups. Do not require an incremental chain for this product; inventory such chains only when the selected backup mechanism needs them. The current guide describes configurable retention and schedules, so historical launch defaults should not become instructions. `ASYNC` success acknowledges a request; inspect `system.backups` for terminal completion. A further application-state check is our acceptance recommendation, not a guarantee supplied by the backup API. [Current restore guide](https://clickhouse.com/docs/products/cloud/guides/backups/bring-your-own-backup/backup-restore-from-ui)

**Schema tooling cannot establish application compatibility.** The PlanetScale article supports sequencing code and schema separately. Current Vitess documentation adds explicit restrictions: instant deployments cannot be gated or reverted; acquiring metadata locks may terminate queries; foreign-key addition does not validate existing rows. The ordinary revert window is limited, and reverting a newly introduced column loses data held only there. These are product-specific facts. The recommended compatibility matrix must include old background workers and actual rollback data, rather than treating a successful DDL operation as sufficient evidence. [Operating account](https://planetscale.com/blog/how-planetscale-makes-schema-changes), [current deploy-request contract](https://planetscale.com/docs/vitess/schema-changes/deploy-requests)

**Freshness measurement must retain its scope.** Meta's reported reliability concerns cache writes converging within a stated window, not every read being linearizable. Record sampled population, observation interval and tolerated lag. An apparent missing old value can instead reflect a newer deletion, requiring a bounded authority check. Redis separately documents an invalidation/fill race across connections and flushing local cache after invalidation-connection loss. Those mechanisms concern the client cache; they do not make a separate database/cache pair atomic. [Meta account](https://engineering.fb.com/2022/06/08/core-infra/cache-made-consistent/), [Redis tracking contract](https://redis.io/docs/latest/develop/reference/client-side-caching/)

**Preserve the actual Jepsen failure.** Cockroach's historical checker already permitted ambiguous outcomes. The discovered implementation bug exposed effects despite an unambiguous failure; it was not merely a checker misclassifying an unknown commit. Use two separate cases: uncertainty that permits a committed write, and a definitely rejected operation whose visible effect is a violation. Current CockroachDB distinguishes transaction-restart errors from ambiguous completion. Do not infer portable retry behavior solely from a SQLSTATE without checking the chosen driver/database contract. [Historical account](https://www.cockroachlabs.com/blog/jepsen-tests-lessons/), [current error contract](https://docs.cockroachlabs.com/docs/stable/common-errors)

## Infrastructure-change acceptance

**Distinguish address migration from ownership transfer.** A `moved` block describes address changes within a state and can preserve historical upgrade paths. Moving between states requires coordinated removal from the source and import into the destination; the current documented configuration approach requires Terraform 1.7 or newer. Preserve physical identity, dependencies and an interruption-recovery procedure. Two state locks do not form an atomic cross-state transaction. A successful source removal followed by a failed destination import leaves an ownership gap, not a completed migration. [Module refactoring](https://developer.hashicorp.com/terraform/language/modules/develop/refactoring), [state refactoring](https://developer.hashicorp.com/terraform/language/state/refactor), [locking](https://developer.hashicorp.com/terraform/language/state/locking)

**State removal can delete the resource.** Current `removed` blocks default to destroying the live object. For an ownership handoff, explicitly set `lifecycle.destroy = false` and verify the generated plan. Import the correct provider-specific identity into only one managing address. Import metadata is insufficient evidence of pure adoption: the surrounding configuration may also propose mutations. [Removed-block contract](https://developer.hashicorp.com/terraform/language/block/removed), [import contract](https://developer.hashicorp.com/terraform/cli/commands/import)

**Saved-plan freshness has a boundary.** In the inspected Terraform implementation, applying a saved local plan checks state lineage and serial. Those checks reject another state's plan or a plan superseded by state changes; they do not prove that an out-of-band cloud change has not occurred without updating state. That limitation is an inference from the checked code path. Record the reviewed plan's age, state, provider configuration and change window; regenerate and review when freshness is uncertain instead of silently falling back to a new automatic apply. [Pinned source, commit 137cba0](https://github.com/hashicorp/terraform/blob/137cba0aea37d653711ec9e026760eda2b545795/internal/backend/local/backend_local.go), [plan command](https://developer.hashicorp.com/terraform/cli/commands/plan)

**Plan parsers must assess effects, not keywords.** The inspected JSON implementation includes `forget` and `create,forget` actions alongside deletion-based replacement. A check that searches only for `delete` misses a replacement that leaves the former object unmanaged. Import information can accompany other actions. Reject unsupported format versions and surface unknown identities or incomplete evidence rather than treating them as a safe no-op. This source pin is evidence for fixture design, not proof of compatibility with an installed CLI. [Pinned JSON implementation](https://github.com/hashicorp/terraform/blob/137cba0aea37d653711ec9e026760eda2b545795/internal/command/jsonplan/plan.go), [JSON format contract](https://developer.hashicorp.com/terraform/internals/json-format)

Applying a saved plan does not ask for another interactive approval, and a partial apply is not automatically rolled back. Workflow acceptance therefore needs the reviewed artifact before apply and explicit reconciliation after partial failure. Protect saved plans as sensitive artifacts. [Apply behavior](https://developer.hashicorp.com/terraform/cli/commands/apply), [plan artifact behavior](https://developer.hashicorp.com/terraform/cli/commands/plan)

## Proposed offline fixtures

These are original test designs, not claims that the cited companies execute these fixtures. They should use synthetic identities, state and data.

| Fixture | Required result |
| --- | --- |
| Same-state rename, previous address present, unchanged physical identity, no-op action | Accept the identity-preserving migration; inspect related references. |
| Replacement actions `delete,create`, `create,delete`, or `create,forget` | Reject a claim of identity preservation in every case. |
| Source handoff accidentally uses default destruction | Reject; explicit retention and matching destination identity are required. |
| Import is accompanied by an update or replacement | Report both adoption and mutation; do not classify it as a harmless import. |
| Source forget succeeds, destination import fails | Report incomplete ownership transfer; retain object identity and repair steps; no automatic recreation. |
| Same remote object appears in both managing states | Reject completed-transfer claim until ownership is reconciled. |
| Saved plan has a different lineage or serial | Reject and require a newly reviewed plan. |
| Remote resource changes while state serial remains unchanged | Mark freshness unproven; state-version comparison alone must not pass it. |
| Plan exit status is 2 with a valid diff | Treat as a successful plan with changes, not a command failure. |
| Restore acknowledges, then fails; or completes below the required recovery watermark | Neither satisfies recovery acceptance. |
| Replacement restore identity gets a simulated denial | Fail access validation without changing any real identity policy. |
| Full backup versus incremental backup missing a required predecessor | Independent full backup needs no chain; incomplete incremental recovery fails. |
| Delayed cache fill after invalidation; invalidation connection fails | Reject stale insertion; invalidate local state on detected connection loss. |
| Cache observation is within permitted lag, or a newer deletion explains absence | Avoid a false persistent-inconsistency finding. |
| Lost commit response versus definite rejection with visible effects | Preserve uncertainty in the former; detect the contract violation in the latter. |
| Old worker still uses a column; rollback removes newly written fields | Reject unsupported deployment/rollback compatibility claims. |

## Verification limits

No Terraform binary was available during this cross-check. No native plan/apply, provider integration, permission change or database restore was executed. Synthetic fixtures can validate the review policy and state-machine decisions; they cannot prove provider behavior, backend lock reliability, real recovery time, backup integrity or live authorization. Those require separately authorized tests against the selected product versions and representative environments. A small fixture must not be described as a full consistency checker or a real disaster-recovery exercise.
