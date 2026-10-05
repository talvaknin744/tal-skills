# Worker-rollout runtime independent review — 2 October 2026

The frozen runtime has **no open actionable findings** after two repairs. An independent CLI execution passed **8/8 scenarios** with 30 real POSIX worker subprocesses and PostgreSQL 18.6, Python 3.14.3, psycopg 3.3.6 and Docker 29.8.0. The [structured record](runtime-review.json) embeds the independent report, exact source/report identities, historical findings and review limits. This is local process/database evidence.

## Findings and observed closure

1. **Closed P2 — expired work mislabeled completed.** The draft removed a deadline-exceeded job from local reservations and inferred completion from its absence. The final [runtime](../../../examples/worker-rollout/runtime.py) retains explicit terminal outcomes. The independent combined SIGTERM/expiry case returned `deadline-exceeded`, zero receipts/progress/total, cleared ownership and no completion timestamp. It did not report useful completion.
2. **Closed P2 — final checkpoint could not resume to completion.** A valid pending cursor at input length was admitted but later indexed past the input. The final runtime performs guarded completion on restoration. The independent [regression](../../../examples/worker-rollout/verify.py) SIGKILLed after the last checkpoint and before completion: the retained cursor/receipt/total survived, and v2 finalized without another effect. Historical author snapshots remain unchanged.

