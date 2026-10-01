Recommend a **continuously maintained historical left join, keyed by fact ID, with a keyed upsert sink**. The projection should show the latest accepted understanding of the rate effective at each fact’s event time. This follows the requirements in [design.md](<trial>/workspace/project/design.md:5); the proposed latest-rate lookup, unkeyed append output, and ten-minute TTL do not satisfy them.

For each fact, match exactly one valid currency interval using:

`effective_start ≤ fact.event_time < effective_end`

Use half-open intervals. A missing or withdrawn interval produces a visible unmatched fact with a null converted amount. Later current rates cannot fill that gap. Arrival time determines when new knowledge becomes available; it does not determine which rate applies.

After each supplied source change has been processed, the result should be:

| Arrival, UTC | Accepted change and interpretation | Sink operation | Visible `f1` result |
|---|---|---|---|
| 09:00 | `r1/rev1`: EUR 1.10 from 09:00 | None; no fact yet | Absent |
| 10:00 | `r2/rev1`: EUR 1.20 from 10:00; `r1` covers `[09:00, 10:00)` | None; no fact yet | Absent |
| 10:05 | Admit `f1`, whose event time is 09:30; match `r1/rev1` | Insert keyed `f1` | Matched, USD **110** |
| 10:06 | Same logical fact and payload, new delivery identity | None | Matched, USD **110** |
| 10:10 | `r1/rev2` completely replaces its earlier rate | Replace keyed `f1` | Matched, USD **115** |
| 10:15 | `r1/rev3` withdraws `[09:00, 10:00)` | Replace keyed `f1` | **Unmatched**, USD **null** |

The arithmetic is `100 × 1.10 = 110`, then `100 × 1.15 = 115`. Withdrawal removes the conversion, not the fact. Retain its original EUR amount, event time, and an unmatched reason such as `rate_interval_withdrawn`; retain `r1/rev3` as diagnostic evidence.

`r2` remains the rate from 10:00 onward throughout this schedule. The proposed lookup would instead produce USD 120 at 10:05, potentially append another 120 on replay, and leave those rows stale after correction and withdrawal.

**Identity and revision authority must be explicit.** Deduplicate facts by logical `fact_id`, independent of delivery identity. The supplied facts are immutable: an identical repeat contributes once; a different payload under the same fact ID requires visible reconciliation rather than arbitrary arrival-order selection.

For rates, retain a stable version identity, such as `(currency, rate_version_id)`, and an authoritative revision order within that identity. A complete newer revision replaces the previous version. An older revision cannot undo a correction or withdrawal. Equal revisions with different payloads are conflicts. Keep withdrawal tombstones and revision authority so replay cannot resurrect `r1/rev1`. Reject or quarantine overlapping intervals for reconciliation before publishing an ambiguous match.

Corrections must re-evaluate already admitted facts in the affected interval, including facts currently unmatched. A withdrawal must preserve the interval’s gap; removing its record must not extend a predecessor through it.

**History needs separate bounds for admission, revision, and recovery.** The [24-hour lateness and 48-hour recovery requirements](<trial>/workspace/project/design.md:13) leave the replay clock unspecified:

- If recovery replays source arrivals from the preceding 48 hours, those facts could originally have arrived 24 hours late. Plan conservatively for **72 hours of event-time coverage**.
- If the 48 hours explicitly measures fact event age, the combined coverage is **48 hours**.

Define that distinction in the contract. Neither number alone proves that state can be deleted after that much wall-clock time.

Retain the rate version covering the oldest admissible fact, all subsequent effective-time boundaries, and applicable revision/tombstone evidence. That anchor version may have started months earlier. A TTL measured from the rate’s arrival would discard necessary history.

Retain fact payloads and an index by currency/event time while accepted dimension changes can revise them. Also retain deduplication and revision evidence for every replay that can still be admitted. A replay horizon does not necessarily bound the effective age of a newly accepted correction: if corrections can touch older reporting intervals, keep those facts and rates available through durable historical storage.

