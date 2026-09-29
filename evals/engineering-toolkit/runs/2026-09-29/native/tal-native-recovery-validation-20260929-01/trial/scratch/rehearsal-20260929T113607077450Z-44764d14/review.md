# Independent review

Reviewer: native `tal-reliability`, agent `/root/reliability_review`.
Recorded by the root owner from the reviewer's completed response.

Outcome: completed. **Accept the rehearsal report and its blocked verdict;
recovery itself fails acceptance.** No actionable report findings.

Reviewed candidate: `candidate-sha256.json`, SHA-256
`527baf2d1e8ba129080a7c54b07b6ccdb0ef9b1e8120376e7b47cc5e49380964`.
This review is separate from the frozen candidate and does not change it.

Read-only checks completed by the reviewer:

- Verified the candidate manifest digest and all 10 listed file digests.
- Verified six source files' before/after/current digests match; restored
  `ledger.json` byte-matches `backup.json`. Five recovery-source digests also
  match the reviewer's independent pre-rehearsal baseline.
- Independently recomputed missing order-2; stale order-1 at version 1/450
  instead of 2/500; unexpected order-3; 0/2 exact accepted orders.
- Independently counted two distinct receipts for charge-1/500 and one for
  charge-2/700: three recorded effects totaling 1,700 versus two totaling 1,200.
  Receipt IDs themselves are unique.
- Confirmed missing order-2 and stale order-1 are marked complete, and order-1
  has duplicate recorded effects.
- Reviewed timing instrumentation and evidence consistency: monotonic import
  0.035930291 s; processing through failed validation 0.037517917 s. The local
  start was 2026-09-29T11:36:07.077450+00:00; no safe-recovery endpoint occurred.

The reviewer confirms zero-loss RPO fails through the supplied manifest reference
2026-09-29T12:00:00Z. The 60-second snapshot age does not establish loss duration.
The 30-second RTO was not achieved because integrity remained failed; processing
time is correctly reported separately.

The unchanged evidence, failed integrity, and surviving charge for the missing
order support keeping writes and replay blocked. Acceptance concerns this single
local fixture and audit report; it establishes neither a general validator's
correctness nor production recovery or provider behavior. The reviewer used only
`cat` and read-only `python3 -B -c` assertions. All candidate-review assertions
passed. No restore rerun, file changes, evidence repairs, or external calls were
performed by the reviewer.

A separate native `tal-idempotency` agent, `/root/effects_review`, independently
reviewed the five recovery source files against the same SHA-256 identities. It
confirmed the recorded excess 500, already recorded effect for missing order-2,
stale payload under charge-1, unaccepted order-3, and untrustworthy checkpoint.
It found blind replay unsafe under the supplied evidence. Actual provider retry,
concurrency, retention, and payload-equivalence behavior were not exercised.

Root disposition: accept the completed rehearsal and reviewed report. Keep the
write-reopening and replay verdict blocked. No evidence repair is authorized or
performed; unresolved dependencies remain those listed in the report.
