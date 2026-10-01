# Publication drafts

[LinkedIn](linkedin.md) is the short introduction. [Medium](medium.md) explains
the engineering decisions behind the toolkit. Both are drafts for the repository
owner to edit and publish; no post has been sent.

## Facts checked for this draft

Checked against the local repository on 1 October 2026.

| Claim | Evidence and boundary |
| --- | --- |
| 49 skills | Count of `skills/**/SKILL.md`, including six performance packages. A package count does not measure agent quality. |
| 15 specialist agents and eight workflows | `node scripts/check-toolkit.mjs` passed with 15 roles, eight workflows, and 46 native artifacts. This is structural validation. |
| 60 publishers, 58,178 metadata records, 29 selected article readings in the October pass | [Archive manifest](../research/engineering-toolkit/2026-10-01/archive-manifest.json) and [selected readings](../research/engineering-toolkit/2026-10-01/selected-readings.json). Metadata indexing and substantive text reading are separate; [access/history gaps](../research/engineering-toolkit/2026-10-01/README.md) remain explicit. |
| Eight finite retry example cases passed independently | [Review](../research/engineering-toolkit/2026-10-01/review-retry-coordination.md). This establishes local custom HTTP histories and bounded models, not Uber/RPC conformance or production resilience. |
| Short entrypoints and conditional references draw on Matt Pocock's work | [Writing for Agents](https://www.aihero.dev/skills-writing-for-agents). Attribution describes influence, not endorsement or upstream authorship of these independent workflows. |

## Installation wording

The skill-only quickstart uses the existing
[skills CLI](https://github.com/vercel-labs/skills):

```sh
npx skills@latest add talvaknin744/tal-skills
```

In an interactive terminal, the CLI lets the user select skills and installation
targets. The upstream README and selection implementation were inspected; this
drafting pass did not repeat a remote installation. Repository changes must be
published before the remote command can discover them.

For the agent roster and workflows, link to the
[repository README](../../README.md) and [usage guide](../toolkit-usage.md).
The selectable launcher is now implemented and [tested through an actual packed
npx installation](../research/engineering-toolkit/2026-10-01/launcher-installation.json).
The usage guide gives both the interactive command and the npm 12 Git opt-in.
Remote GitHub discovery and release CI are separate post-publication checks.

## Editorial boundaries

Keep the concrete problems and their checks. Describe recorded local experiments
at their actual boundary; keep source research, deterministic validation and
model trials separate. Publisher case studies are evidence about their workloads,
and the archive is neither an exhaustive lifetime collection nor a ranking.

Before publication, confirm that public repository links expose the intended
release and recheck counts if packages change. Preserve upstream attribution and
licenses. The current drafts include no portable speedup, production guarantee,
endorsement, or claim that every indexed article body was read.
