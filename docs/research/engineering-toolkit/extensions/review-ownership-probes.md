# Independent review: ownership boundary probes

Review date: 29 September 2026. Scope: `examples/ownership-boundaries/**`, including
the three standard-library probe programs, launcher, documentation and source-bound
report. The reviewer did not author or edit these examples and did not run a
model. The reviewer authored the separate Node export fixture; that different
code is not the subject of this review.

Status: both reproduced findings are closed on the final source hashes below.
The independent final rerun passed all seven controlled observations. No remaining
actionable finding was identified within this review's scope and stated limits.

## Runtime observations and oracle review

The reviewer executed:

```sh
python3 examples/ownership-boundaries/verify.py --report /tmp/tal-ownership-review-20260929-01.json
```

The observed pins were CPython 3.14.3, Go 1.27.1 and Node 25.9.0 on macOS arm64.
Go compiled with the race detector and offline/local toolchain settings. All three
probe processes exited successfully without diagnostic stderr. Results were three
passing contracts, four observed unsafe controls and zero failed scenarios.

The Python grant/cancel test controls the cancellation window within one event-loop
turn and checks capacity using subsequent public acquisitions. Its shield control
explicitly repays the abandoned grant and joins owned tasks. The Go select control
has no send receiver, so the selected cancellation case is deterministic while
the operand's side effect is still observable. Its second control uses channels
to place cancellation after the checkpoint and before the effect, then joins the
worker. The Node observer control proves continued work after `finished()` stops
observing; the positive pipeline case separately joins settlement and closure of
both owned streams. These are meaningful oracles for the stated schedules.

Unsafe cases are labeled `observed-unsafe`, with the wrong ownership assumption
identified explicitly. They are counterexamples, not suggested application code.
The probes do not exercise remote effects, shared sockets, arbitrary generators,
backpressure, every cancellation schedule, or portable semaphore fairness. A
clean race-detector run and an unchanged source hash are bounded observations,
not general correctness or absence-of-drift guarantees.

## Reproduced findings

1. **P2 — Python optimization can silently remove the oracle.** The launcher
   inherited `PYTHONOPTIMIZE`; `-X dev` does not restore assertions. In a temporary
   reviewer copy, a deliberately faulty semaphore doubled each release. With
   optimization zero, both Python cases failed. With optimization one, the same
   faulty code reported `pass` and `observed-unsafe`, including affirmative
   evidence whose assertions had been removed. The original example files were
   untouched. Requested correction: force assertions on for launcher children and
   explicitly reject an optimized direct probe invocation without relying on an
   `assert` statement.
2. **P2 — Timeout cleanup can leave a descendant alive.** The reviewer called the
   unchanged launcher helper with an owned temporary leader and a child that
   ignored TERM and did not retain the leader's captured pipes. The helper returned
   after about 0.5 seconds when the leader died, while the descendant remained in
   live state `S`. The reviewer explicitly killed the owned group afterward.
   Requested correction: retire the entire owned group on timeout even when the
   leader's `communicate()` returns, and verify or accurately limit that claim.
   Compiler descendants make this relevant to the current Go build path.

The first independent report is outside the repository at
`/tmp/tal-ownership-review-20260929-01.json`. Separate temporary reproduction
records are `/tmp/tal-ownership-optimization-review-20260929.json` and
`/tmp/tal-ownership-process-cleanup-review-20260929.json`. No configuration,
credentials, native model history or hidden reasoning was read for this review.

## Correction and final source binding

The reviewer repeated the complete launcher with `PYTHONOPTIMIZE=1` in its parent
environment. It passed all seven cases, and the child reported optimization level
zero. A direct optimized probe returned exit code two and no scenarios, explicitly
refusing to run without its assertions. These checks close the first finding.
The fresh report is `/tmp/tal-ownership-review-20260929-02.json`; the refusal
record is `/tmp/tal-ownership-optimized-refusal-review-20260929.json`.

Timeout cleanup now sends group KILL regardless of leader completion. The first
correction exposed `EPERM` from macOS's signal-zero observation; the final version
records that error and returns structured cleanup-unconfirmed evidence. In the
independent final regression, the direct child exited on TERM, group KILL was
sent, and a separate `ps` check found no live adversarial descendant afterward.
The launcher correctly did **not** claim observed group disappearance when its
own observation was denied. Descendants that deliberately leave the group remain
outside the documented contract. This closes the second finding without widening
the cleanup guarantee. Evidence is in
`/tmp/tal-ownership-process-cleanup-review-20260929-fixed.json`.

The final complete run used the same command with inherited `PYTHONOPTIMIZE=1`
and report path `/tmp/tal-ownership-review-20260929-03.json`. It observed all pinned
runtimes, optimization level zero in the Python child, three passes, four unsafe
controls, no failed scenarios and empty diagnostic stderr. Its source hashes
match both the current files and the author's regenerated successful report.

| Reviewed source | SHA-256 |
| --- | --- |
| `README.md` | `a3b002310bb97b44d5f6de1cc8c2c75bf4269e23b20d8afc651d6e0b2fef5cc8` |
| `verify.py` | `2d958d2431510e2e57a6a17ae25004347f3e50e200e1b74296bb796865dac845` |
| `python/probe.py` | `67caf7095f9737e34bd3480816b1ba187cff543dba6e78a296e6bcb0b2db1a75` |
| `go/main.go` | `5a198324cc844e83a9d3b15e0c539335e4cb204f74e1517cf93b8a879766aefd` |
| `node/probe.mjs` | `6a723a6d7dd348de131cbd914684e5d52b21bcebfa80a718731be4840754440c` |

The final independent report SHA-256 is
`d6247875a4c87c9e359582b9f1153e4f02577b1904bb1db6eae04e391e764213`.
An unchanged [copy of that final rerun](../../../../examples/ownership-boundaries/evidence/independent-rerun.json)
is published with the examples.
The author's regenerated `evidence/verified-run.json` SHA-256 is
`7e9435ac2a0c485895baae6c1eb096e609e5f77e3cbaf1abcfca61d91445b847`.

Each report binds its own exact five source hashes. The initial report must not
be presented as verification of later edited sources.
