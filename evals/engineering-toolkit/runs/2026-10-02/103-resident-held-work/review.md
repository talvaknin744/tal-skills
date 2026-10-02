# Independent review

**Candidate:** overload-control, tree SHA-256 a9289817511553e5102589836eebd046feb0387de37ae4726cd80f7ed0c034f5.
**Run:** tal-worker-rollout-oct02-resident-held-work-16; subject gpt-6-sol (xhigh, inherited), codex-cli 0.159.2. **Scorer:** GPT-6 Luna.
**Independence:** I authored neither candidate nor response.

Independent score. Scorer GPT-6 Luna; subject gpt-6-sol xhigh, inherited; codex-cli 0.159.2. Candidate overload-control tree a9289817511553e5102589836eebd046feb0387de37ae4726cd80f7ed0c034f5. Raw case_compliant=false and filesystem_read_isolation=false; user/system/plugin guidance inherited. Native discovery recorded candidate metadata and body_read_observed at item_1, indicating a source prefix was returned, not that all references were read. Run completed exit 0 without timeout and inputs unchanged. These conditions limit causal attribution; score is of the saved observable answer.

**Score:** 14/14. Critical criteria: resident-accounting=2, current-completion=2, reserve-policy=2, borrow-reclaim=2, scope-and-evidence=2.

| Criterion | Severity | Score | Evidence |
|---|---|---:|---|
| resident-accounting | critical | 2 | evidence/answer.md (3, 13, 30): Defines ownership from receipt through actual release, including prefetch, blocked, retry wait and cleanup; explains active_A <= 2 does not establish free capacity. |
| current-completion | critical | 2 | evidence/answer.md (7-9): Current and draft schedules finish B1/C1 at 9, late; the protected schedule finishes B/C at 2 and A3/A4 during 8-16. |
| reserve-policy | critical | 2 | evidence/answer.md (9, 13-17): Limits resident A to two, keeps A3/A4 at the durable broker, runs B/C at 1-2, then A3/A4 at 8-16, while retaining accepted-job identity and payload. |
| borrow-reclaim | critical | 2 | evidence/answer.md (8, 13, 15, 31): Cancellation acknowledgement at 1 does not release executing borrower slots before 8; actual execution, settlement and cleanup govern release. |
| progress-and-cost | major | 2 | evidence/answer.md (17, 19-21): Acknowledges A delay, eventual completion, and hypothetical interruption loss/repeated work; compares common horizons and separates execution slot-time from occupancy. |
| verification-oracle | major | 2 | evidence/answer.md (25-32): Labels checks proposed/unexecuted; covers held ownership, A residency, actual release, cancellation acknowledgement versus completion, recovery, deadlines, eventual progress, time-1 arrivals, prefetch, blocked/retry and cleanup. |
| scope-and-evidence | critical | 2 | evidence/answer.md (25, 29, 34; evidence/workspace.patch): Says no worker/broker experiment or operation; fixture unchanged; distinguishes supplied arithmetic from proposed validation and production guarantees. |

Criteria scored against saved response and supplied evidence. Proposed checks are not counted as executed experiments.
