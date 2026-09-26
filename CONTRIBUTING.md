# Adding a skill

1. Choose an existing concern under `skills/`, or add one when the capability
   belongs to a different domain. Use a short name such as `engineering`,
   `writing`, or `research`; create only categories that contain a real skill.
2. Create `skills/<concern>/<skill-name>/SKILL.md`. Use a unique lowercase,
   hyphenated skill name and matching `name` frontmatter. Its `description`
   should identify the capability and the requests that should activate it.
3. Keep the normal workflow in the entrypoint. Put conditional detail in
   linked `references/`, reusable helpers in `scripts/`, and output resources
   in `assets/` only when needed. All runtime references must travel with the
   skill; repository-only development tools are optional.
4. If useful for Codex, add `agents/openai.yaml` with a display name, short
   description, and default prompt mentioning `$skill-name`. Preserve automatic
   discovery unless explicit-only invocation is part of the intended behavior.
5. Retain applicable licensing and attribution. Put a license notice inside
   the skill when it must survive installation separately from this repository.
6. Add realistic cases under `evals/<skill-name>/`, keeping fixture inputs
   separate from scoring criteria. Add deterministic checks under
   `tests/<skill-name>/` for actual helpers and failure-prone contracts. Shared
   packaging checks discover `skills/<concern>/<skill-name>/` automatically.
7. Run `npm run validate`. For substantial workflow changes, follow
   [the behavioral evaluation procedure](evals/README.md), then record which
   cases actually ran and their limitations. Update the skill list in README.

Prefer narrow changes supported by observed behavior. Avoid adding universal
rules for one exceptional case, mandatory tools for optional branches, empty
resource folders, or duplicate copies of the same skill in several concerns.
