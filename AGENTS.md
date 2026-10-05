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

1. Every promoted skill outside `misc/` and `integrations/` appears in the root `README.md`, its bucket `README.md` and `.claude-plugin/plugin.json`, and has `docs/<bucket>/<skill>.md` and `agents/openai.yaml`. Every behavior-changing promoted-skill PR also includes a user-visible `.changeset` entry for `tal-skills`; on release, synchronize `package.json`, `.claude-plugin/plugin.json`, and the matching `tal-skills` marketplace version fields.
2. Frontmatter `name` equals the package directory name. Allow only `name`, `description`, `license` and `disable-model-invocation`; preserve public names and self-contained packages.
3. Each description is 15–40 words: capability, positive activation requests, then a useful sibling boundary. There are no long-description exceptions.
4. A skill is user-invoked in both supported hosts or neither. Keep invocation metadata aligned; report an unavailable host as a coverage gap.
5. Archive raw run snapshots and crawl dumps outside the source tree, and keep new files over 1 MB and personal paths out. Retention governs: preserve every existing case, fixture, verifier, rubric, score, review, archive manifest, snapshot and regression freeze even when numerical targets cannot be met.
6. Generate adapters from canonical skills, agents and workflows. Never hand-edit adapters; run `npm run check:generated` after regeneration.
7. Reach sibling skills with ``Hand off to the `<name>` skill``, never relative links across package folders. Add a standalone fallback sentence to each handoff paragraph so work can continue from available local guidance while sibling-specific conclusions stay unresolved. Generate the supported host's invocation syntax in adapters. Preserve actionable provenance and installed-package resources.

Use commas, colons, periods or parentheses in current prose. The style checker preserves exact historical records and unchanged miscellaneous packages by content hash; new prose cannot extend those exceptions.
