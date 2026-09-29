# Commands and checks performed

All commands ran with working directory `/tmp/book-skill-trials-20260929/enterprise-application-patterns-retest` (reported by the shell as its `/private/tmp/` equivalent).

1. `pwd && rg --files .` — confirmed the trial root and listed supplied files. No listed file outside the request, skill/references, or project was opened.
2. `cat prompt.txt skill/SKILL.md project/design.md` — read the user request, Enterprise Application Patterns skill, and design evidence.
3. `cat skill/references/domain-logic.md skill/references/persistence.md skill/references/transactions.md` — read the references applicable to domain placement, mapping, and existing writes.
4. `shasum -a 256 prompt.txt project/design.md skill/SKILL.md skill/references/domain-logic.md skill/references/persistence.md skill/references/transactions.md` — recorded input hashes before writing output. This succeeded with a locale fallback warning.
5. A shell heredoc command wrote only `answer.md` and `tools.md` in the trial root.
6. A Python verification command checked that both outputs exist and contain text, and that SHA-256 hashes of the six read input files match the recorded values.

# Limitations

- Only a design document was provided; no source implementation, schema, database, or test suite was available in `project/`.
- No application behavior, query counts, transaction/isolation guarantees, rule arithmetic, or concurrency outcomes were executed or observed.
- Scenarios in `answer.md` are an unexecuted validation specification. Invented numeric fixtures are explicitly illustrative, not asserted business requirements.
- No network access, subagents, external repository files, rubric, or previous outputs were used.
- No skill or project input files were edited. No dependency additions or code changes were made.
