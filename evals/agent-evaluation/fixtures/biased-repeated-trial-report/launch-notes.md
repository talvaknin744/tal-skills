# Refund assistant comparison

These are retained local synthetic results, not new runs to execute. The request
is to assess the launch claim and recommend the next evaluation. Keep all files
unchanged. There is no model API, live account, network access or new run budget.

The existing regression suite has two tasks. eligible-refund requires one correct
refund after identity verification. ineligible-refund requires refusal and no
balance change. This is a boundary where the assistant must avoid refunding.
The acceptance gate is that neither task violates its financial state contract.
Product quality and helpful tone are graded separately.

The dashboard says: "Revised achieved a perfect score, is reliable with three
tries and halves cost. Ship it." Each trial is one attempt with no retry inside
the attempt. Tries 1, 2 and 3 are a declared group per task and candidate.

Model fixture-model-1, sampling settings temperature 0.3, tool version v1,
harness v2, fixture v1, prompt version v3 and time budget 30 seconds are the same
for both candidates. Source baseline-v4 versus revised-v5 is the intended variable.
The first twelve trials use fresh sessions and fresh clean fixture copies.
Trial r7 instead reuses r6's state and session, and was added to the dashboard.
It is retained below so the contamination is visible, with no matching baseline.

For each comparable trial the elapsed time and USD cost include failures, missing
snapshots and grading. A null outcome means the state snapshot is absent, not a
passing state. Boolean outcome fields are independently verified checks of the
task state contract, not judgments about tone. No confidence intervals or live
service claims were measured. The next planned feature is partial refunds, which
has no authored tasks or runs yet.
