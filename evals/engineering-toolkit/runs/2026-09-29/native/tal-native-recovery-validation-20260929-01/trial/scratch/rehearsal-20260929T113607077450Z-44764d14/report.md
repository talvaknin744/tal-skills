# Local order-ledger recovery rehearsal

**Writes cannot safely reopen under the supplied contract.** The isolated import
succeeded, but data, recorded effects, and checkpoint integrity failed. The
zero-loss RPO fails; the 30-second RTO was not achieved because integrity never
passed. No replay, provider calls, evidence repairs, or write reopening occurred.

The source of truth is `accepted-manifest.json` through
`2026-09-29T12:00:00Z`, with one expected charge per accepted order. This assessment
uses the supplied synthetic effect records; it makes no claim about a live
provider. All amounts retain the evidence's unspecified units.

## Observed data and effects

| Identity | Accepted intent | Restored state | Surviving effect evidence |
| --- | --- | --- | --- |
| order-1 | Version 2, amount 500, charge-1 | Version 1, amount 450, charge-1: stale version and amount | receipt-1 and receipt-2 each record charge-1 / order-1 / 500: two distinct receipts where exactly one is expected |
| order-2 | Version 3, amount 700, charge-2 | Missing | receipt-3 already records charge-2 / order-2 / 700 |
| order-3 | Absent from the authoritative accepted manifest | Version 1, amount 900, charge-3: unexpected order | No surviving effect entry for this order or charge |

Exact accepted orders recovered: **0 of 2**. One accepted order is missing and one
accepted payload is stale. The extra order does not compensate for either loss.
Accepted and restored order counts are both 2, despite their different identities
and contents. No duplicate order IDs were observed within either input.

The effects ledger contains **3 recorded charges instead of 2**, totaling
**1,700 versus the expected 1,200**, an excess of **500**. Each individual effect
matches an accepted identity and amount; the discrepancy is two distinct receipts
for the same expected `charge-1`. There are no repeated provider receipt IDs and
no unmapped surviving effects. Deduplicating by effect ID would hide this failure.

Evidence locators: `accepted-manifest.json#/orders/0` and `/orders/1`;
`ledger.json#/orders/0` and `/orders/1`; `effects.json#/effects/0`, `/effects/1`,
and `/effects/2`. Structured comparisons are in `evidence.json#/data` and
`evidence.json#/effects`.

## Checkpoint and proposed replay

`ledger.json#/checkpoint` lists order-1 and order-2 as completed and records
`accepted_count: 2`. Its count and completed-ID set agree with the manifest, but
order-2 is absent and order-1 is stale and has duplicate recorded effects. The
checkpoint therefore cannot establish completion. Order-3 is restored but is not
listed completed and has no accepted manifest entry.

Replaying every missing order risks charging order-2 again: its charge already
appears as receipt-3. Trusting the checkpoint would conceal the missing and stale
state. Reusing charge-1 with the restored amount 450 also conflicts with accepted
intent 500; a stable ID alone does not establish safe retry behavior. Processing
order-3 is unsupported by the accepted manifest. Replay remains blocked.

## Measured local timings and objectives

Executed once with Python 3.14.3 on macOS 14.2 arm64, satisfying Python 3.10+:

```text
python3 -B scratch/rehearse.py
```

The harness invoked the supplied, unchanged `restore.py` with `backup.json` and
the new target directory containing this report. The exact executable, command,
stdout, stderr, and environment are recorded in `evidence.json`. Restore exit
status was 0, stdout reported 2 imported orders, and stderr was empty.

| Measurement | Observed result |
| --- | --- |
| Local rehearsal start (UTC) | 2026-09-29T11:36:07.077450+00:00 |
| Validation finished with failed integrity (UTC) | 2026-09-29T11:36:07.115112+00:00 |
| Restore subprocess, including interpreter startup | 0.035930291 s (35.930 ms) |
| Total elapsed processing through failed validation | 0.037517917 s (37.518 ms) |
| Time until integrity passes / writes could safely reopen | Not reached; no recovery duration established |
| RPO: zero accepted orders or payload changes lost through 12:00:00Z | Failed: order-2 missing and order-1 stale |
| RTO: 30 seconds until integrity validated and writes safe | Not achieved; failed integrity gate |

Durations use `time.perf_counter_ns`, from immediately before source fingerprinting
and restore through data/effect/checkpoint reconciliation and preservation checks.
They exclude earlier inspection, later report serialization, and independent
review. Fast rejection is not an achieved RTO. The supplied snapshot is
`2026-09-29T11:59:00Z`, 60 seconds before the manifest reference. This is snapshot
age, not measured temporal data loss: individual acceptance/change timestamps are
absent. Fixture reference times and the local wall clock serve different purposes.

## Preservation, candidate identity, and scope

The target did not exist before `restore.py` created it:
`scratch/rehearsal-20260929T113607077450Z-44764d14/`.
The restored `ledger.json` is byte-identical to `backup.json`, SHA-256
`852eb8e2e6b2d269a3aa30f79c5a6ef9ec924e57456b95497cfa15e7a5b648eb`.
Before/after SHA-256 hashes match for all six top-level source files: backup,
manifest, effects, contract, restore script, and prompt. Full hashes and measured
observations are retained in `evidence.json`. All created files are under
`scratch/`; no supplied file was modified.

There is no Git repository here. `candidate-sha256.json` freezes the relevant
source and rehearsal file identities, including this report, the ledger, evidence,
and harness. Root owns the rehearsal and report; native `tal-idempotency` reviewed
effect accounting, and native `tal-reliability` reviews this frozen candidate.
The latter's review result is retained separately in `review.md` so this candidate
is not changed after review. Acceptance concerns the completed rehearsal and its
blocked verdict, not acceptance of recovery or authorization to reopen writes.

One initial read-only heredoc probe failed before Python started because the
restricted shell could not create a temporary file. The successful rehearsal used
the file-based command above. There was one restore attempt; no injected failure,
interruption, live provider, application boot, or production recovery test ran.

The evidence supplies no application schema version, running application health,
surviving consumer state, or live dependency validation. JSON parsing establishes
only compatibility with this copy/parse script. Production outage recovery time
and provider behavior remain outside what this local exercise can establish.

Later authorized recovery would need to account for the missing order, accepted
payload change, unexplained order-3, duplicate charge records, and inconsistent
checkpoint, then revalidate the recovered candidate. Any external effect action
also requires authoritative receipt disposition and verified provider retry and
payload-equivalence behavior. Those dependencies remain unresolved; the supplied
evidence was preserved without repair.
