# Native Linux runner: environment-selection follow-up

Reviewer: `/root/archive_quality`; date: 2026-10-02. Scope is independent runner source review and bounded host evidence inspection. The reviewer authored no reviewed runner source and executes no model turn or candidate grading. Historical failure-oriented-testing authorship excludes full installed-closure grading. Previous frozen review files remain byte-identical: `native-linux-code-review.md` SHA-256 `5d86020f63945609a2cf6b3a75d32db5c5b6a02b90219eb61996e9da48af924f`; `.json` SHA-256 `a28a86e2b8c4a0dc8a68a1ace2176068e8a9250aacae685550b6758aa28be3e2`.

Final disposition: **the empty-environment source bug is closed within this review's bounded scope**. Replacement tests pass 34/34 and effective local selection/connection metadata is independently verified. Actual model command execution, body reading, role dispatch and task correctness remain pending separate observations; no full native tool inventory or enforcement pass is asserted.

## Newly observed source defect

**[P1] Do not disable the model's execution environments while claiming a ready native workflow host.** The previously reviewed collector (`scripts/native-smoke.mjs` SHA-256 `42123d63cbe4c473bf42e2cdcfb6566481ede1ae5157b5b2fd164ab699a0ae9b`) sends `environments: []` in `thread/start` at line 376 and again in `turn/start` at line 388. The installed 0.159.2 `ThreadStartParams` schema says omission selects the default environment, while an empty list disables sticky environment access; `TurnStartParams` says omission inherits sticky environments, while an empty list disables access for that turn. `ThreadStartResponse.thread.environments` exposes selection metadata: null is unavailable, an empty list is none, and selection does not establish connection status.

The first source review missed this environment-selection prerequisite. Its clean bounded disposition must not be used as tool-readiness acceptance. The earlier 30 passing runner tests and 13 separate CLI boundary probes did not test model environment selection. Their bounded observations remain valid. Their success cannot establish that model-side local execution or role tools are available. This follow-up records the newly observed defect without rewriting those historical evidence records.

The author is preparing a narrow replacement: documented default/local selection, fail-closed effective environment metadata, retained filesystem/network restrictions, and resolved collaboration feature evidence. Permission broadening, saved-configuration changes and candidate edits are outside this task. Replacement source acceptance is pending its frozen hashes and independent checks.

## Actual invalid host attempt

Inspected sanitized artifacts: `/tmp/tal-native-linux-worker-original-model-20261002-01/evidence`. The source-recorded status is `completed-unscored`, `execution_started=true`, `preflight_passed=true`, `case_compliant=false`. It is preserved exactly. External disposition for this follow-up is **host-invalid: model local execution unavailable**, not candidate failure or acceptance.

| Artifact | SHA-256 |
| --- | --- |
| `run.json` | `4042044fca44b258e58129af74f5901aec81a7f0928310b70fe7c62b2c7a864d` |
| `events.jsonl` | `645f23230b581f5bf7fcbe9d5806a364e31be5689e7f1dc329a1c1cbf50edeeb` |
| `linux-host.json` | `05b0e486921b665cf03efc5567fea21039bd7413a890c170f8cd0fb40b50f8bd` |
| `prepared.json` | `2bfceeaef519eca9decbac24794f97f4622ab5c89b3ad644639a40abcfde373e` |

`run.json#/observed` records zero commands, zero read actions and zero named native children. Deduplicating native items by thread/turn/item ID gives one user message, four assistant messages and four sleep items; repeated thread-read/history copies are not additional tool calls. `history_collection` records complete item pagination with one page. The visible assistant reports that it lacks a file-reading tool at `events.jsonl:72` and ends without reading the fixture at `events.jsonl:278`; sleep items occur at lines 78, 84, 138 and 144. No statement of intended reading is counted as a body read or role dispatch. Thread/turn request locators are lines 11 and 15; the thread-start response at line 11 independently records `thread.environments=[]`. The host record confirms both installed runner hashes match the prior freeze, no scope changes, and successful owned-container/transport cleanup. These are observable artifacts only; hidden reasoning is not used.

