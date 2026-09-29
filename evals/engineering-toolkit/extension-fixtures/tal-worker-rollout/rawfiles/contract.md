# Batch export service contract

This is a synthetic Amazon ECS rolling deployment. `rollout.json` is a normalized
local evidence bundle, not an exact AWS API response or a record of a real cloud
run. All times are UTC. The decision time is its `observed_at` value.

Each job is identified by `(tenant_id, job_id)` across delivery attempts and worker
revisions. The application queue can redeliver after a 60-second ownership lease
expires. A worker normally renews that lease every 15 seconds. The lease carries
an epoch; the checkpoint store and export finalizer reject writes using an older
epoch. The finalizer stores one durable result receipt under the stable job key.
Queue acknowledgment is valid only after that receipt exists. ECS task protection
does not acquire or renew these application leases.

Each old job has approximately 12 hours of work remaining. Its checkpoint refers
to a revision-2 decoder and the `export-layout-v2` dependency. Revision 3 can start
new jobs, but compatibility with revision-2 checkpoints has not been implemented
or rehearsed. The current checkpoints and dependencies must remain usable until
their jobs finish or a compatible recovery path has been demonstrated. Losing a
process may require replay from a checkpoint; preserving one effect per job still
requires the ownership and result-receipt protocol.

The business objective is to admit new jobs on revision 3 while completing or
recovering every already accepted job. The infrastructure budget allows five
simultaneously running task slots. Any temporary increase requires a separate
capacity decision. The supplied proposal is a proposal, not an approved action.

## Supplied ECS reference facts

- For rolling deployments, `sourceServiceRevisionCleanup=DEFERRED` allows success
  before source-task cleanup. Cleanup is then attempted for up to two weeks.
  Deployment circuit-breaker and alarm rollback cease after completion.
  `DescribeServiceDeployments` task counts freeze at completion; `DescribeServices`
  supplies live service counts. [AWS early success criteria](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/early-success-criteria.html)
- Task protection lasts 120 minutes by default, or a requested 1–2,880 minutes.
  A response may contain a protection record, a failure, or an error. The record
  identifies the task and its confirmed expiration. [AWS protection endpoint](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection-endpoint.html)
- Task protection covers service autoscaling and deployment scale-in. Protected
  source tasks can constrain replacement capacity; rolling deployment
  `maximumPercentage` matters. Protection updates can report `DEPLOYMENT_BLOCKED`
  when protected tasks exceed the service's desired count. [AWS task protection](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-scale-in-protection.html)
