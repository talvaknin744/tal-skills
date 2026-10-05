# Terraform feasibility evidence

A disposable local experiment confirmed partial-apply persistence, recovery from surviving state, saved-plan rejection after a state update, address migration, and retained state removal. The run used Terraform **1.16.4, darwin_arm64**, on 2026-09-29, from 08:18:44 to 08:18:45 UTC. The [machine-readable record](infrastructure-feasibility.json) includes all 25 CLI invocations, exit codes, complete HCL configurations, configuration-change boundaries, selected full outputs, state summaries and raw-output hashes.

## Environment and scope

Terraform was initially absent from `PATH`. The current stable release was selected from the [official release index](https://releases.hashicorp.com/terraform/), downloaded into `/tmp/tal-terraform-research-20260929/bin`, and verified against HashiCorp's official SHA-256 file before execution. No global installation was made. The archive's digest was `42cfdf97ad722f79085fe2279b06d4b8680172de3534b22eeddd9a0fbbe7b8f1`. The signature was not independently verified; the archive and checksum were fetched over HTTPS from the same official release service. [Archive](https://releases.hashicorp.com/terraform/1.16.4/terraform_1.16.4_darwin_arm64.zip), [checksum file](https://releases.hashicorp.com/terraform/1.16.4/terraform_1.16.4_SHA256SUMS)

The project used only the built-in `terraform_data` resource, local state and deterministic shell commands writing scratch files. A minimal explicit execution environment omitted cloud credentials, and an isolated CLI configuration disabled update checks. Initialization reported the built-in provider; no external provider was downloaded. `local-exec` served only as a controlled failure injector and local effect marker. This is not a recommendation to implement infrastructure provisioning through shell commands. [Built-in resource documentation](https://developer.hashicorp.com/terraform/language/resources/terraform-data)

## Observed outcomes

| Probe | Observed result | Acceptance implication |
| --- | --- | --- |
| First operation succeeds; dependent operation exits 23 | Apply exited 1. The first resource remained in state and its creation marker remained. The later resource was recorded as tainted. | An apply error does not imply that nothing changed. |
| Replan with the deliberate failure disabled | Plan showed no-op for the first resource and replacement for the tainted resource. Apply succeeded, preserving the first ID and its single creation event. | Inspect surviving state and effects before choosing recovery. |
| Save a reviewed plan, then apply an intervening update | Applying the older saved plan exited 1 with `Saved plan is stale`; the intervening value remained. | Replan and review after a competing state update. |
| Rename the first resource using a `moved` block | JSON plan showed `previous_address` and a no-op action. Apply retained its ID. | A same-state address change can preserve resource identity. |
| Replace its configuration with `removed`, explicitly setting `destroy=false` | JSON plan showed `forget`; apply removed ownership from state. The destroy hook did not run and the local creation marker remained. | Forgetting management is a different operation from destruction. |

The recovery deliberately did **not** restore `terraform.tfstate.backup`, edit state serials, disable locking, or rerun the failed plan blindly. It generated a new plan against the surviving state, inspected the proposed replacement, and applied that artifact. This behavior supports the current documentation's instruction to address partial failures and plan again; restoring an older state file would not undo external effects. [Apply documentation](https://developer.hashicorp.com/terraform/cli/commands/apply)

All changed plans used `-detailed-exitcode`; exit 2 was accepted as a successfully generated plan with changes. Saved plans were supplied explicitly to `apply`, so the exact planned actions were used. The JSON record preserves the complete argument arrays and the expected failures. [Plan command contract](https://developer.hashicorp.com/terraform/cli/commands/plan)

## What this does not establish

`terraform_data` has no independently managed cloud object. Its stable ID demonstrates Terraform lifecycle behavior, not a cloud provider's ability to preserve a database, disk or network. The scratch markers are local side effects, not monitored provider resources. No provider API, real cloud drift, remote backend, distributed lock, cross-state destination import or production infrastructure was exercised.

The stale-plan experiment changed Terraform state through an intervening apply. It does not establish that saved plans detect out-of-band cloud changes that leave state untouched. The earlier source review found state lineage/serial checks; the limitation concerning unrecorded remote drift remains an inference from that code path, not an observed cloud result. [Pinned source review](https://github.com/hashicorp/terraform/blob/137cba0aea37d653711ec9e026760eda2b545795/internal/backend/local/backend_local.go), [cross-check report](crosscheck-infra-storage.md)

Retained removal was tested only on the source side. A complete ownership transfer still needs a destination import, correct provider identity, coordinated writers and an interruption-recovery procedure. Current `removed` documentation requires explicit `destroy=false` to retain the live resource; omitting it is not equivalent. [Removed-block contract](https://developer.hashicorp.com/terraform/language/block/removed)

This later experiment supersedes the earlier cross-check's CLI-unavailable limitation for these bounded local cases only. Raw logs, synthetic plans, state snapshots and the temporary executable remain in the scratch directory; no executable or raw state/plan artifact was added to the repository.
