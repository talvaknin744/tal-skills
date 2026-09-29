# Behavior-preserving cleanup with failure evidence

This small sequential credit ledger demonstrates two distinct claims: restructuring
preserves the observed contract, and independently specified tests reject five
plausible defects. It uses synthetic in-memory data and performs no external effects.

Prerequisite: Python 3.10 or later; no packages, credentials, database, or network
are needed. From the repository root run:

```sh
python3 examples/quality/verify.py
```

The command prints JSON and exits zero only after all checks pass. An unexpected
exception or a surviving defect fails the run. The verifier resolves fixture paths
relative to itself, so an absolute path to `verify.py` also works from another
working directory. To retain fresh evidence explicitly:

```sh
python3 examples/quality/verify.py --report examples/quality/evidence.json
```

[contract.md](contract.md) is the authority for outcomes and error precedence.
[golden.json](golden.json) contains 15 hand-authored histories with exact return/error
observations and final state. Expected balances, receipts, and journals are literal
requirements; the verifier does not call production helpers to calculate them.

[before.py](before.py) contains the frozen nested implementation and unused private
formatter. [after.py](after.py) flattens validation/replay guards and removes that
formatter. Both retain separate support and goodwill policy functions: equal limits
have different owners and reasons to change. They also retain why receipt state
survives response loss and why the commit step is only a model assumption.

The verifier checks both versions against the golden histories, then enumerates all
27 three-attempt combinations of `none`, `before_commit`, and `after_commit`, followed
by a successful retry. Every such schedule must converge to the fixed one-credit
state and original receipt. Full before/after observations are compared separately.

It then executes source-mutated candidates that duplicate a replay, accept booleans,
exclude the upper bound, omit policy from request identity, or change the integer
JSON representation to a float. Each must fail its
designated independent contract case; import/setup errors do not count. The replay
counterexample shrinks from five steps to the two explicit steps retained in
[counterexample.json](counterexample.json), preserving the lost-response/retry
precondition. This is deletion-minimal under that condition, not a claim about all
possible reductions.

[report.md](report.md) records executed observations, source-review evidence, and
limits; [evidence.json](evidence.json) records runtime, candidate hashes, and actual
seeded failures. This finite in-memory experiment does not establish database
atomicity, concurrent idempotency, process restart durability, or provider behavior.