## Contracts read

The reviewer read the exact generated schema fields and primary source excerpts supplied outside the repository. No full source copies are added here.

| Source | Read scope | SHA-256 |
| --- | --- | --- |
| `schema/v2/ThreadStartParams.json` | `properties.environments`, `TurnEnvironmentParams` | `80a40a7fac15b4bf70efb7f893fb353acc0a0d30c68f54aee4f01923deca85de` |
| `schema/v2/TurnStartParams.json` | `properties.environments`, `TurnEnvironmentParams` | `07771223642e1b61bd9aac0069fc0f98143a1c047724ca02c7ceb13653442738` |
| `schema/v2/ThreadStartResponse.json` | `Thread.environments`, `ThreadEnvironment`, active-profile/runtime-root response fields | `92f5ddc37717b922de1dc0b0405e9a6d463f370554e2091610c6e595bc2616d4` |
| `codex-rs/core/src/tools/spec_plan.rs` | lines 660–715 and 1070–1118 | `849ef21d4e5c83febdc31eacd7609911d43e3f69a35168fe02ae899273b5ef3e` |
| `codex-rs/features/src/lib.rs` | lines 1325–1370 | `4c702a9479fdbf955b0640f8d52e327dff5cc273c0e9587f29f62e5cbbcd59aa` |

Generated schema root: `/tmp/tal-native-hardening-cE5egY/schema`. Primary source capture root: `/tmp/tal-native-tool-registry-20261002-01/source`; author-supplied official 0.159.2 tag commit `ff6aec96948b70d94983af2641a6b67c94faeff5`. The reviewer did not independently refetch that capture. `add_shell_tools` additionally gates on the shell feature and model shell type. `collab_tools_enabled` gates separately on multi-agent version, model compatibility and spawn depth; selection of a local environment alone does not prove collaboration availability.

