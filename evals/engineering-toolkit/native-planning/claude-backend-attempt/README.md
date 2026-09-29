# Claude backend attempt: authentication blocked

On 2026-09-29 at 09:48:59–09:49:02 UTC, one fresh Claude Code **2.1.150** process attempted the installed `tal-backend-delivery` workflow with the exact fixture prompt. It exited **1** with an expired OAuth error. The terminal record used `subtype: success` but also `is_error: true`; the attempt is blocked, not successful native execution.

The installer installed only the selected workflow and its declared dependencies in a fresh disposable project containing the fixture's `rawfiles/` and exact `prompt.md`. [Installation](installation.json), [baseline hashes](baseline-hashes.json) and [invocation](invocation.json) identify the actual artifacts and argv. No model, permission or login overrides were added.

[Initialization evidence](events.json) lists all eight installed project roles and eleven project skills/workflow entries. The inherited model was `claude-opus-4-7[1m]`, permission mode `default`. This establishes native discovery only. The only assistant response was the host's synthetic authentication error; no Skill/Task invocation, implementation, independent review or acceptance check occurred. Reported API duration and cost were zero.

[Final hashes](final-hashes.json) match the complete baseline. [Cleanup](cleanup.json) records exit 1 with no live process-group members. No additional Claude workflows were attempted. The other seven workflows are marked `blocked-shared-authentication-not-run` in [summary.json](summary.json), rather than classified as failed skills.

Two provenance limits are explicit:

- The hash of `~/.claude.json` changed during the CLI version/workflow attempt. [Before](config-before.json) and [after](config-after.json) contain hashes only. No configuration-editing command, login or repair was performed, no raw configuration was captured, and no restoration was attempted. Other observed file-based configuration hashes were unchanged; Keychain contents were not accessed.
- Python's temporary-directory selection used macOS `TMPDIR` under `/var/folders`, rather than the requested literal `/tmp`. The actual project location is recorded. The authentication stop condition was honored without another attempt.

The collector retained project-relevant role/skill inventory, tool names, terminal public text and selected result metadata. It omitted thinking/reasoning, signatures, encrypted payloads and raw configuration. Credential patterns were redacted; stderr was empty. The inherited command was not a filesystem read jail or a capability-suppression test. Authentication must be refreshed externally and a new attempt scheduled before any Claude workflow acceptance claim.
