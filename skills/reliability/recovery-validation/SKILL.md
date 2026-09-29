---
name: recovery-validation
description: Validate backup recovery or disaster-recovery claims by rehearsing restores, measuring recoverable data loss and time to application usability, and checking restored state against business invariants. Use for restore runbooks, recovery drills, failed restores, or RPO/RTO evidence; ordinary backup scheduling alone does not require a recovery drill.
license: MIT
---

# Recovery validation

Prove which service can resume from which recovered history. A valid archive,
successful restore command, and accepting database socket are intermediate
observations; acceptance belongs to the application.

## 1. Define the recovery contract

Keep the requested mode: review produces findings, design produces a rehearsal,
implementation changes or runs the authorized recovery path. Identify the
authoritative stores, backup type and boundary, dependent credentials/configuration,
application identity, supported versions, and intended recovery point. State the
failure being simulated and which components survive it.

Define RPO in the workload's actual units: missing acknowledged operations or
time relative to an independently observed commit boundary. Define RTO's start
event and stop condition before measuring. Record excluded provisioning,
detection, transfer, and cutover stages. A requirement that has no supplied
target remains an observed measurement, not a passed objective.

**Done:** a named recovery point, dependency inventory, acceptance invariants,
loss budget, timing boundary, and authorized isolated target are explicit.

## 2. Restore the dependency set

Use a disposable target for rehearsals; keep side effects isolated from live
consumers. Match tooling to the backup format and product version. Capture the
actual restore exit status and error output, then authenticate using the
application's intended identity and privileges.

For PostgreSQL logical archives, physical backups, or PITR, read
[PostgreSQL recovery](references/postgresql.md). For surviving caches, watches,
workers, or external effects, read [recovered history](references/recovered-history.md).
When selecting transformed backups, checking failure signals, or resuming reserved
work, read [recovery inputs and capacity](references/recovery-inputs.md).
Read [sources](references/sources.md) when selecting or updating the underlying
contracts; it records versions, reading scope, and evidence limits.

**Done:** the restored service uses the intended history and dependency versions,
and the application can access it under its real authorization boundary.

## 3. Validate usable history

Compare recovered state with evidence outside the restored snapshot: expected
identity, schema compatibility, committed-operation records, representative
content, relationships, and domain invariants. Counts and checksums cover only
what they measure; balanced accounts, valid object references, and complete
workflow progress need their own checks. If the latest acknowledged boundary is
unknown, report bounded or unknown loss rather than claiming zero RPO.

If restored local effects and completion records disagree, read
[local repair](references/recovered-history.md#local-effects-and-completion)
before recommending replay or write resumption.

Exercise an application operation through the intended admission path when that
path is in scope. Stop the recovery timer only at the declared acceptance gate.
Reconcile surviving consumers and uncertain effects before enabling them.

**Done:** usable data, lost acknowledgments, elapsed time, and unresolved external
state each have evidence; failed gates remain failed despite a zero restore exit.

## 4. Demonstrate rejection and repeatability

Choose faults around the changed recovery boundary: missing identity or key,
semantically invalid data, interrupted restoration, wrong environment, or a
snapshot older than accepted writes. Require the verifier to reject the unsafe
state. After a partial restore, retry into a fresh isolated target or use an
explicitly justified resumable procedure.

**Done:** report backup identity, tool versions, executed commands/checks,
positive and negative outcomes, RPO/RTO definitions and observations, and cleanup.
Distinguish logical restoration from physical recovery, PITR, failover, and
production readiness. A failed invariant or unavailable dependency stops
acceptance and write resumption; preserve its evidence for the recovery owner.