The current official [app-server documentation](https://learn.chatgpt.com/docs/app-server) was searched/opened on 2026-10-02, specifically environment inspection, experimental-feature listing, and thread creation sections. It supports metadata inspection but does not replace installed-schema semantics or actual model tool observations. The Markdown endpoint returned an error; the HTML sections were successfully opened. A resolved enabled feature is configuration evidence, not proof of role dispatch or every tool's confinement.

## Replacement freeze

Frozen author input: `/tmp/tal-native-linux-worker-original-preflight-20261002-06/freeze.json`. Reviewer reads and checks were completed after the freeze. Exact repository hashes and copied runner bytes match:

| File | SHA-256 |
| --- | --- |
| `scripts/native-smoke.mjs` | `1522176a83043be0fde914de525b49cb3a6c950b144ac4bd9c1d5a238929b7d2` |
| `scripts/native-linux-smoke.mjs` | `7585a5ecf677f90cd395471eea16dcde9213eb0d8b48561dd62852e0f7950e07` |
| `tests/toolkit/native-smoke.test.mjs` | `281a1808763ce8c9f45621b8fc4b8bb510cdc220334fc8b46794e8e172959ad2` |

Independent `node --test tests/toolkit/native-smoke.test.mjs`: **34 passed, 0 failed, 0 skipped**. Targeted source/test `git diff --check` exits 0. The four added tests cover invalid environment selection, unready environment or feature/agent prerequisites, missing shell/cwd metadata and bounded feature pagination. Integration assertions at test lines 325–326 require the explicit local object in both thread and turn requests. These would detect reinstating either empty selection. The tests use synthetic RPC metadata and retain the existing real process-group cleanup checks; they do not run a model.

`nativeLocalEnvironment` at source lines 19–24 selects the reserved ID `local` with the real owned root and exactly that runtime workspace root. Both calls at lines 409 and 427 pass this object. `assertNativeLocalEnvironment` at lines 25–35 rejects absent, empty, multiple, remote or mismatched selections, non-ready connection status, unavailable shell metadata and a different canonical cwd. Effective metadata is recorded before a model turn. The generated schema hashes used above match the fresh pinned Linux binary's regenerated schema bytes exactly.

`collectNativeFeatures` at lines 37–51 collects thread-resolved flags with cursor-loop, duplicate/malformed-entry and page limits. Lines 416–420 require resolved `shell_tool`, `unified_exec` and `multi_agent` flags, verify every disabled capability remains false, reject effective `agents.enabled=false`, and record collaboration configuration with `tool_dispatch_verified=false`. Neither feature selection nor permissions are overridden to make these gates pass. Requiring the tested `unified_exec` posture deliberately excludes an alternate one-shot configuration rather than silently changing it.

Two additional primary-source excerpts were inspected: `codex-rs/exec-server/src/environment.rs` lines 100–111 define `LOCAL_ENVIRONMENT_ID="local"` (SHA-256 `da4c5ac295eeb9f55d94f7a39aa8c476560f07ccb745762a7989b6f81b7c2bec`); `codex-rs/core/src/config/mod.rs` lines 3858–3876 default absent `agents.enabled` to true (SHA-256 `df6d6871a35a9e365e36beb3d388c2c39cae59d95bd84834321c8501390ec397`). These are from the same author-supplied official-tag capture described above. The default is a source-supported inference, not role-dispatch evidence.

The new actual no-model run records requested and selected `local` environment with cwd `/trial`, runtime roots `["/trial"]`, connection status `ready`, shell `/usr/bin/bash` and canonical cwd `file:///trial`. Thread-scoped feature listing collects **152 flags across two pages**: the three required flags are enabled/default-enabled; `multi_agent_v2` is false/default-disabled. The separate no-auth metadata captures for both Mac and Linux independently show the same required feature defaults and ready local environment metadata; their SHA-256 bindings are `6bf2d9d1c9351ffe909daa867469a8ded37582a16e614c21aeb7e0ce49ba92e5` (`evidence/mac.json`) and `bfcb34f01affacd20ea5aaa9c43f7b8f33f2bc80adc05394eeee9000ee118cdb` (`evidence/linux.json`) under `/tmp/tal-native-environment-metadata-20261002-01`. The Mac metadata observation is not a Mac command-sandbox pass; TIOCSTI remains excluded.

The replacement run retains **13/13** passing separate command-boundary probes, no model execution, `case_compliant=false`, inherited model/effort, unchanged credential/configuration fingerprints, verified owned-container/transport cleanup and empty audit errors. Reviewer comparison of all **120** baseline files with both recorded final and actual current trial inventories confirms byte/mode identity. The optional cache directory remains absent with no write grant. The unchanged Linux wrapper preserves exact image/binary/seccomp pins, UUID cleanup, no-pull policy and the physically read-only trial.

| Replacement artifact under `/tmp/tal-native-linux-worker-original-preflight-20261002-06` | SHA-256 |
| --- | --- |
| `freeze.json` | `26a625434c0bc3d5b1440d261a43b746c219ceb1af239d8de7f09a4d69c2d104` |
| `evidence/run.json` | `29616a95aebd34725f1cd3b20436a8ca05b32134e6da508cfe7a7862dea26e1f` |
| `evidence/linux-host.json` | `1e80d842fe3b9459e554a77a8c8880f032a560011df1db76f89e879f8e7eedea` |
| `evidence/prepared.json` | `0dbc21d792b96adf075a67800f1aaad2e2bad4c2bf109f42adbb158245590937` |

The invalid actual01 run and prior review hashes were rechecked unchanged after these checks. The replacement closes the concrete empty-selection defect without turning flag/metadata observations into a claim that every model tool is available or confined. Model shell type, collaboration version/depth compatibility, named-role loading, actual command/body-read events and independent candidate correctness must still be assessed from a fresh model trial. No candidate or response is graded here.
