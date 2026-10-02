# Fairness case inputs

Two fictional read-only policy reviews and one finite local nontrigger. Cases
are authored inputs, not evidence that a skill passed. Give the agent only its
case prompt, copied fixture, candidate skill and declared capabilities; withhold
cases.json, rubrics and this guide. Use a fresh workspace for each case and record
actual native discovery, body reads, command trace, answer and unchanged-file
evidence. Model runs are owned by the parent integration runner.

The case schema matches the repository evaluator fields. Select
`freeze --suite worker-rollout-integration` to route these nested fixtures through
the repository runner. Apply the scoring convention in
[the evaluator guide](../../README.md): 0 fail, 1 partial, 2 pass, with critical
gates and concrete artifact/event evidence. A finite arithmetic schedule is not
evidence of deployed broker fairness, interruptibility or production latency.
