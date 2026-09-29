# Distributed correctness evaluations

These eleven original miniature projects exercise `graceful-draining` and
`concurrency-correctness`. They contain deliberately flawed code, configurations,
or proposals. They are evaluation inputs, not production implementations or
evidence that a candidate skill passed.

Follow the [evaluation procedure](../README.md). Provide only the chosen prompt,
the isolated fixture directory, the named skill, and the declared capabilities.
Keep `cases.json`, its rubric, this guide, other fixtures, and evaluator tests
outside the trial workspace. Expose the normal skill name/description without
explicit activation for the nontrigger case. Record actual tool restrictions;
a prompt requesting no network is not an enforced network sandbox.

The corpus covers repeated rollout interruptions, shared Kubernetes termination
budgets and PDB scope, lost acknowledgement and stale ownership, forced shutdown
with uncertain cleanup, cache invalidation races, primary-read lost updates,
PostgreSQL write skew, cross-service read-your-writes, mutable input during job
resumption, uncertain database commits, and a local CSV nontrigger.
Review cases allow local inspection while requiring files remain unchanged.
Capture hashes before and after. The cache implementation case permits editing
only `service.mjs`; retain the diff and verification output.

Run `node --test tests/distributed-correctness/*.test.mjs` for corpus and harness
integrity. These checks verify input structure, fixture isolation, and that the
cache harness distinguishes its known broken input from an isolated correction.
They do not score agent behavior or validate an actual deployment/database.

The implementation fixture uses `node verify.mjs`, deliberately named outside
Node's automatic test discovery. Its checked-in starting point fails three race
checks and passes two ordinary cache checks. A correct candidate must make all
five pass without editing adapters or verification. Its shared atomic cache
floor is a supplied contract, retained across cache-entry eviction and longer
than outstanding reads. This validates adapter use, not a real Redis/database
transaction, floor expiry, failure between database commit and invalidation, or
partition behavior. An overlapping read may return an older snapshot; a read
invoked after an acknowledged write must meet that revision or a newer one.

No case requires a Kubernetes cluster, PostgreSQL server, package installation,
network service, or a real 24-hour job. Proposed deployment drills and database
concurrency checks remain unexecuted unless a later run actually performs them.
Finite provider deduplication retention and delayed redrive are not covered by
this corpus. Keep sampled behavioral results separate from these authored inputs.

[Recorded smoke observations](smoke-observations.md) describe the seven executed
trials, six sampled cases, saved artifacts, and capability/production limits.
