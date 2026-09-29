# Proposed retirement at 12:02 UTC

The deployment is `SUCCESSFUL` and the three new tasks are healthy. Treat that as
the release and retirement gate. The source counts in the deployment record are
old data, so the two source tasks need no further tracking.

At 12:02, remove `export-layout-v2`, the revision-2 checkpoint decoder, and the old
task definition and image. Both old workers already have protection enabled, so
they can complete their exports without retaining those dependencies. Keep both
worker revisions polling the queue until the old processes exit naturally.

The renewal client received a response for old-a's 24-hour request. Record its
protection as extended and retry any later errors on the normal hourly timer.
Protection can be cleared when the deployment is successful if a capacity alarm
fires; the queue will retry any interrupted job on revision 3.

Reduce desired count to one and retain the existing autoscaling range to save
cost. The five task slots are sufficient because the target cohort is already
healthy. If a source task or a new task fails later, rely on deployment rollback
to restore the previous revision and then investigate.
