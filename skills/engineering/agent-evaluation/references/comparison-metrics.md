# Comparison metrics

Choose the reliability question before running trials. One success among several
attempts answers whether the agent can sometimes solve a task. Success on every
attempt asks about consistent execution. Label a metric's task set, number of
attempts, retry policy and denominator explicitly. A retry inside one trial is
part of that trial's cost and behavior, not a fresh independent attempt.

For k attempts, pass@k concerns at least one success and pass^k concerns all k
succeeding. A supplied group with one pass and two failures satisfies the first
event and fails the second. These observations alone do not estimate a stable
success probability. Choose repetitions from the decision and available budget,
report counts and uncertainty without inventing statistical confidence.

Keep confirmed passes, failed contract checks, unknown outcomes and infrastructure
errors distinguishable. An absent snapshot cannot satisfy a required state gate.
An empty run is an unsuccessful attempt, not a zero cost success. Preserve partial
results even when they cannot enter a valid paired comparison. State why a trial
was excluded from an aggregate and retain it in the attempt inventory.

Compare shared task, model, tool, host and budget conditions. A system that finishes
only easy tasks can look faster when missing hard tasks are omitted. Report task
coverage before comparing cost or latency. When changing instructions or tools,
hold the model fixed. When comparing models, hold the evaluated task and tool
revision fixed. If multiple variables changed, report association without claiming
which change caused it.

Keep correctness separate from measured effort. Report available tokens, tool
calls, elapsed time and billed cost, including failures and retries. Cost per
confirmed success divides total cost of the declared attempts by confirmed
successes, not just the cost of successful trials. With zero confirmed successes
that metric is undefined. Show the underlying counts, and state unavailable cost
or usage as unavailable. A marker showing that a tool or skill was used establishes
that observable behavior, not task success.
