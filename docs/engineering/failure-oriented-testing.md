# failure-oriented-testing

## What it does

Make a specific failure observable and reproducible at the smallest boundary that retains it.

## When to reach for it

Use when a failure, generated input or adverse ordering needs a focused reproducible check. A test plan names unrun checks; implementation executes the authorized experiment.

## It's working if

- Write a falsifiable claim with trigger, protected invariant, required observation and independent oracle.
- Choose a controlled fault, input or schedule that distinguishes correct behavior from the suspected failure.
- Retain a minimized counterexample with environment, command, expected and observed outcomes; preserve flaky failures.
- Replay against the candidate and report explored cases and remaining integration gaps without treating coverage as proof.

## Where it fits

Compose with code-and-docs-cleanup for preservation checks or concurrency-correctness for controlled histories.

Canonical skill: [skills/engineering/failure-oriented-testing/SKILL.md](../../skills/engineering/failure-oriented-testing/SKILL.md).
