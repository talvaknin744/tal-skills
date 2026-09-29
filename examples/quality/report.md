# Executed quality example evidence

Executed 2026-09-29 with Python 3.14.3 on macOS 14.2 arm64. Command from the
repository root:

```sh
python3 examples/quality/verify.py --report examples/quality/evidence.json
```

Exit status: 0. The machine-readable report contains hashes of both implementations,
the contract, golden histories, retained counterexample, and verifier. A relevant
edit invalidates those recorded observations until the command is rerun.

| Check | Observation |
| --- | --- |
| Independent contract oracle | All 15 hand-authored histories passed on each implementation |
| Failure schedules | All 27 three-attempt schedules, each followed by a successful retry, ended in the fixed one-credit state on each implementation |
| Preservation | Before/after full schedule observations agreed; each separately satisfied the golden oracle |
| Duplicate-replay seed | Lost response then retry produced `credit-2` and balance 100; expected original `credit-1` and balance 50 |
| Boolean-acceptance seed | `True` issued a credit; expected `InvalidCredit` and no effect |
| Upper-bound seed | Amount 100 was rejected; expected a committed credit |
| Incomplete-identity seed | Reusing a support key for goodwill returned the old receipt; expected `RequestConflict` |
| Integer-serialization seed | Balance became JSON `1.0`; expected integer `1` |
| Reduction and replay | Five-step duplicate-replay trace reduced to the retained two steps; both clean versions passed and the seeded version still failed |

These are actual executions of deliberately modified source, not assertions that a
mutation framework was installed. Unexpected exceptions propagate as setup failures.
The golden expectations are literal specification examples; the generated schedule
oracle uses a fixed final state justified by the mandatory successful retry. Neither
oracle computes expected values by repeating the implementation's algorithm.

An independent review found an earlier oracle gap: ordinary Python equality
accepted equal-valued floats in place of integers. That earlier four-mutation run
was insufficient for the serialization claim. The final verifier compares canonical
JSON and adds the integer-serialization seed above; the recorded evidence was rerun
after the correction. Object-key order remains immaterial.

The cleanup benefit is narrower nesting around the public decision path and removal
of a locally unused formatter. A source inspection of this closed example found
`_format_internal_note` only at its declaration in `before.py`; neither implementation
uses dynamic attribute lookup or registration. That evidence is sufficient for this
example's private local helper, not for arbitrary exported or dynamically loaded code.

Source review confirmed that support and goodwill remain independently owned policy
functions, with their deliberately similar bounds and ownership rationale retained.
Receipt-retention and model-atomicity comments also remain. These are design and
documentation observations, not conclusions derivable from a passing behavior test.

The README's command was also run from a temporary unrelated working directory using
an absolute verifier path. It exited zero with the same behavioral counts and hashes;
the temporary directory was removed. Only the installed Python 3.14.3 runtime was
executed, not the entire stated 3.10+ compatibility range.

Limits: sequential in-memory state, no database/network, no process restart, no
concurrent execution, and a finite domain. This does not prove transaction isolation,
crash durability, external-effect deduplication, performance, or all-input equivalence.
No model-behavior evaluation or native-host workflow execution is claimed here.
