# legacy-code-changes

## What it does

Make a requested change testable in untested legacy code while preserving neighboring behavior.

## When to reach for it

Use when missing coverage makes a requested change risky or constructors, globals or hidden collaborators obstruct testing. Excludes greenfield work and changes already covered by focused tests.

## It's working if

- Bound the requested difference, affected entrypoint and behavior to preserve; record executable baseline when possible.
- Characterize reachable behavior through the smallest interface and distinguish observation from correctness.
- If construction or hidden collaborators block testing, make the smallest isolation seam while retaining real decision logic.
- Demonstrate the intended difference with a focused regression and run relevant checks; report what substitutes cannot validate.

## Where it fits

Compose with code-and-docs-cleanup when restructuring is the task, or failure-oriented-testing when a retained failure needs a stronger oracle.

Canonical skill: [skills/engineering/legacy-code-changes/SKILL.md](../../skills/engineering/legacy-code-changes/SKILL.md).
