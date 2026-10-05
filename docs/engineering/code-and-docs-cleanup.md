# code-and-docs-cleanup

## What it does

Make a bounded, behavior-preserving cleanup that removes an evidenced maintenance obstacle.

## When to reach for it

Use for explicit cleanup, refactoring, unused-code removal or stale-instruction repair. Routine features, bug fixes and formatting alone stay outside this boundary.

## It's working if

- Name the reader or next change being obstructed and the observable behavior to preserve.
- Inspect callers, tests, generated entrypoints and history before classifying code as unused.
- Characterize uncertain legacy behavior independently; distinguish current behavior from desired behavior.
- Keep the smallest useful transformation and retain rationale explaining constraints or compatibility.
- Check the final reader or code path and report benefit, checks and gaps.

## Where it fits

Compose with legacy-code-changes when missing coverage makes characterization or dependency isolation necessary; use failure-oriented-testing for adverse schedules or generated inputs.

Canonical skill: [skills/engineering/code-and-docs-cleanup/SKILL.md](../../skills/engineering/code-and-docs-cleanup/SKILL.md).
