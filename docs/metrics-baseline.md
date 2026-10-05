# Cleanup metrics baseline

Measured from the source tree at commit `67eba56a33168f2d52c8d17397a1038f76e3f20d` (2026-10-02), before Phase 1 deletions. The tree was exported from that commit with `git archive`; the metrics runner and path guard were copied in only to perform the measurement and excluded from the temporary source index.

Source-size and file-content metrics count regular files present in that commit's tree. They exclude `.git`, symlinks, ignored local environments such as `node_modules` and `.venv`, and absent/deleted paths. The Git-tracked count comes from the exported commit's index. Personal-path hits count matching lines (a line with multiple paths counts once), recognize home-directory prefixes at a path boundary, and allow the deliberate `example`, `node`, and `runner` placeholders. Pack size is the reported `size-pack` field from `git count-objects -vH`; this workspace stores the baseline objects loose, so the measured pack size is `0 bytes`. Generated archives were absent from the baseline.

| Metric | Value |
| --- | --- |
| Working tree source size (MB, excluding ignored local environments) | 148.6 |
| Git pack size | 0 bytes |
| Files tracked | 12,183 |
| Files over 1 MB (source) | 21 |
| Files under evals/ | 10,903 |
| Codex schema JSON copies | 3,960 |
| SKILL.md snapshots under evals/ | 285 |
| Personal home-path hits (lines) | 312 |
| Personal course label hits (files) | 3 |
| Bucket folders under skills/ | 11 |
| Buckets with exactly 1 skill | 4 |
| Promoted SKILL.md (not misc/) | 49 |
| Vendored Temporal skills in integrations/ | 0 |
| Skills missing agents/openai.yaml | 5 |
| Descriptions over 40 words (promoted) | 13 |
| Description words: max / avg (promoted) | 103 / 40.8 |
| Skills calling a sibling via Skill tool | 0 |
| Files with em-dashes (.md) | 281 |
| README bytes | 19,391 |
| Docs pages for promoted skills | 0 |
| plugin.json present | no |
| CLAUDE.md present | no |
| Git tags | 0 |

The original checkout's physical `du` size was 520 MB, including `.git`, local virtual environments, and `node_modules`; that physical figure uses a different scope from the 148.6 MB of cloneable source bytes above. The pack value describes this workspace's current loose-object storage. The path count is specifically matching lines after the documented placeholder exclusions.
