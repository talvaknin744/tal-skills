# Terraform state and plan practices

Use the installed CLI, provider and backend contracts. The local evidence behind these cards used Terraform 1.16.4; provider-specific resource identity and import semantics still need their own check. Sources and reading limits are in [sources](sources.md).

## Address migration

- **Trigger:** Rename resources/modules or change instance addressing inside one state.
- **Failure:** A source-code rename becomes destroy/create and loses identity or data.
- **Mechanism:** Express supported address transitions with `moved`; inspect `previous_address`, the resource ID and resulting actions. Retain earlier mappings when supported users may skip intermediate releases.
- **Applicability:** Configuration-driven moves require Terraform 1.1+; resource-type changes depend on provider support. A cross-state transfer needs the next card.
- **Counterexample:** A plan with `create,forget` still replaces the managed object even though it contains no deletion.
- **Verification:** Rehearse from the oldest supported state; confirm the intended identity survives and dependent references still resolve.

## Ownership transfer

- **Trigger:** Split workspaces/states or hand an existing resource to a new owner.
- **Failure:** The old configuration deletes the object, two states manage it, or transfer interruption leaves it unmanaged.
- **Mechanism:** Record the provider's import identity and state backups; coordinate writers; review source removal and destination adoption. For the Terraform 1.7+ configuration approach, explicitly use `removed { lifecycle { destroy = false } }` at the source and a matching destination import. The default removal destroys the object.
- **Applicability:** Import support and identity formats are provider-specific. Separate state locks are not an atomic transaction. Plan the unmanaged interval and recovery owner.
- **Counterexample:** Correct import metadata alongside an update or replacement is not pure adoption.
- **Verification:** Inspect both plans for unexpected creation, mutation, replacement or deletion; after completion, confirm one managing address and the same intended object. After source removal succeeds but import fails, reconcile that object rather than recreate it blindly.

## Reviewed plan

- **Trigger:** Apply a plan after review or after other writers may have changed the environment.
- **Failure:** A stale candidate or hidden replacement is treated as approved work.
- **Mechanism:** Bind review to the saved plan, versions, inputs and target. Inspect all action types and unknown identities. Keep backend locking enabled where supported; coordinate other writers. Regenerate and review when state, configuration, dependencies or remote conditions invalidate the evidence.
- **Applicability:** A saved plan's state lineage/serial checks do not prove that cloud resources stayed unchanged outside Terraform. Use the actual backend/provider change controls; a universal plan-age timeout is not a freshness proof.
- **Counterexample:** `-refresh=false`, routinely targeted plans, or an unsupported JSON action cannot establish a complete safe transition.
- **Verification:** Reject a superseded plan; treat `-detailed-exitcode` 2 as a successful plan with changes. Parse the documented format, reject unsupported major versions and report incomplete/unknown evidence explicitly.

Saved plans and JSON/state output may expose sensitive values even when the terminal hides them. Keep artifacts in the project's protected evidence store with its retention and access controls. Supplying a saved plan to `apply` skips Terraform's interactive approval prompt; use only the artifact authorized for that target.

## Partial apply

- **Trigger:** Apply fails, times out or loses its response after operations have started.
- **Failure:** A blanket rerun duplicates effects, or restoring old state metadata hides resources that still exist.
- **Mechanism:** Inspect current state, provider outcomes and external side effects; classify completed, failed and uncertain operations. Repair the cause and review a fresh reconciliation plan. Preserve usable work where the provider contract allows it.
- **Applicability:** Creation-provisioner failure can taint a resource; replacement may repeat earlier side effects. Provider errors and timeouts require outcome-specific handling.
- **Counterexample:** A state-file backup is metadata recovery, not an undo operation for cloud resources or a database restore.
- **Verification:** Force a later operation to fail after an earlier one succeeds. Confirm the surviving resource identity and effects; then verify that recovery changes only the intended resources. Check service/data invariants separately from CLI success.
