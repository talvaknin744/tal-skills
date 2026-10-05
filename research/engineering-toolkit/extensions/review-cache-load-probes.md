# Independent review: cache load protection probes

Reviewed 29 September 2026. **No actionable defect found in the frozen candidate.**
The independent rerun passed all eight scenarios. This verdict covers the bounded
fixture and its stated evidence limits, not a production cache implementation.

## Inspected candidate

Read all six source/package files and the author's successful evidence report.
Checked the current official [SCAN](https://redis.io/docs/latest/commands/scan/),
[BF.EXISTS](https://redis.io/docs/latest/commands/bf.exists/), and
[Redis locking](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/)
contracts against the relevant assertions. No source files, fixtures, skills, or
model-evaluation results were changed by this review.

All paths below are relative to `examples/cache-load-protection/`:

| File | SHA-256 |
| --- | --- |
| `.gitignore` | `862263fa1f46c20f0d1e4dac5ffcc75abd55c08211b2c3864c5f8764b9d87793` |
| `README.md` | `cbd0a8cd4ec05b1f53cf63084a0620dfae334eef6f9e9a0c580df7cbd65f8292` |
| `dependencies.lock.json` | `27517aa3789c9a3d050bc1bac807df2feaa0d6dc631fb8e9d8660a4e7aa33b0d` |
| `redis_client.py` | `dde3c93314bcb42518f4562ab8b306ca50b05b62fb972a313c5f40c13f98d2ff` |
| `probes.py` | `ae76b71f4ff5360c2bf0d4c8d3042b8a127fb5d43fc758cc404670c64b00966c` |
| `verify.py` | `72c5973b2b089984eb1531a6de40458178fde362db3dba3e675674c8f3e21a63` |
| `evidence/verified-run.json` | `554b2a63e7a4b0a86ddfc341d2a2628442c6ef16065f34bb3e4930384dcb1e9d` |

The six source hashes matched the author's report before execution and the
independent report afterward. The runner also rejects a source change during its
own execution.

## Independent execution

From the repository root:

```sh
python3 -B examples/cache-load-protection/verify.py --report /tmp/tal-cache-load-review.json
```

Exit status **0**, eight of eight scenarios passed, no reported errors. Started
at `2026-09-29T13:26:06.025406+00:00`; completed at
`2026-09-29T13:26:07.078777+00:00`. The exact independent raw report is preserved
in [independent-run.json](../../../examples/cache-load-protection/evidence/independent-run.json),
SHA-256 `a41fc9140e2f1d0da49481b568df02c875791c67e237eab75f85df109f2408b4`.

Observed Python 3.14.3, SQLite 3.53.2, Redis 8.10.2, Bloom module version 81001,
and Docker client/server 29.8.0 on macOS ARM64. The configured image was
`redis@sha256:3811787313eba226a2ef38658c6ccb91cd5e110edc89c37767de373120a0e5a0`;
its runtime image ID was
`sha256:675f7644831d85995868250485bf7a71970257f74da31c62969a868d3f3eff2e`.

| Scenario | Independent observation and discriminator |
| --- | --- |
| Bounded TTL jitter | Fixed virtual schedule peak changed from 128 to 13 keys per bucket; positive-only jitter exceeded the configured age ceiling. Eight real PTTL checks passed. These are arithmetic/TTL observations, not measured request-load reduction. |
| Repeated negative cache | Twenty same-key uncached reads contrasted with one database read and nineteen cache hits; observed expiry caused the next database read. No distinct-key or simultaneous-request capacity claim. |
| Creation versus stale negative fill | DEL-only control resurrected absence. The real Lua comparison rejected the old snapshot after creation; missing-floor publication was rejected and reads used SQLite. The separate DB/Redis acknowledgement boundary remains explicit. |
| Bloom readiness | Old generation, missing filter, and wrong-type replacement took authoritative fallback; membership was checked with readiness and type in one script. Quiescent-build completeness remains an assumption, not an online update protocol. |
| Bloom false positive | Actual witness `absent-6`, found after seven probes, required one SQLite lookup and returned missing. The deliberately high configured error rate is not a measured production false-positive rate. |
| Lease and resource fence | Stale DEL removed the successor lease in the unsafe control. Conditional release preserved it, and a SQLite UPDATE guarded by the accepted fence rejected the stale write after the successor's fence was installed. No cross-store atomic grant or external-effect fence is claimed. |
| SCAN and KEYS | KEYS was denied by the fixture ACL. SCAN recovered all 96 stable target keys in 136 calls, with 58 empty nonterminal batches and a largest batch of two despite COUNT 1. Cursor zero ended the iteration. |
| Singleflight | The unshielded control canceled shared work and its second waiter. Shielding preserved that waiter, used one loader, rejected an additional active key, and settled both tasks. This is one-process asyncio evidence. |

## Resource ownership and remaining limits

The run created container
`b4f9613482041fcb69c02d099be98875db4fe4117755cc5864c598bef735c760` on a random
loopback port. Its report records label-checked removal and no remaining owned
containers; a separate Docker query independently confirmed that exact container
was absent. SQLite/Redis handles and the temporary directory have scoped cleanup
in the inspected code. This review did not independently inject signals, kill the
host, or interrupt Docker startup/cleanup.

The Bloom guard does not establish online DB/filter synchronization or safe reuse
of generation names. The fencing schedule demonstrates rejection after a newer
fence reaches the resource, not automatic cancellation at lease expiry. SCAN's
stable-set run produced no duplicate keys; duplicate tolerance is visible in the
accumulation/check logic but was not forced in this rerun. Concurrent mutation,
cluster coverage, enumeration latency, stochastic jitter quality, refresh
scheduling, and scaling are untested. The README and per-case limits retain these
boundaries. No new model calls or skill-effectiveness judgments were performed.
