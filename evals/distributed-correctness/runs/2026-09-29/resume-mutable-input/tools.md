Actual local commands and results:

1. `cat <trial-root>/resume-mutable-input/skill/SKILL.md <trial-root>/resume-mutable-input/prompt.txt` — exit 0; read the graceful-draining skill and the review-only request.
2. `rg --files <trial-root>/resume-mutable-input/skill <trial-root>/resume-mutable-input/project` — exit 0; found two project files and the skill files.
3. `nl -ba <trial-root>/resume-mutable-input/project/job.md` — exit 0; read all 33 lines.
4. `nl -ba <trial-root>/resume-mutable-input/project/export.pseudo` — exit 0; read all 16 lines.
5. `cat <trial-root>/resume-mutable-input/skill/references/durable-handoff.md <trial-root>/resume-mutable-input/skill/references/platform-shutdown.md <trial-root>/resume-mutable-input/skill/references/sources.md` — exit 0; read local references only. Commands 3–5 ran in parallel.
6. `shasum -a 256 <trial-root>/resume-mutable-input/project/job.md <trial-root>/resume-mutable-input/project/export.pseudo` — exit 0 with a locale fallback warning. Hashes: `job.md` = `2ba7bac1789d08ed380bf05be15d3d71deaab614869a77568402d03d640bbda4`; `export.pseudo` = `6d47fd3e5dd97124dfdc7e35bf90940839058e0852de0715a156911d375635da`.
7. `apply_patch` — created only the requested `answer.md` and `tools.md` outside the project.
8. `LC_ALL=C shasum -a 256 <trial-root>/resume-mutable-input/project/job.md <trial-root>/resume-mutable-input/project/export.pseudo` — exit 0; both hashes matched step 6 after saving the answer, confirming project contents were unchanged.
9. `apply_patch` — appended this final verification record to `tools.md` only.

No web, installs, live services, subagents, or executable export tests were used. No other repository/evaluation files were read. Proposed restoration and failure tests in the answer were not run.