An implementable retirement rule must establish that older input is permanently inadmissible, relevant corrections are closed, and recovery can restore the remaining state. Otherwise, archive state with a lookup path instead of forgetting it. Ordinary state cleanup must not silently delete reporting rows or make duplicates admissible again.

Small visible output does not establish a memory bound. Size fact/index state, rate history, tombstones, identity evidence, pending changes, and recovery metadata separately. Stalled input progress must not expire required state.

**Use mutable output unless explicit closure is established.** Neither the first match nor the first unmatched result is final. An accepted later correction or restoration can change it. A watermark describes completeness under an admission policy; a checkpoint describes recovery progress. Neither alone proves that historical corrections have ended.

The sink should maintain one current row per `fact_id`, containing the original fact, nullable conversion, match status, rate provenance, and a durable projection version. Support atomic keyed replacement, or equivalent retract/insert operations that readers observe atomically. Repeated delivery must be idempotent, and older output versions must not overwrite newer ones after restart.

An append-only change log is also viable if it carries keys, ordering/version information, and explicit replacement/retraction semantics, with a consumer materializing current state. The proposed unkeyed append result is insufficient. Dimension withdrawal emits an unmatched replacement, rather than deleting the fact row.

Persist a recoverable relationship among both inputs’ positions, join state, revision decisions, and output publication progress. A checkpoint may coordinate an internal snapshot, depending on the engine, but does not by itself establish a business transaction across independent sources. If reports require a consistent snapshot across many affected facts, publish a completed logical cut and make that cut visible atomically.

Several alternatives are valid for different time questions, but only the first meets this specification:

| Time question | Contract | Answer for `f1` |
|---|---|---|
| What rate applied at occurrence, using current accepted knowledge? | Maintained historical enrichment | 110 → 115 → unmatched |
| What rate applied at occurrence, using knowledge at first publication? | Historical lookup frozen when first emitted | 110 remains 110 |
| What rate was current when processing the fact? | Processing-time lookup | 120 at 10:05; retain that lookup choice for reproducible replay |
| What would this fact be worth at the current effective rate? | Maintained current-rate enrichment | 120 throughout the supplied fact/correction schedule |
| What did we know about occurrence-time rates at a chosen earlier knowledge time? | Bitemporal history: effective time plus knowledge time | 110 as known at 10:05; 115 at 10:10; unmatched at 10:15 |

The bitemporal alternative requires retaining superseded revisions and their knowledge-time boundaries, beyond the latest accepted revision needed for the current corrected projection.

Propose these verification schedules:

1. **Exact supplied trace:** Assert the keyed sink operations above and one visible fact throughout. Check values and status after every change.
2. **Out-of-order history:** Deliver `f1`, then `r2`, then `r1/rev1`. Expect unmatched → unmatched → 110. Deliver `r1/rev2` before rev1 and expect 115; deliver rev3 first and verify older revisions cannot restore the match.
3. **Identity and authority:** Repeat facts with different delivery IDs, replay old rate revisions, and send conflicting same-revision payloads. Assert no duplicate contribution, no regression, and a reconciliation record.
4. **Interval boundaries:** Test immediately before, exactly at, and after 09:00 and 10:00. After withdrawal, `[09:00, 10:00)` is unmatched; exactly 10:00 uses 1.20. Test a missing interval, an effective-time correction, and an overlap requiring reconciliation.
5. **Admission and closure:** Test just before, at, and after the agreed lateness/recovery boundaries. Verify the specified acceptance or audited rejection. Test corrections before and after any explicitly declared immutable boundary.
6. **Retention and stalled progress:** Advance processing time beyond ten minutes while an input stalls. Replay after recovery and verify retained facts, anchors, and tombstones. Include an anchor older than the nominal history horizon and many versions despite few visible rows.
7. **Bootstrap, restart, and sink ordering:** Overlap snapshot and live input around correction/withdrawal; restart around output publication; redeliver outputs out of order. Require one final unmatched `f1`, no resurrection, and consistent publication progress.

These are proposed checks, not executed engine validation. Only local files were read; files remain unchanged and no external operation was performed.
