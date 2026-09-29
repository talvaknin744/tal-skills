# legacy-code-changes evaluation cases

These original fixtures are authored evaluation inputs, not measured behavioral
results. Follow the repository's evaluation procedure in `evals/README.md`.
Provide only the selected prompt, its isolated fixture directory, the candidate
skill, and the stated capabilities. Keep this guide and `cases.json` outside the
evaluated workspace. For the nontrigger case, use normal skill discovery without
explicitly invoking the skill.

All three cases are read-only and require no external access. Commands may
inspect local evidence; production constructors, deployment configuration, and
remote services are outside the permitted scope. Record the answer, tool trace,
and workspace diff, then score against the separate rubric. Source inspection
and proposed test cases are not proof that those tests ran.

- `member-shipping-threshold`: Preserve surrounding behavior while deliberately
  correcting a characterized defect and isolating eager audit setup.
- `constructor-substitution`: Identify ineffective C++ constructor substitution
  and retain real formatting behavior behind a safe observation boundary.
- `tested-helper-nontrigger`: Keep a docstring review bounded when a pure helper
  already has focused coverage.

Corpus integrity and packaging checks do not establish behavioral skill quality.
No agent evaluation results are recorded in this corpus.