The scope feedback on SQL timing is also reflected accurately: remaining budget sets per-statement/lock bounds, not a strict cumulative transaction/commit deadline. Effects admitted before the database deadline may commit afterward. The [PostgreSQL timeout contract](https://www.postgresql.org/docs/18/runtime-config-client.html) and [Python signal rules](https://docs.python.org/3/library/signal.html) support those limits; this review does not infer a hard platform shutdown guarantee.

## Independent observations

| Boundary | Observed result |
| --- | --- |
| Harmful baseline | A/B/C exit cleanly; checkpoint 3/total 6 remains business-failed after 3 business failures; successor rejects it. |
| Protected three retirements | Active and genuinely prefetched reservations are inventoried; readiness 200→503; repeated SIGTERM preserves the first budget; current slice and both releases succeed. Main finishes 6 steps/total 21 with 0 business failures; all 3 returned jobs complete. |
| Claim-publication seam | Database inventory recovers a committed claim missing from the local list; post-close generation claim is rejected; accepted work completes. |
| Effect→checkpoint crash | Actual SIGKILL leaves receipt/total committed at cursor 0; v2 replays operation 0, then completes without duplicate effect. |
| Last checkpoint→completion crash | Actual SIGKILL leaves a full cursor pending; v2 completes with unchanged receipt and total 4. |
| Stale live owner | Actual SIGSTOP/SIGCONT around takeover; old effect, checkpoint and release reject; successor state remains unchanged before finishing. |
| Mixed interpretations | V2 restores retained V1 checkpoint semantics and executes structured V2 input. Unsupported tuple rejects before ownership changes; immutable fields reject modification. |
| Deadlines | Database expiry before claim and during drain is terminal. A 0.2-second first-signal budget stops a 2-second slice; business deadline/budget remain intact and a successor completes after natural fixture lease expiry. |

A separate literal fixture ledger recalculated **18 published snapshots across 13 jobs**, including exact receipt step/amount/hash sets, input identity/interpretation, cursor, total and terminal timestamps. It did not call the implementation’s interpreter. The admission-race case does not publish its final row; its completion assertion is observed through the executed, hash-bound verifier rather than separately recalculated from report data. Observed completion timestamps precede the fixture deadlines; this does not prove strict commit-before-deadline behavior.

The authoritative generation lock and inventory ordering are coherent: claim holds `FOR SHARE`; closing that same row orders later claims before reading durable ownership. The protected effect locks the job and verifies owner/epoch/input while receipt and total remain in the same transaction. [PostgreSQL row-lock semantics](https://www.postgresql.org/docs/18/explicit-locking.html) support that boundary. The guard stays inside the protected effect transaction; this guarantee is specific to effects owned by this database.

Independent postflight checked **all 30 published worker PIDs absent**, **all 30 readiness ports refusing connections**, and **no container under the exact run-id label**. The executed verifier also checked zero other example application sessions, closed the observer/control streams, removed its labeled container and verified the database port closed. Cleanup targets only run-owned resources. The author report and both historical report byte hashes are unchanged; the legacy draining files have no tracked diff.

## Evidence binding

Executed command:

```sh
PYTHONDONTWRITEBYTECODE=1 examples/worker-rollout/.venv/bin/python examples/worker-rollout/verify.py \
  --report /tmp/worker-rollout-review-archive-agents-20261002.json
```

Exit 0. The independent raw report is recoverable from `independent_run.report` in the review JSON and has SHA-256 `6c6d6cb2bc5d5a577f121a8488f5e82a6bd8a6905e3936ee79231f577e35b820`. Its temporary file was removed after embedding. The preserved [author report](../../../examples/worker-rollout/verification.json) is SHA-256 `e40bd0c4de172d998730387584e0a964170b9f8dd0caed1ca2ad9acf5121f2bd`. Every source hash matches both reports and the files checked before/after independent execution.

| Frozen source | SHA-256 |
| --- | --- |
| [verify.py](../../../examples/worker-rollout/verify.py) | `684161bd8139b59328e6959acb9e96b578443810ed6212b37d3f6ee943b1521b` |
| [runtime.py](../../../examples/worker-rollout/runtime.py) | `8fa4aa4aa3d81f6febabfe5183a3f3456e95afcce45c268b70ae6ffb31ea5038` |
| [protocol.py](../../../examples/worker-rollout/protocol.py) | `8c4ee5144e125d48a718c34d13675d19a0d807c427e5ddaa67b20f9f0f6c489b` |
| [worker_v1.py](../../../examples/worker-rollout/worker_v1.py) | `64e2e8f7dbd0cfdb8fa75c7d0e4cdf3637c80660d4d7b6e2a5f95031a67d697e` |
| [worker_v2.py](../../../examples/worker-rollout/worker_v2.py) | `bbff208579cccb1fe62d739838595a88331885dac921b96c53e21f848f5a628f` |
| [worker_incompatible.py](../../../examples/worker-rollout/worker_incompatible.py) | `30533da7c006b0a137b7716630c0f129b84b1a3803272feba11878912a669a4f` |
| [schema.sql](../../../examples/worker-rollout/schema.sql) | `b88ef04ec8c05f305c2c79a94acf62655a3e79ea3ec7dd8fd0586f5043fc916d` |
| [requirements.txt](../../../examples/worker-rollout/requirements.txt) | `6d9f3ccc398c4a22a47e08bfd19b95ba54e9330006c87b7a36c6d5e0854abefb` |
| [README.md](../../../examples/worker-rollout/README.md) | `0380d1c94d712e202b389760b3e442c8d981c651ce9a849b34d9210225c81cf8` |
| [sources.md](../../../examples/worker-rollout/sources.md) | `f542941557a3e03a0837970563bda09639c15f2d592556ab530d9751919ae96d` |

## Acceptance boundary

The [README](../../../examples/worker-rollout/README.md) and [source ledger](../../../examples/worker-rollout/sources.md) keep the boundaries clear: short slices represent long work; v1/v2 are named source profiles over shared modules; prefetch is a local database reservation; control seams are outside protected transactions. Lease/deadline timestamps are deliberately advanced in selected cases; only drain-budget recovery waits for natural expiry.

This run does not establish Kubernetes rollout behavior, 12/24-hour endurance, an external provider’s idempotency/fencing, broker delivery budgets, exhaustive concurrent admission races, arbitrary release compatibility, suspend/clock-jump behavior, database failover or physical durability. PostgreSQL uses tmpfs; enabled fsync/synchronous_commit is not power-loss, restore or RPO evidence. The current [Psycopg documentation](https://www.psycopg.org/psycopg3/docs/basic/transactions.html) identifies 3.3.7.dev1 while the separately executed dependency is 3.3.6. Selected primary-documentation checks are recorded as such.

The review edited only `runtime-review.md` and `runtime-review.json`; it ran no model requests and changed no implementation, skill, configuration, commit or publication state. Changed bound source bytes require focused rechecking.
