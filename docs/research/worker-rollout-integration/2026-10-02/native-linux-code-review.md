# Native Linux runner: independent source review

Reviewer: `/root/archive_quality`; date: 2026-10-02. This is a source review of the runner, not a score of a skill, workflow answer, or infrastructure deployment. The reviewer authored none of the three reviewed runner files and ran no model turns. Historical authorship of failure-oriented-testing guidance excludes this reviewer from independently grading the full installed worker workflow closure. Fixture authorship is separate from this source review.

Final source disposition: **no residual material finding within the bounded review-only runner scope**. The replacement freeze closes the three first-review findings; independent tests pass 30/30. First findings and evidence remain below. This does not establish full native tool confinement, implementation behavior, or workflow correctness.

## First frozen revision

Disposition: **changes requested**. The successful no-model record establishes useful, bounded checks, but three source-level gaps need correction before treating the wrapper as a validated dispatch path. The author has also announced a compatibility revision for the original worker fixture's optional runtime-output declaration; the replacement freeze will be reviewed separately below. The first observations and failures remain preserved.

| File | SHA-256 |
| --- | --- |
| `scripts/native-smoke.mjs` | `61a789fbf4a8f95cd9ceb121039e2d7c5037f4282bde558e989530520d0da97c` |
| `scripts/native-linux-smoke.mjs` | `cf49c8455d2b85f3ee0d8052d6f2f73bdb673aa73ee5b8f2a01d033716288d28` |
| `tests/toolkit/native-smoke.test.mjs` | `4c9d67e43a2252e420c05732e7429a6d4d201eae7a0ec4e8e063e5bfae0a00bb` |

All three files were read. Independently executed `node --test tests/toolkit/native-smoke.test.mjs`: **24 passed, 0 failed, 0 skipped**. `git diff --check -- scripts/native-smoke.mjs scripts/native-linux-smoke.mjs tests/toolkit/native-smoke.test.mjs` exited 0. These are deterministic runner checks, including real owned-process termination tests, not behavioral model evaluations.

### Findings in the first revision

1. **[P2] Recover and remove the owned container after an uncertain create outcome.** `scripts/native-linux-smoke.mjs:105` assigns `containerId` only after a synchronous Docker create command returns successfully. The command has a 20-second timeout. If the daemon creates the UUID-named, UUID-labeled container but the client times out before returning its ID, the `finally` block at lines 109–115 lists that label but never removes the container. Inspection or removal errors also escape before the final cleanup, credential-fingerprint and trial-inventory record is saved. This is a static failure schedule; the reviewer did not induce a Docker daemon failure. Recover by the known name/label, verify ownership before removal, and preserve a failed final audit even when an individual cleanup operation fails. An absence check should remain a pass gate; it should not substitute for the cleanup attempt.

2. **[P2] Require host transport cleanup in the success predicate.** `scripts/native-linux-smoke.mjs:123` requires Docker exit 0, no timeout, container absence and unchanged inputs, but omits `execution.cleanup.terminated`. `runBoundedCommand` can return exit 0 with cleanup failure recorded separately. That state currently satisfies `passed` despite an unconfirmed owned transport process group. Require `cleanup.host_transport.terminated === true` and test the exit-0/cleanup-failed combination. This counterexample comes from the predicate and return contract; no leaked process was observed in the supplied successful run.

