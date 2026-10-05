# Worker rollout research extension

Research checked on 2026-09-29. Three new primary articles were read, alongside
current runtime documentation and pinned source. Exact-URL comparison against
all earlier `docs/research/**/*.md` and `*.json` records found no occurrence of
these three articles before this extension. The [source record](worker-rollouts.json)
contains dates, access, reading scope, applicability, and proposed acceptance
checks. No cloud actions, runtime trials, or implementation changes were made.

The existing draining skill already covers the user's A → B → C deployment
failure: exclude the retiring cohort from claims, preserve a durable continuation,
fence stale owners at the resource, retain immutable input, and account for
maintenance separately from business failures. These articles justify narrow
runtime additions and better evidence, not another general draining skill.

## Findings worth adding

**ECS protection has an admission protocol and an expiry.** AWS's 2022
[task-protection article](https://aws.amazon.com/blogs/containers/announcing-amazon-ecs-task-scale-in-protection/)
places protection acquisition before receiving queue work. It also counts all
active sessions before releasing protection. This is a useful conditional branch
for service-managed ECS workers; queue receive and protection are separate
operations.

The current [endpoint contract](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection-endpoint.html)
limits the promise to service autoscaling and deployment scale-in. Protection
defaults to two hours and can be requested for 1–2,880 minutes. Inspect the task's
confirmed state and expiry, including failure/error bodies. A 24-hour job needs an
explicit duration or renewal policy; this is not protection against every reason
a task can disappear.

The separate [Fargate Spot](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-capacity-providers.html#fargate-spot-termination-notices),
[explicit stop](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_StopTask.html),
and [unhealthy-task replacement](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_HealthCheck.html)
contracts still require recovery. The conservative inference is to exclude these
from the protection promise; AWS does not provide an exhaustive exclusion list
in the protection page. No exact rejection code for protecting an already
stopping task was verified.

Proposed application policy: keep admission closed when acquisition is uncertain
or fails. Renew early enough to checkpoint or finish before the confirmed expiry;
renewal failure closes new admission and invokes bounded recovery for accepted
work. If work was already received, preserve its identity and use the broker's
actual redelivery/continuation contract. Do not relabel a broker delivery count
as a business attempt. This policy is an engineering inference, not an atomicity
guarantee supplied by ECS.

All protected old workers can prevent a rollout from progressing. The
[current protection guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection.html)
requires attention to replacement capacity, `maximumPercentage`, deployment
tool timeouts, and `DEPLOYMENT_BLOCKED`. Decide the finish-or-resume path before
removing protection. A larger grace period, ECS protection, a Kubernetes PDB, and
effect fencing address different failure modes.

**Deployment success can precede old-worker retirement.** Current ECS rolling
deployment documentation supports
[`earlySuccessCriteria.sourceServiceRevisionCleanup=DEFERRED`](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/early-success-criteria.html).
The old revision can drain after deployment success; cleanup is attempted for up
to two weeks. Automatic deployment rollback monitoring ends at completion.
`DescribeServiceDeployments` counts then become a historical snapshot, while
`DescribeServices` provides live service counts. Therefore, retained-work
completion needs its own live inventory, outcome evidence, deadline, and recovery
owner. This is a current-doc follow-up to the historical articles, not a feature
they described. Check the selected CLI/SDK/IaC support and deployment strategy
before prescribing it. Do not enable early success merely to make CI green.

**Test admission around protection removal.** The October 2023
[Blu Insights account](https://m2-beta.bluinsights.aws/blog/scaling-out-in-policies-and-task-protection-in-practice/)
reports that task protection reduced scale-in failures but requests arriving
during deactivation could still fail. Its protection manager tracked active work
and renewed protection. The remaining failure is evidence that an idle check and
a later infrastructure transition are not one atomic operation.

Proposed test: delay an unprotect call, attempt a new admission, then release the
delayed call. Require an explicit serialized state transition; a retiring worker
never reopens admission. For reusable idle workers, unresolved release/acquire
operations must not be hidden by a local boolean. If remote ordering cannot be
established, keep admission closed and retain recoverability. This asynchronous
transition test is our inference, not a mechanism proven by that article.

Do not copy its custom Lambda scaler as a verified protocol: the account does
not establish that reducing desired count terminates exactly the previously
deregistered tasks. Its broad claim that deregistration always waits the full
delay is also unsuitable today. Current
[ALB documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/edit-target-group-attributes.html#deregistration-delay)
says a target with no active connections or in-flight requests completes
deregistration immediately, although its displayed state can remain `draining`.
Measure the actual work and routing outcomes rather than inferring them from a
label or a fixed sleep.

**The retry layer can determine whether a cursor survives.** Shopify's 2021
[background-job account](https://shopify.engineering/high-availability-background-jobs)
describes jobs repeatedly restarted by deployments and uses interruptible
iterations. This corroborates existing advice. The concrete new caveat comes
from the pinned
[job-iteration guide](https://github.com/Shopify/job-iteration/blob/c3b0eb1db5bd6681664913d57dfe5b5b28ab2ad8/guides/iteration-how-it-works.md):
Active Job retries retain the successful cursor; backend-level retries such as
Sidekiq retries are unsupported for this continuation and restart from the
beginning.

The pinned [implementation](https://github.com/Shopify/job-iteration/blob/c3b0eb1db5bd6681664913d57dfe5b5b28ab2ad8/lib/job-iteration/iteration.rb)
advances the cursor after the iteration callback and serializes it for
re-enqueue. That sequence does not make an external effect atomic with the
checkpoint. Keep the existing effect-identity/reconciliation requirement.
[Sidekiq's deployment documentation](https://github.com/sidekiq/sidekiq/wiki/Deployment)
uses early `TSTP` to stop fetching and later `TERM` with a configurable timeout
(default 25 seconds). Size an iteration to the actual remaining shutdown budget,
including checkpoint publication and teardown; do not transplant a universal
30-second iteration recommendation.

## Proposed repository changes and verification

| Priority | Existing target | Actual addition |
|---|---|---|
| 1 | `graceful-draining/references/platform-shutdown.md` | Conditional ECS acquisition, expiry/renewal, failure disposition, capacity, and retirement evidence. |
| 2 | Same reference | Conditional Rails/job-iteration retry-layer and shutdown-budget caveats. |
| 3 | `workflows/tal-worker-rollout/WORKFLOW.md` | If ECS deferred cleanup is selected, require distinct deployment-completion and old-work-retirement evidence. Keep other workflows unchanged. |
| 4 | `graceful-draining/references/sources.md` | Add these articles and pinned/current runtime sources. Keep general checkpoint, immutable-input, fencing, and failure-budget rules in their existing location. |

Proposed checks, **not executed in this extension**:

- Denied, timed-out, or malformed protection responses admit no new queue work;
  a receipt obtained during a race remains recoverable under its original
  identity. Renewal expiry invokes the documented finish-or-resume path.
- Concurrent tasks do not release shared protection while one remains active.
  A delayed unprotect cannot silently invalidate protection for newly admitted
  work; test this schedule explicitly.
- With all old workers protected and insufficient replacement capacity, the
  rollout reports a bounded capacity block instead of killing accepted work to
  satisfy deployment progress.
- A synthetic successful deployment with live old work does not pass the
  retirement gate. Report stale deployment counts separately from live task and
  logical-job inventory; test post-completion recovery ownership.
- In the selected Rails/backend versions, three planned handoffs preserve
  progress and the logical failure budget. Test Active Job retries separately
  from backend fallback, and kill after an effect but before cursor publication.
  The negative path must expose replay/reconciliation, never silently claim
  exactly-once execution.

Short deterministic fixtures can establish ordering and accounting properties.
They do not establish 12–24-hour stability, real ECS/Kubernetes behavior, external
provider durability, retained credential validity, or old/new application
compatibility. These remain explicit deployment-specific checks. The existing
PostgreSQL/process draining example should retain its current evidence scope.
