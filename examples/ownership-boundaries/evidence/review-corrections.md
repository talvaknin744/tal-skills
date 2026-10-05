# Independent review corrections

2026-09-29: reviewer `native_compat_research` reproduced a false-positive verification path in the initial candidate. In a temporary copy, deliberately doubling semaphore capacity failed with assertions enabled but appeared successful under inherited `PYTHONOPTIMIZE=1`, which disables Python `assert` statements even with development mode enabled. The original candidate sources were not modified during that reproduction.

Correction: the launcher now sets `PYTHONOPTIMIZE=0`, validates the reported optimization level, and the probe itself explicitly rejects optimized execution without relying on an assertion. The normal probe report records the optimization level. A source-bound run and a direct optimized-execution rejection check verify the correction. The initial successful report is superseded by regenerated evidence; this note preserves why it was not sufficient.

Reviewer reproduction artifact: `/tmp/tal-ownership-optimization-review-20260929.json` (temporary local evidence, not a durable dependency of this example).

The same reviewer reproduced a second failure: after a timeout, a leader can exit on TERM while a descendant ignores TERM and has private pipes. Waiting only for the leader then returned while that child remained alive. The reviewer explicitly killed that test group afterward.

Correction: every timeout now sends group KILL even if leader communication already finished. The report records a bounded group-disappearance check and marks a still-existing group as cleanup-unconfirmed; the README limits the guarantee to members that remain in the owned group. This does not conflate direct-child completion with descendant retirement. Reviewer reproduction artifact: `/tmp/tal-ownership-process-cleanup-review-20260929.json`.

The review rerun also observed macOS returning `PermissionError` to a signal-zero group check after KILL. Observation errors are now recorded as cleanup-unconfirmed instead of escaping before the structured timeout result is returned. Neither an error nor a remaining group is classified as observed disappearance.

Final independent rerun: 3 passing contracts, 4 observed unsafe controls, 0 failures; optimized parent produces an unoptimized Python child; direct optimized invocation refuses with exit 2. The TERM-ignoring descendant was no longer live after timeout cleanup, while the macOS observation error remained explicitly unconfirmed. No actionable findings remain in the [independent review](../../../research/engineering-toolkit/extensions/review-ownership-probes.md).

Final launcher SHA-256: `2d958d2431510e2e57a6a17ae25004347f3e50e200e1b74296bb796865dac845`. Author report SHA-256: `7e9435ac2a0c485895baae6c1eb096e609e5f77e3cbaf1abcfca61d91445b847`. Independent fresh report SHA-256: `d6247875a4c87c9e359582b9f1153e4f02577b1904bb1db6eae04e391e764213`.