3. **[P2] Enforce the tested engine target before trusting its authentication transport.** `scripts/native-linux-smoke.mjs:29` accepts any syntactically immutable image ID; `TESTED_LINUX_IMAGE` is not checked. The driver's version check verifies a version string, while its actual native binary digest is only recorded after account metadata and preflight at lines 77–78. This permits an unvalidated immutable target through the credential mount and metadata path, contrary to the requested exact tested target. Restrict the image to the reviewed image ID and compare the actual native binary digest to a pinned digest before account access or a model turn. Also pass `--pull=never`: [Docker's create reference](https://docs.docker.com/reference/cli/docker/container/create/) documents `missing` as the default pull policy, so omission does not enforce the wrapper's no-image-install contract when an image is absent. The supplied run used the correct tested image and binary; no alternate image or pull was run by the reviewer.

### Bounded evidence actually inspected

The sanitized author-produced record is `/tmp/tal-native-linux-wrapper-20261002-01/evidence`. The reviewer read only the supplied sanitized reports and compared their inventories; authentication contents and private configuration values were not inspected. SHA-256 bindings:

| Relative artifact | SHA-256 |
| --- | --- |
| `../freeze.json` | `d258a869b7f3d3e47cdbad7dc6982c779d799894b1959b6b05106d108c553a44` |
| `prepared.json` | `3dbc731dbee80fcd2f1899b80c3d8ab96d9d453f4e84afd09dcf7377fc44f9d9` |
| `run.json` | `eeb489ce3b475a719a42413cd2b1a4ed9926bd1f850d0f511587dcbabeeac937` |
| `linux-host.json` | `e4fa94ec87308f065d5fb238d3cd0b44685bf4f15b09c92b331b3b38f66dfbff` |

`run.json` records `preflight_only=true`, `execution_started=false`, `preflight_passed=true`, `case_compliant=false`, and `instruction_sources=[]`. All 12 `boundary_probe.checks` pass with terminated command process groups: startup, trial read, permitted canary read/write, withheld read denial, immutable write denial, trial-prompt write denial, three protected-file read denials, reachable owned-loopback positive control, and network-denied negative control. The canary write is in an owned probe directory, not a trial write.

The recorded target is image `sha256:9076492a589ef293008a171ecf4a118d735f775f78fc4c04ccbc5cac5b252783`, seccomp digest `a10f9206f58d22c6b7d1fe4b82899bd4b5f0e5362cfbc4d9030ffab30678e5e7`, native version `codex-cli 0.159.2`, and actual Linux binary digest `113aa5d5952a6fd3950a88323219747d0c91978ebee948509a540c8a460e59a3`. Effective model and reasoning effort match the inherited settings; no model request was made. The sanitized authentication metadata reports kind `chatgpt` with identity omitted and read-only transport.

`linux-host.json` records Docker exit 0, no timeout, the UUID-owned container absent, and the host transport group terminated with no remaining live processes. The reviewer independently matched all **119** baseline files to all 119 final files by path, byte digest and mode; `changed_files=[]`. Original credential/configuration fingerprints are unchanged in the supplied record. These fingerprint assertions establish equality at the recorded endpoints, not exhaustive attribution of every intermediate operation.

### Contract and scope review

The wrapper uses an explicit opt-in Linux host, a fresh UUID ownership label, no Docker socket or host-root mount, read-only runner/trial mounts, non-root identity, dropped capabilities, no-new-privileges, bounded memory/process count, and a digest-checked seccomp profile. Only the owned staged Codex home and evidence directories are writable. The original authentication file is mounted read-only; staged model/effort configuration is separate from saved user configuration. The trusted engine requires network/authentication access; the native command profile is separately restricted and tested. Container isolation does not by itself establish confinement of every model tool.

The collector compares effective filesystem rules and disabled command-network settings before `turn/start`, rejects unrelated skills/instruction sources, gates on real boundary probes, records unavailable inventories, and never treats startup failure as a successful denial. Unexpected interactive RPC requests are rejected. The native verifier uses its named managed profile, disabled command network and a restricted environment. Cleanup owns process groups and does not target unrelated processes. Default invocation performs no model turn; `--run` is explicit.

Current official [permission-profile documentation](https://learn.chatgpt.com/docs/permissions) was searched and opened on 2026-10-02, specifically the profile-selection and scope/enforcement sections. It describes local sandboxed command boundaries separately from other native surfaces. This supports retaining the collector's explicit tool-inventory and case-compliance limitations; it does not supply empirical guarantees for the pinned implementation.

Known unavailable coverage remains visible: macOS sandbox startup fails with TIOCSTI; Linux exact-file write grants panic on the synthetic file/.aws path; no implementation edits or atomic editor behavior are established; named role loading and the full model-tool inventory require separate native observations. The proposed original-worker compatibility change may accept optional runtime-directory declarations only if it records that writes are disabled, supplies no runtime write grants, and retains the physically read-only trial. A verifier needing those writes would remain unsupported. No model/candidate scores or real infrastructure pass follows from this source review.

## Replacement freeze

The replacement source was frozen by `/root/archive_backend`, then read and checked independently. Its two copied runner files in `/tmp/tal-native-linux-worker-original-preflight-20261002-04/runner` match the reviewed repository bytes. The following hashes still match after the reviewer checks:

| File | SHA-256 |
| --- | --- |
| `scripts/native-smoke.mjs` | `42123d63cbe4c473bf42e2cdcfb6566481ede1ae5157b5b2fd164ab699a0ae9b` |
| `scripts/native-linux-smoke.mjs` | `7585a5ecf677f90cd395471eea16dcde9213eb0d8b48561dd62852e0f7950e07` |
| `tests/toolkit/native-smoke.test.mjs` | `ac24fc378784d811e781c84f9a58242c033231e6c99538a0b23e7ec1c6442c3e` |

Independent `node --test tests/toolkit/native-smoke.test.mjs`: **30 passed, 0 failed, 0 skipped**. The same targeted diff whitespace check exits 0. The six added tests cover denied-directory path validation, observed item tags/IDs, read-only runtime policy, uncertain Docker creation, ownership/removal errors, and cleanup/audit success gating. The Docker failure tests use a synthetic transport, not an induced real-daemon failure. Existing real process-group cleanup tests also pass.

| First finding | Replacement evidence | Disposition |
| --- | --- | --- |
| Uncertain create / audit loss | `cleanupLinuxContainer` at lines 45–68 recovers the known UUID label and name, checks both ownership fields, retains inspection/removal errors, verifies absence; `runOwnedLinuxContainer` retains creation failure; final per-field audits at lines 158–164 retain audit errors. New tests exercise uncertain create, wrong owner and removal failure. | Closed for the reviewed contract. |
| Missing transport cleanup gate | `linuxRunPassed` at lines 79–80 requires `cleanup.host_transport.terminated === true` and no audit errors. Tests reject failed or unavailable transport cleanup despite exit 0. | Closed. |
| Untested engine acceptance / implicit pull | Lines 30–35 require the exact tested image, digest-checked seccomp and `--pull=never`; lines 109–111 compare actual native binary bytes before version/schema/account access. An alternate immutable image is rejected in tests; the real no-model record binds the exact image and binary. | Closed. |

The original worker fixture is used in this freeze, with case-index SHA-256 `d1ec170f77d69f940ceb30d25d156e64579d04cc02db7b0aa091d6d8c2e08276`. The reviewer independently compared its four raw files plus `prompt.md` against the staged bytes and recorded hashes/modes; all five match. Installed closure source digest is `89fce94b0332eadd6f7a6bbcb2f3fee014503fad22fdd950cb0ac066064b6a25`. This binds that staged closure, not any later instruction revision; a subsequent model dispatch must prepare the final candidate afresh.

`linuxReviewPolicy` at lines 37–40 accepts optional runtime directories for a review with no editable files and no verifier requiring declared runtime writes. It records `declared=["__pycache__/"]`, `granted=[]`. The collector receives no runtime write grants and `/trial` remains physically read-only. The observed `trial-runtime-directory-write-denied-1` check invokes `mkdir /trial/__pycache__`, exits 1, terminates its process group and leaves the path absent. File-output declarations, implementation cases and declared-runtime-write verification are rejected. This preserves the narrower composed boundary without pretending the optional allowance was exercised successfully.

The replacement sanitized no-model record is `/tmp/tal-native-linux-worker-original-preflight-20261002-04/evidence`:

| Relative artifact | SHA-256 |
| --- | --- |
| `../freeze.json` | `b2edd422b67fba207479679cc297376a5bc4409961596303e76659e1164cecfa` |
| `prepared.json` | `9d9628de50274df1c2bbd5398511936b1c1d27e6e8a98507467a24c02caa7e58` |
| `run.json` | `ece002c6341430f91ff38c6109bdddbee66a60165ed97b0a49744b6df9437c34` |
| `linux-host.json` | `106750eaf82b3881bbe66b54c2dcbc1dd03c4200011c5edb3e77444b8a4f75b4` |

All **13/13** command-boundary checks pass, each with terminated process cleanup. The UUID-owned container is absent; recorded cleanup errors and audit errors are empty; authentication/configuration endpoint fingerprints match. The reviewer independently compared all **120** baseline entries with both the recorded final inventory and the actual current trial tree: paths, byte hashes and modes match; no additional files exist. The tested image, native binary and seccomp digests equal their pinned constants. The Docker command explicitly includes `--pull=never`. Effective model/effort remain the inherited values.

The record still has `preflight_only=true`, `execution_started=false`, `case_compliant=false`, and `instruction_sources=[]`. `observed.native_items=[]` reflects no observed model turn; it does not prove that no other tools are available. The new item-tag/ID/thread/turn/tool/server observations retain event locators and explicitly avoid an inventory or enforcement claim. Mac TIOCSTI, Linux exact-file write panic, implementation editing and complete native tool enforcement remain excluded. No model run, candidate score, host setting change or actual infrastructure acceptance was performed by this reviewer.
