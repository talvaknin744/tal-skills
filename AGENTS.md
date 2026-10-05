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

## Structural invariants

1. Promote a skill to the root bucket only when its capability belongs in the plugin's docs or UI. List every promoted skill in the root `README.md`, its `skills/<bucket>/README.md`, `docs/<bucket>/<skill>.md`, and the plugin UI.
2. Keep the published skill allowlist as the source of truth for exposed skills and their directories; preserve public names and align frontmatter `name` with the package directory.
3. Keep each `description` 15–40 words, with the capability, positive activation requests, and a useful boundary. The exact-hash temporary exceptions are `legacy-code-changes`, `recovery-validation`, and `data-layout-performance`; preserve their prose until Phase 5 and do not extend the exception. Their approved digests are maintained by the published-skill registry checker.
4. Flag routing behavior in both supported hosts. Cover positive activation and the changed boundary for each host; one host's result does not establish the other's behavior.
5. Preserve protected evaluation cases and results unchanged. Keep raw snapshots, crawls, source copies over 1 MB, personal paths and personal data out of packages and portable evidence; retained protected evaluation data is exempt from this packaging rule.
6. Generate adapters from canonical skills, agents and workflows, and run the generated-output check after regeneration. Review generated output without hand-editing it.
7. For cross-skill reuse, use the exact instruction `Call the Skill tool with "<name>"`. Keep sibling skills self-contained and do not link across folders into another skill package.

Evaluation timing override: during the current cleanup, defer all selected behavior evaluations until final Phase 5, where they run once against the final candidate. Run static checks before each PR. The change evaluation contract still governs case selection, preserved coverage, positive and boundary cases, evidence, and reporting.
