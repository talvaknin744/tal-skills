# Claude Code R4 evidence status

Checked 5 October 2026 on the existing macOS host. Claude Code is `/opt/homebrew/bin/claude` 2.1.150. The README marketplace add and plugin install commands completed successfully in a new isolated `CLAUDE_CONFIG_DIR` without copying credentials. The installed package is `tal-skills@tal-skills` 1.0.0, user scope, enabled. A read-only plugin listing showed this as the only installed plugin in that isolated profile.

The cached installed package has 35 declared skill paths. The cache itself has no Git metadata, so its commit is unavailable. The marketplace checkout is at `74d141db54dddaec5b594fcf1f0d6d047a6a51b4`; all 35 skill trees match the cache byte-for-byte. The frozen path digest and per-file hashes are in the external R4 archive's `candidate/package-identity.json`. This is an isolated clean install profile on an existing machine, not a clean physical-machine installation.

No model behavior is scored yet. A fresh generated Python-to-Idempotency supplemental case after interactive startup reached Claude's initialization event, then exited with `401 OAuth access token has expired`; it produced zero tokens, no tool calls, no answer and no fixture changes. Its observable initialization catalog did load project-local `python-backend` and `idempotency`, exposed Claude's `Skill` tool, and listed no plugins or MCP servers. Failed harness setup attempts and both auth-blocked runs are preserved in the external R4 archive. The initial generated run used `--setting-sources local`, which excludes project skill discovery; the corrected generated runner uses `project,local` and still excludes user settings. The fixture project contains no project or local settings files. Canonical plugin runs continue to use `local` and a one-plugin `--plugin-dir`.

A read-only startup check in the evidence directory stopped at Claude's workspace trust prompt. With the parent agent's authorization, I accepted only the ordinary trust prompt for the user's existing tal-skills repository. Claude then reached its interactive input screen without a login prompt or model request. The local `/status` dialog opened, but its personal profile fields were not retained. Subsequent API execution still returned 401, so startup did not make the expired token usable for model execution. `claude auth status` exited successfully but likewise does not confirm token freshness. Login help documents `claude auth login --claudeai`; that flow was not invoked. Credential contents were not recorded or exposed, and the harness did not inspect, copy, or change authentication files. CLI runs used their configured profile normally. The automatic-refresh question and API behavior remain unresolved pending user-confirmed normal `/login`.

Claude's product command forms differ by installation location: a project skill under `.claude/skills/<name>/` is invoked as `/<name>`, while a plugin skill uses `/<plugin-name>:<name>`. The `tal-skills` plugin therefore uses `/tal-skills:architecture`; `/architecture` is the prescribed first attempt in the versioned host-syntax pair, not evidence of plugin invocation. The R4 corpus retains both attempts and the Python-to-Idempotency v4 case in [the versioned Claude corpus](claude-code-cases.json); canonical fixtures are copied with measured hashes. No behavioral scores or successful Claude execution are claimed.

The compact dated status and external archive digest are recorded in the
[Claude Code run review](../claude-code/runs/2026-10-05/review.md) and its
[archive manifest](../claude-code/runs/2026-10-05/archive-manifest.json).

## 2026-10-06 executed record

The authentication gap closed on 6 October 2026 in an isolated cloud workspace with
Claude Code 2.1.289: 169 runs completed and were independently graded against the
`fix/critical-partial-gates` candidates. The [2026-10-06 review](../claude-code/runs/2026-10-06/review.md),
[report](../claude-code/runs/2026-10-06/report.json) and
[archive manifest](../claude-code/runs/2026-10-06/archive-manifest.json) record activation
per responder model, the host's slash-command resolution (the new v2 host-syntax pair in
[the versioned Claude corpus](claude-code-cases.json)), the Sonnet results for the seven
previously partial criteria, and the remaining gaps: the README marketplace path was not
exercised, Haiku responders stay below the activation and quality bar, four idempotency
cases lack Sonnet rows, and the Codex-host regression is separate. The 2026-10-05 blocked
record above is unchanged.
