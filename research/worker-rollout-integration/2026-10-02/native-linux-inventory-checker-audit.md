# Linux native final-inventory checker compatibility

The archive checker prefers a recorded `run.final_files` inventory and can use
`linux-host.final_files` when the Linux artifact is declared and its original
hash is bound by run evidence or a score. Linux records require safe unique
relative paths, hashes and permission modes. If both inventories exist, their
normalized path/hash/mode sets must match exactly; row order may differ. Missing,
malformed, unbound or conflicting records fail. No run field is injected.

Existing complete source checks remain exact for declared and on-disk path sets
and original hashes, including the split between project files and dependencies.
Mode validation and dual-record equality concern the recorded inventories;
archived filesystem chmod equality is not a new guarantee. Publication permission
semantics remain unchanged.

All 41 focused checker/exporter tests passed, including Linux-only acceptance,
dual conflicts, both source-binding routes, malformed/missing records, wrong hash
scope, source substitution and omitted dependencies. The read-only archive scan
passed 120 manifests, 2,947 artifacts and 4,729 source bindings. Syntax and diff
checks passed. Historical fixtures, results and raw runs were not edited; tests
use disposable synthetic fixtures. No models, runtime scenarios or supplied
verifiers ran.

The source and tests are frozen pending independent review. Attempt 54 was not
exported, and integrity acceptance supplies no host-compliance or candidate-quality
verdict.

- [Exact source hashes, checks and scope](native-linux-inventory-checker-audit.json)
- [Checker](../../../scripts/check-evaluation-evidence.mjs)
- [Focused tests](../../../tests/evaluation-evidence.test.mjs)
