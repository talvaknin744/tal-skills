# object-design-patterns evaluation cases

These original fixtures are authored inputs, not measured behavioral results.
Use the repository's [evaluation procedure](../README.md). Give the agent only
the selected prompt, its isolated fixture directory, the candidate skill, and
the declared capabilities. Keep scoring criteria outside its workspace. Expose
normal skill discovery for the nontrigger case without explicitly invoking it.

All three cases are read-only and need no internet or external service. Record
the answer, tool trace, and workspace diff before scoring the separate rubric.

- `lifecycle-policy` separates lifecycle transitions from rendering policy and
  examines transition validity and state ownership.
- `provider-construction` examines interface translation, construction choice,
  and account-scoped lifetime without requiring a class hierarchy.
- `local-label-nontrigger` checks that a bounded text correction stays local.

Corpus integrity checks validate the inputs and packaging. They do not run an
agent or establish the skill's behavioral quality.
