# Temporal behavioral evaluation cases

See [the dated smoke observations](smoke-observations.md) for the four cases
actually sampled, candidate fingerprints, and verification limits.

These original miniature projects assess four authored Temporal skills. The
fixtures are intentionally incomplete or flawed and are not production
implementations. No case needs a Temporal server, provider account, or package
installation. The corpus-integrity tests validate evaluation inputs only;
they do not establish skill behavior or distributed-system correctness.

Follow the [evaluation procedure](../README.md). Give each trial only its
prompt, its isolated fixture directory, the candidate named by `skill`, and
its capability declarations. Keep this guide, `cases.json`, rubrics, and other
fixtures outside the trial workspace. Expose only the skill's normal discovery
metadata for the nontrigger case; do not explicitly activate it.

The `commands` capability permits local inspection and permitted verification;
it does not grant file-mutation permission in a review. Preserve file hashes
before and after each read-only trial. For the implementation case, retain the
actual diff and executed command output. Stand-ins model only the supplied
contract: a local check cannot verify Temporal replay, provider deduplication,
worker routing, or live capacity. Record these limits with the result.

The cases cover Activity retry identity, compensation registration, history
compatibility and worker retirement, Continue-As-New handoff, capacity and
quotas, Schedule overlap, payload privacy, AI checkpoint granularity, parallel
context and approval races, cancellation, a narrow adapter edit, and discovery.
They are shared under `evals/temporal/` because the family crosses concerns;
each case identifies one primary candidate.

Run `node --test tests/temporal/evals.test.mjs` for corpus integrity.
Actual behavioral results belong in separate run records, not in these inputs.
