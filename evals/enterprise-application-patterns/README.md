# enterprise-application-patterns evaluation cases

These original fixtures are authored evaluation inputs, not measured behavioral
results. Some proposed designs deliberately contain defects. Follow the shared
[evaluation procedure](../README.md). Give the agent only the selected prompt,
its isolated fixture directory, the candidate skill, and stated capabilities.
Keep this guide and the scoring criteria in `cases.json` outside its workspace.

All cases are read-only and work without internet access or external services.
For the nontrigger case, expose the skill's name and description through normal
discovery without explicitly invoking it. Capture the answer, observable tool
trace, and workspace diff, then score them against the separate rubric.

- `domain-logic-choice`: choose a proportionate domain structure and persistence seam.
- `stale-edit`: distinguish identity tracking, atomic persistence, and concurrency control.
- `presentation-nontrigger`: keep a static CSS question within its requested scope.

Corpus integrity checks validate these inputs; they do not execute an agent or
establish that the skill passes a behavioral evaluation. No behavioral runs are
recorded here.
