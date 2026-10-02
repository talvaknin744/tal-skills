# Native Linux Python target review — frozen08

No actionable finding was found within the bounded source, image identity and saved no-model evidence scope. The primary reviewer independently ran **46/46 runner tests** with no failures or skips and a clean targeted whitespace check. A second reviewer independently checked sanitized image provenance and credential-free fixture verifier evidence. Neither reviewer authored this runner or image, ran models or containers, changed settings, or inspected authentication contents/private configuration values. The source review gate is closed for the root's already-authorized fresh run; candidate behavior remains ungraded.

Exact hashes, evidence paths, source/test locators and scope limits are in [the review record](native-linux-python-code-review.json). All three earlier review pairs retain their frozen bytes. The core collector remains byte-identical to frozen07.

## Target selection and runtime identity

The wrapper accepts only the original immutable image and the explicit Python-derived image; it still uses `--pull=never`. An unknown image fails before preparing fixtures, reading preference configuration or making native account calls. The derived target requires Codex `0.159.2` with the existing native executable hash, plus Python `3.11.2`, realpath `/usr/bin/python3.11` and executable hash `304aa87a…e07dc`. Missing or mismatching runtime metadata is rejected. Source order puts these assertions before the container's `account/read`. The read-only authentication bind already exists at that point; this is not a claim that validation happens before transport mounting.

Captured provenance consistently identifies the derived image, seven preserved original layers and one added layer. The 49-file Codex package arrays are identical and their tree hash recomputes. Python executable size, path, version and bytes match the runtime pin. The second reviewer verified 304 permitted freeze entries against actual bytes; seven home/config entries were excluded from content inspection. This verifies captured evidence, not current daemon state or reproducible rebuilding. Earlier image-level probes retain their earlier source binding.

## Current-source controls and preserved old behavior

All four fresh preflight records and copied runner files bind frozen08. The primary reviewer compared each original baseline, staged inventory, recorded final inventory and current file bytes/modes: all match. The original image retains **13/13** read-only controls and 120 unchanged files, including denial of optional cache-directory creation. The derived repeat, deadline and local trials have **14/14** base controls plus **9/9, 9/9 and 6/6** composed edit controls; their 122, 121 and 118 files remain unchanged. Actual Python discovery and startup succeed. All four report no model execution, inherited `gpt-6-sol/xhigh`, unchanged auth/config fingerprints, no scope changes and completed owned container/process cleanup.

The three separate credential-free probes execute the supplied Python verifier argv using the exact derived image, Docker `network=none`, a native profile with networking disabled, an explicit `HOME`-only environment and synthetic homes with empty config and no `auth.json`. Protected synthetic-home canary reads fail. Each verifier exits zero with empty stderr, preserves its complete before/after inventory and records owned cleanup. All 13 supplied raw files and three prompts retain their bytes/modes. These are verifier availability and baseline observation results, not completed workflow/model or candidate correctness results.

## Acceptance limits

The probes retain source digest `7d3ff64c…77e21` and are historical to the root's newer reference09 candidate. They do not establish that candidate's behavior; the next authorized run must freshly prepare its closure. The root's sealed model03 uses frozen07 and is outside this review.

Existing-file in-place edits and disjoint declared runtime directories remain the supported composition. Atomic saves and undeclared sibling creation remain denied. The actual model edit handler, full resolved tool/role registry, all-tool confinement, completed independent review chain and technical candidate result still require separate native observation and scoring. Earlier host-invalid, timeout, missing-Python and partial attempts remain unchanged.
