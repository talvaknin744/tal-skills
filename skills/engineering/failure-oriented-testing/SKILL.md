---
name: failure-oriented-testing
description: Implement or review deterministic regressions for injected faults, adversarial schedules, generated inputs, or recovery. Use when a suspected failure needs an independent oracle; settled low-risk edits follow ordinary testing.
license: MIT
---

# Failure-oriented testing

Make a particular failure observable and reproducible at the smallest boundary that
retains it. Here, an oracle is the independent rule that decides whether an outcome is correct. Match the requested work: a test plan states unrun checks; an
implementation executes the authorized experiment.

## 1. Define the falsifiable claim

Name the requirement, observable outcome, and an unsafe result the test must
distinguish. Derive behavioral partitions from the contract before consulting
coverage. Choose an independently justified oracle: explicit expected examples,
a simpler specification, conservation law, or established implementation whose
permitted differences are recorded. Copying the production calculation into the
expectation reproduces its mistakes.

**Done:** the test can say which promised outcome is wrong, and why its expectation
is authoritative. Ambiguous requirements remain explicit questions.

Example: State that after a timed-out commit retry, the record must exist exactly once.

## 2. Choose a credible experiment

List the real implementation/runtime, substituted dependencies, initial state,
input or schedule, observation, and finite budget. Exercise the implementation
actually deployed, including a native extension when that is the risky boundary.
A fake cannot establish a real database, broker, or network guarantee.

For generated inputs, differential checks, or native fuzzing, read
[generated-inputs.md](references/generated-inputs.md). When an operation's meaning
depends on prior actions, read [state-models.md](references/state-models.md). For timeouts, interruption,
retries, or out-of-order work, read [fault-histories.md](references/fault-histories.md).
Use synthetic local resources by default; external failure injection stays within
the user's authorized environment and impact.

**Done:** the setup retains the hypothesized failure, has bounded execution and
cleanup, and names the claims it cannot establish.

Example: Pause after the database write but before acknowledgement to retain the suspected duplicate window.

## 3. Prove sensitivity and preserve the counterexample

Run the known faulty version or a representative seeded defect and confirm that
the intended assertion fails. Distinguish that failure from broken setup, import
errors, or an unrelated timeout. For a plan-only request, give the concrete defect
and expected observation without claiming execution.

Reduce the failing input/history while preserving its preconditions and failure;
retain the explicit input, schedule, expected and observed outcome, build/runtime,
and reproduction command. A random seed or temporary fuzzer cache alone is weak
long-term evidence. Keep unexpected exceptions visible; enumerate acceptable
rejections for the chosen oracle.

**Done:** a retained counterexample fails for the relevant reason, or the report
explicitly says sensitivity remains unverified.

Example: Seed a retry that creates a duplicate, then retain the smallest two-attempt history that still fails.

## 4. Verify the candidate and bound the conclusion

Replay the counterexample against the candidate, then run independent input
families or schedules chosen for the original risk. Check recovery state and owned
resources as well as the immediate return value. Preserve prior failure evidence
when a run is flaky; reset state and control the order that determines the result.

Report the exact candidate, commands, observed outcomes, explored domain, and
remaining integration gap. Coverage and a clean fuzzing interval describe explored
execution, not absence of faults. Consult [sources.md](references/sources.md) for
attribution, reading scope, and evidence limits.

**Done:** the unsafe behavior is detected, the candidate meets the selected
contract on the recorded checks, and untested guarantees are clearly separated.

Example: Replay the retained history and report database-version integration as unverified if only a fake ran.
