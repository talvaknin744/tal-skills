# microservice-operations evaluation cases

These original project fixtures are authored inputs, not measured behavioral
results. Some proposals deliberately contain defects. Use the repository's
[evaluation procedure](../README.md) and give the agent only the selected prompt,
its isolated fixture directory, the candidate skill, and stated capabilities.
Keep this guide and `cases.json` outside the agent's workspace. For the nontrigger
case, expose normal skill discovery without explicitly invoking the skill.

All cases are read-only and require no external service or internet access.
Local commands permit inspecting evidence; they do not authorize file changes.
Record the answer, tool trace, and workspace diff. Score observable outcomes
against the separate rubric, including unchanged files and honest reporting of
unexecuted checks. Follow the common guide for scoring and run records.

The corpus contains these cases:

- `retry-amplification`: Nested retries multiply dependency traffic during an outage.
- `canary-metric-gap`: Healthy HTTP metrics can conceal a failed asynchronous rollout.
- `stylesheet-review-nontrigger`: A visual spacing adjustment is not an operational readiness review.

Run `node --test tests/book-skills/evals.test.mjs` for corpus integrity.
This deterministic check does not run an agent or establish skill quality.
