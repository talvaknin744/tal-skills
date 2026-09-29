# Ownership boundary probes

Run from the repository root:

```sh
python3 examples/ownership-boundaries/verify.py
```

This standard-library-only launcher checks **CPython 3.14.3, Go 1.27.1, and Node 25.9.0**, then runs seven controlled observations. It refuses different runtime versions rather than silently labeling them with these pins. The observed platform is recorded; the first verified run uses macOS arm64. There are no downloads, npm packages, containers, network services, or remote effects. Go builds with `-race`, an offline/local toolchain configuration, and a temporary executable.

Expected totals: **3 passing contracts, 4 observed unsafe controls, 0 failures**. `observed-unsafe` means an intentionally incorrect assumption was disproved and the harness then completed cleanup. It is a successful counterexample, not a recommended pattern or a failed verification.

| Probe | Controlled schedule | Oracle |
| --- | --- | --- |
| Python `semaphore-grant-cancel-before-resume` | Queue two tasks behind a held permit; release and cancel the first without yielding | First never accepts; second acquires; third remains blocked while second holds; final competing acquisitions prove one available permit |
| Python `shielded-acquisition-abandoned-grant` | Shield acquisition, then cancel its observer after release and before resumption | Acquisition succeeds but the next borrower remains blocked until the harness repays the unowned grant |
| Go `select-operand-before-canceled-case` | Already-canceled context; unbuffered send with no receiver | Cancellation case is selected, but its competing send operand has already executed once |
| Go `precheck-known-cancellation` | Context canceled before the checkpoint | `context.Canceled` and zero effect starts |
| Go `precheck-not-an-effect-fence` | Pause after a successful check; cancel; allow the effect to start | One effect start despite earlier successful check; worker joined |
| Node `finished-cancels-observation-only` | Abort `finished()` observation; then write through the still-owned stream | Observer rejects with `AbortError`; stream still delivers data; owner subsequently completes closure |
| Node `pipeline-abort-closes-owned-streams` | Observe source read demand; abort the pipeline signal | Pipeline rejects with `AbortError`; both streams are destroyed and closed; settlement joined |

Python scheduling gates announce immediately before a blocked acquisition, with no intervening suspension. Release followed by cancellation occurs in the same event-loop turn. Capacity is observed only through public competing acquisitions; no private semaphore fields or queue lengths are inspected. The CPython implementation uses FIFO grant selection for this controlled case; this example does not promise portable semaphore fairness.

The Go send cannot win because no receiver exists. This establishes operand evaluation before selection without a probabilistic scheduling assertion. The second unsafe control uses a counter as its effect; a cancellation checkpoint is not an atomic effect fence.

Node's observer control tests a wrong caller assumption about `finished()`, not a defect in that API. The positive case uses built-in in-memory streams. Async generator cooperation, HTTP response/socket consequences, third-party teardown, and slow-sink backpressure are outside these probes.

Each probe bounds its waits, joins its owned tasks or streams, and repairs resources deliberately abandoned by a control. Python runs with development mode and asyncio diagnostics; the launcher forces assertions on, and direct optimized probe execution refuses to run. Node treats unhandled rejections as fatal. The launcher rejects nonempty diagnostic stderr. It allows 15 seconds per probe process and 120 seconds for the Go race build. On timeout it sends TERM, then KILL to the owned POSIX group even if the direct child already exited; it records whether group disappearance was observed within a further finite bound. A remaining group or observation error is explicitly cleanup-unconfirmed (signal-zero checks can include zombies). Descendants that leave the group are outside this fixture contract. These bounds do not establish a general shutdown deadline for uncooperative application work. Elapsed times are diagnostic only, never pass/fail throughput thresholds.

The default [evidence report](evidence/verified-run.json) records runtime versions, per-case evidence, subprocess results, and SHA-256 hashes for this README, launcher, and all probe sources. Sources must remain unchanged throughout the run. A failed run writes a separate `failed-run-*.json`, preserving the previous successful report. `--report PATH` selects another output path. Check source hashes before reusing stored evidence after edits.

These probes exercise a narrow part of the [research findings](../../docs/research/engineering-toolkit/extensions/cancellation-ownership.md). They provide no benchmark, memory-bound, transaction, remote-effect, or all-schedules correctness guarantee.

Primary contracts:

- [CPython 3.14.3 semaphore acquisition and grant cancellation](https://github.com/python/cpython/blob/v3.14.3/Lib/asyncio/locks.py#L386-L448)
- [Go select evaluation and selection](https://go.dev/ref/spec#Select_statements)
- [Node 25.9.0 streams: finished and pipeline](https://nodejs.org/download/release/v25.9.0/docs/api/stream.html)
