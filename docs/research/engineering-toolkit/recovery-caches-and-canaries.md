# Recovery boundaries and long-job release evidence

Additional primary-source crosscheck, 29 September 2026. These observations
extend the storage, recovery, and infrastructure findings; they are not another
publisher or deep-article entry in the 60-publisher/24-article survey.

## Restored history versus live consumers

**Trigger:** restore an older authoritative snapshot while clients retain newer
watch positions or cached state. **Failure:** the store starts successfully, but
those clients do not rebuild their state correctly. etcd 3.6 documents this
specifically for watches, local caches, and Kubernetes informers.

**Mechanism:** use the store's documented recovery procedure. For etcd, choose an
adequate revision bump and mark the bumped history compacted so consumers must
rebuild. Restore new membership rather than accidentally reconnecting old
members. **Applicability:** this is an etcd recovery contract, not a portable SQL
flag. **Counterexample:** an isolated restored service with no surviving
consumers does not need an informer reset. **Verification:** retain a consumer
from after the snapshot, restore, and verify that it invalidates its old state
and observes current recovered data. Reading the documentation is not execution
of that test. [etcd 3.6 disaster recovery](https://etcd.io/docs/v3.6/op-guide/recovery/)

**Application inference:** a recovery plan should inventory state outside the
restored store: projections, caches, checkpoints, operation-result records, and
workers carrying old ownership tokens. Specify how those components reconcile
with the restored history before writes resume. A cache flush alone cannot
repair an external effect omitted from the snapshot or establish that a stale
worker lost authority. Test the actual application's version/epoch and effect
identity rules; do not infer them from etcd's implementation.

## Complete work units in a canary

**Trigger:** a release changes workers whose jobs take hours. **Failure:** a short
canary verifies startup while missing end-to-end failures and mixing old/new
execution evidence. **Mechanism:** evaluate at least one complete work unit and
retain canary/control attribution across its stages. **Applicability:** the
required duration depends on the work unit and failure mechanism, not a fixed
five-minute window. **Counterexample:** startup checks can reject a broken build
early, but do not demonstrate successful long-job completion. **Verification:**
observe the final business result, elapsed processing, and cohort identity;
compare absolute acceptance criteria as well as control-relative behavior.
Shared dependencies can harm both cohorts simultaneously.
[SRE Workbook, Canarying Releases](https://sre.google/workbook/canarying-releases/)

An accelerated local handoff experiment tests its forced transition, not
24-hour memory growth, credential expiry, provider retention, or a production
release. Preserve those limits when using the planned worker-rollout example.
