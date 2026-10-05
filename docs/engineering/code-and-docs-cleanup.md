# code-and-docs-cleanup

## What it does

Make a bounded, behavior-preserving cleanup that removes an evidenced maintenance obstacle.

## When to reach for it

Use for explicit cleanup, refactoring, unused-code removal or stale-instruction repair. Routine features, bug fixes and formatting alone stay outside this boundary.

## It's working if

- The report names the reader or next change being obstructed and the observable behavior to preserve.
- The review records inspection of callers, tests, generated entrypoints and history before classifying code as unused.
- The characterization records uncertain legacy behavior independently and distinguishes current behavior from desired behavior.
- The change retains the smallest useful transformation and retain rationale explaining constraints or compatibility.
- The evidence checks the final reader or code path and report benefit, checks and gaps.

## Where it fits

Compose with legacy-code-changes when missing coverage makes characterization or dependency isolation necessary; use failure-oriented-testing for adverse schedules or generated inputs.

Canonical skill: [skills/engineering/code-and-docs-cleanup/SKILL.md](../../skills/engineering/code-and-docs-cleanup/SKILL.md).
