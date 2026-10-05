# Claude Code R4 execution review

**Status: blocked.** No case completed and no independent grader ran (0 completed, 0 graded). Two generated-adapter v4 model attempts reached Claude initialization and returned `401 OAuth access token has expired`; both attempts, including earlier harness/setup failures, are preserved in the external archive. No canonical plugin cases or architecture syntax attempts ran. Do not interpret this as a behavioral pass.

The README marketplace-add and plugin-install commands both succeeded under an isolated `CLAUDE_CONFIG_DIR`. Claude Code 2.1.150 installed tal-skills 1.0.0 with 35 skill paths. The installed cache has no Git metadata; the marketplace clone was at `74d141db54dddaec5b594fcf1f0d6d047a6a51b4`, and all 35 declared skill trees matched the cache. This is an isolated install profile on an existing machine, not a clean physical-machine install.

After the authorized repository trust choice, interactive startup reached its input screen without a model prompt. A fresh generated v4 request still returned 401, so startup did not restore API execution. The successful `system/init` observation in that blocked request listed only the two intended project skills plus bundled CLI skills, exposed `Skill`, and reported no plugin or MCP servers. `--setting-sources local` had excluded project skills in the earlier attempt; `project,local` corrected discovery while excluding user settings. The fixture had no project/local settings files.

Claude Code documents project-local skill commands as `/<name>` and plugin commands as `/<plugin-name>:<name>`. Therefore the R4 architecture pair preserves `/architecture` first, then `/tal-skills:architecture`; neither was behaviorally tested. The installation and artifact hashes, package identity, attempt records, inputs, rubrics, fixtures, scripts, and frozen installed/generated packages are bound by [the archive manifest](archive-manifest.json).

A normal user `/login` remains necessary before further API attempts. Credentials were not copied, exposed, or edited. No model override, fallback, or permission bypass was used.
