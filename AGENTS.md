# Working on tal-skills

This repository contains installable skills, native specialist definitions and
workflows. Preserve public names and self-contained packages. Keep detailed
technical guidance in skills and regenerate adapters from canonical sources.

When changing instruction behavior, apply the
[change evaluation contract](CONTRIBUTING.md#changing-skills-agents-or-workflows):
run relevant existing cases against the revised candidate to protect established
behavior, and author and execute a focused evaluation for each new capability.
Include nontrigger and changed-boundary cases. A new-feature pass does not
establish that old behavior still works; packaging tests do not establish agent
behavior.

Preserve existing prompts, fixtures, verifiers, rubrics and historical results.
Report candidate identity, checks actually run, independent scores and remaining
coverage or host gaps. Never weaken an old case to make a change pass. See
[evals/README.md](evals/README.md) for staging and scoring.

Before publication, run `npm run validate` and the selected behavioral checks.
Keep failed, partial and blocked attempts, source attribution and installation
limits visible. Do not claim an unavailable host or production guarantee passed.
