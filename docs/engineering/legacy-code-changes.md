# legacy-code-changes

## What it does

Make a requested change testable in untested legacy code while preserving neighboring behavior.

## When to reach for it

Use when missing coverage makes a requested change risky or constructors, globals or hidden collaborators obstruct testing. Greenfield work follows its implementation workflow; changes already covered by focused tests can use the ordinary change workflow.

Invocation: automatic

## It's working if

- The requested difference, affected entrypoint and behavior to preserve are bounded, with an executable baseline where possible.
- The characterization records reachable behavior through the smallest interface and distinguish observation from correctness.
- When construction or hidden collaborators block testing, the change creates the smallest isolation seam while retaining real decision logic.
- A focused regression demonstrates the intended difference and relevant checks are run; limits of substitute evidence are reported.

## Where it fits

Compose with code-and-docs-cleanup when restructuring is the task, or failure-oriented-testing when a retained failure needs a stronger oracle.

Canonical skill: [skills/engineering/legacy-code-changes/SKILL.md](../../skills/engineering/legacy-code-changes/SKILL.md).
