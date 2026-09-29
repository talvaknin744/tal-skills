# Proposed renewal release

Production has 14-day sleeping renewal Workflows on Worker deployment v1.
Some are waiting for charge Activities. Histories below describe the old code's
command order. The proposed v2 inserts a new compliance Activity before charge.
Activity implementation updates keep their existing input/output schema.

The deployment system can run both versions, pin executions to a deployment
version, direct new executions to v2, and report executions still assigned to
v1. It does not copy sleeping executions to v2 simply because a rollout is old.
Exact Temporal SDK/server versions and production history exports have not yet
been provided.

Proposed rollout: switch all traffic to v2, delete v1 after ten minutes with no
Workflow Tasks, and use a green unit-test run as replay evidence. If there is a
problem, deploy the old code on all workers. No unit test runs have been
provided. This is a release review; do not alter files or deploy anything.
