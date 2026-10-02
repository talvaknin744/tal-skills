# Recovery inputs and restart capacity

Read the relevant branch when selecting a backup, checking its failure signal,
or resuming a distributed queue after recovery.

## Artifact and signal evidence

Trace the advertised backup to an accessible artifact with its actual production
time and source identity. A scheduled or successful job status is not that
artifact. When failure notification is in scope, inject a harmless failure in an
isolated pipeline and observe arrival at its designated test receiver; configured
rules and a successful send call do not prove delivery.

Inventory transformations between the original snapshot and the proposed input:
sanitization, omitted tables, filters and rewritten identities can remove required
dependencies without corrupting the file. Verify a representative required record
and relationship after restore. Choose a compatible input or reconcile the missing
dependency before acceptance. A valid sanitized test fixture need not be usable
as a production recovery source.

These checks are inferred from [GitLab's 2017 recovery account](https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/),
where backup-failure emails were rejected and a staging transformation removed
webhooks. Its historical tool-version statements do not replace the installed
backup tool's compatibility contract.

## Reserved work and cold recovery

If queued work reserves capacity before execution, distinguish waiting,
reserved, running and completed states using the scheduler's actual contract.
Reconcile stranded reservations under the current ownership authority; a delayed
old pickup or release must neither start a second owner nor release a successor's
capacity. Suspicion or timeout alone does not prove that work never started.

Rehearse admission with a cold target, backlog and recovery automation enabled.
Observe useful completions and dependency pressure while increasing intake;
control-plane availability alone is not recovered service. Set the acceptance
window from the declared recovery objective. Include a stranded reservation and
a late old-owner message as negative controls. Local state-machine checks do not
establish production capacity.

[Trigger.dev's June 2026 incident](https://trigger.dev/blog/incident-report-jun-22-2026)
motivates these application checks. Its planned mitigations are not evidence of
their present implementation, and its incident-specific manual actions are not a
generic recovery procedure.
