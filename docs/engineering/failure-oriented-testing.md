# failure-oriented-testing

## What it does

Make a specific failure observable and reproducible at the smallest boundary that retains it.

## When to reach for it

Use when a suspected failure, generated input or adverse ordering needs a reproducible check with an independent oracle. Settled low-risk edits already covered by meaningful tests do not need this workflow.

## It's working if

- The test claim states a falsifiable claim with trigger, protected invariant, required observation and independent oracle.
- The recommendation selects a controlled fault, input or schedule that distinguishes correct behavior from the suspected failure.
- The test retains a minimized counterexample with environment, command, expected and observed outcomes, including flaky failures.
- The report records replay against the candidate and report explored cases and remaining integration gaps without treating coverage as proof.

## Where it fits

Compose with code-and-docs-cleanup for preservation checks or concurrency-correctness for controlled histories.

Canonical skill: [skills/engineering/failure-oriented-testing/SKILL.md](../../skills/engineering/failure-oriented-testing/SKILL.md).
