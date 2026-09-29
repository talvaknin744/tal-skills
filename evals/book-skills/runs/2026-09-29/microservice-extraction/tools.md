# Commands and checks performed

- Listed the trial directory with `ls -la`; used `rg --files project skill` to inventory the supplied files.
- Read `prompt.txt`, `skill/SKILL.md`, `project/rollout.md`, and `skill/references/data-transition.md`, `skill/references/cutover.md` with `cat`.
- Computed SHA-256 hashes of the project artifact and skill/reference files read using `shasum -a 256` before writing the response. The command printed a locale fallback warning and returned the hashes successfully.
- Created `answer.md` using the `apply_patch` tool. No project or skill files were edited.
- Used Python standard-library `hashlib` to compare all four recorded input hashes after writing; all matched. Confirmed `answer.md` was nonempty, then wrote this log.

# Limitations

Only the supplied project brief and relevant skill references were available for this review. No web access, source-code inspection beyond these supplied artifacts, runtime observations, tests, migration operations, or rehearsals were performed. Recommendations and gates in the answer are proposed, not executed results. No owners, measurements, or test outcomes were inferred as facts.
