# Review state

Maintain a small copyable record in the current conversation or a user-selected file. Use stable skill IDs and separate problem IDs. Recover missing state from the user rather than inventing continuity or cross-chat synchronization.

```yaml
last_actual_session: null
goal: null
timezone: null
deadline: null
confirmed_study_minutes: null
protected_sources: [] # identifier and status from explicit learner reports
skills:
  - id: null
    target: null
    source: null
    attempts: [] # actual date, problem ID, fresh/familiar, reasoning evidence,
                 # score, confidence if supplied, help, verification status
    observed_error: null
    possible_cause: null # optional hypothesis, separate from observation
    corrected_rule: null
    review_anchor: null
    remaining_targets: []
    next_review: null
    transfer_check: null
outstanding_items: [] # unanswered, deferred, or satisfied by verified coursework
```

## Transitions

| Observation | Record and next action |
|---|---|
| No response | Keep unanswered and due; resume instead of stacking quizzes. |
| No valid approach | Score 0; diagnose prerequisite or task mismatch, then instruct. |
| Consequential reasoning gap | Score 1; repair the first consequential error. |
| Correct and justified | Score 2; record the conditions, assistance and exposure separately. |
| Marking cannot be verified | Score uncertain; retain the unresolved check without promoting mastery. |
| Help, solution exposure or immediate repeat | Record assisted/familiar performance; choose a fresh independent check. |

A newly studied or corrected skill can start with proposed returns around +1, +3 and +7 days from the **actual** learning/correction date. These are adjustable defaults, not measured forgetting probabilities. Preserve future targets and adapt to performance, the retention horizon and capacity. Once the sequence is complete, propose a later maintenance check when relevant.

A correct justified **independent** attempt consumes only the matching current due target. Verified ordinary coursework can supply this evidence when the work, date, exposure and assistance are available. Record its existing problem ID; consume it once. Keep future delayed targets intact. Multiple overdue targets for one skill can consolidate into one present check while preserving the next appropriate future return.

After a consequential failure or help, use the actual successful repair date as a new anchor. Until repair occurs, record repair pending. Repeated failures trigger diagnosis or instruction, rather than repeating the same card indefinitely. Keep older required topics represented alongside urgent errors. Targets beyond an exam cutoff are omitted from exam preparation or transferred to a separately agreed longer-term goal.

Report improvements using comparable delayed independent attempts. Different difficulty, prior exposure, time limits or assistance can prevent a fair comparison.
