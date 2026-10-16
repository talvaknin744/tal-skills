# agent-evaluation

## What it does

Evaluate a tool agent through authoritative task outcomes and observable traces,
with calibrated criterion scoring and reproducible trial comparisons.

## When to reach for it

Use for agent evaluation suites, reported completion that disagrees with actual
state, judge calibration or repeated trial comparisons. Ordinary software fault
reproduction belongs to `failure-oriented-testing`. Restore rehearsals and
recovered application history belong to `recovery-validation`.

Invocation: automatic

## It's working if

- Task completion has an independently checked outcome and explicit constraints.
- Raw trial inputs stay separate from private criteria, with relevant positives,
  rejection boundaries and preserved regression cases.
- Each critical criterion has evidence and an independent score, with absent
  evidence and grader disagreement visible.
- Trials record candidate and environment identities, clean state, actual effects
  and retained failures, timeouts or contamination.
- Reliability and effort comparisons report matched coverage, repeated attempt
  counts and metric denominators without unsupported production claims.

## Where it fits

This is the specialist for evaluating AI agent behavior and evaluation quality.
Its local outcome guidance supports reviews even when software fault or recovery
specialists are unavailable. The [canonical skill](../../skills/engineering/agent-evaluation/SKILL.md)
contains installed references for comparison metrics and source reading limits.
