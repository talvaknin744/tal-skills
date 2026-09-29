Actual commands and checks for this trial

Working directory for the trial-specific commands: `/tmp/book-skill-trials-20260929/object-design-patterns`.

Executed through `exec_command`:

```sh
cat prompt.txt skill/SKILL.md
rg --files -g '!interrupted-*' project skill
cat project/design.md
cat skill/references/behavior-and-state.md skill/references/construction.md skill/references/sources.md
nl -ba project/design.md
```

The inventory contained only `project/design.md` as a project artifact. The object-design-patterns skill and its behavior/state, construction/lifetime, and source references were applied. Structure/interface references were not needed and were not semantically read. No external PDF or website was opened.

The answer's state/event matrix was checked against the supplied design: four statuses and six events yield 24 combinations, with 7 permitted operations and 17 rejected operations. This was a document-level contract check, not execution of a Python state model or application tests.

A Python SHA-256 scan ran before and after answer creation over `project/` and `skill/` in the three authorized trial roots. It used `Path.rglob('*')`, excluded any path component beginning `interrupted-`, and produced sorted JSON mapping each file path to `hashlib.sha256(p.read_bytes()).hexdigest()`. The maps were compared in the tool session: zero changed files among 25 snapshots, including all 8 in this trial. The scan read otherwise unused skill files only as bytes for integrity verification.

`apply_patch` created this trial's `answer.md` and `tools.md`. No project or skill file changed. A Python check used `Path.read_text()`, `len(s.split())`, `len(s.splitlines())`, and `Path.is_file()` for the three authorized answers; this answer was present with 1,347 words and 50 lines.

Limitations: the supplied project has no Python implementation, test files, or executable test runner. No application test, formatter, type checker, concurrency test, persistence check, dependency change, web access, or subagent was used. Proposed characterization and transition/rendering checks in the answer were not run. Existing return values, concrete rendering text, and persistence guarantees remain unverified. Files named `interrupted-*` were not opened. No other repository files or evaluation rubrics were read.
