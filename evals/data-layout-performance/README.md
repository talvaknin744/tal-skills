# Data-layout performance evaluation cases

These synthetic fixtures test bounded-history semantics, native buffer
preconditions, optimization criticality and discovery scope. They contain
intentionally incomplete proposals; their figures are authored evidence, not
measured benchmarks. Follow the [evaluation procedure](../README.md) with one
isolated project and its candidate skill. Keep cases.json and scoring material
outside the agent context; expose metadata normally for the nontrigger case.

All cases are read-only. The ring permits safe Python correctness checks without
third-party packages; those checks establish neither NumPy nor hardware speed.
Record candidate identity, actual answer, observable tools and project diff.
