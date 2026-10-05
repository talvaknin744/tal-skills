# Native Linux capabilities source review — frozen07

The independently reviewed three-file revision has no actionable finding within its bounded source scope. The reviewer ran **44/44 runner tests** with no failures or skips and a clean targeted whitespace check. This accepts the source controls described below; it does not accept an installed skill, workflow result, or Python-enabled image. The reviewer authored none of these runner files and ran no models or containers. Authentication contents, private configuration values, host settings and permission settings were not inspected or changed.

The exact source and artifact hashes, check commands, locators and independent inventory comparisons are in [the review record](native-linux-capabilities-code-review.json). The previous 30-test and 34-test reviews retain their original bytes and dispositions.

## Existing-file implementation boundary

`--existing-file-inplace` explicitly stages declared outputs and composes a native trial-directory write grant with a physically read-only trial, exact writable file mounts and disjoint declared runtime-directory mounts. An absent declared output receives an empty placeholder, with the original baseline retained; no answer is supplied. Symlink ancestors, overlapping mounts, runner-managed paths, review-mode edits and atomic-save requirements are rejected. Actual mount inventory and positive/adverse CLI edit controls must pass before a model turn. The trial parent receives no physical writable fallback.

The current repeated-retirements preflight02 verifies the actual read-only mount plus exactly three writable targets. Its nine composed checks pass: installed patch CLI operations on the existing output, declared runtime writes, immutable/new sibling/temp/rename rejection and content restoration. All original 122 files retain their bytes and modes. It then correctly fails `verifier-executable-available` because the pinned image lacks `python3`; `execution_started=false`, `preflight_passed=false` and `failure_stage=preflight` are preserved. This is successful rejection, not an implementation or verifier pass. The earlier repeated, deadline and local composition preflight01 records used a different explicitly recorded runner revision and had no verifier-availability gate. They remain historical CLI-control evidence. None establishes the actual model edit handler or generic atomic editing.

## Timeout, phase and role evidence

Linux budgets must be integer values from 1 to 1800 seconds and record whether the value came from the caller, fixture or default. Frozen07 records successful preflight before execution, so a subsequent timeout or cleanup failure does not erase that phase. The model timeout is a turn budget; metadata, probes, history, verification and cleanup have separate bounds, with an outer container cutoff at the selected budget plus 120 seconds. A missing inner report after an outer cutoff cannot become a passing run.

Installed role files must have matching names, descriptions and instructions; expected definition names must be present before probing or execution. Names and hashes are source evidence, while the resolved internal role registry remains unavailable. The inspected official-tag loader supports discovering role files through configuration layers. A task path or assistant self-report is insufficient dispatch evidence. Child snapshots preserve role identity, current state and latest-turn state; retrieving current history from an active child does not establish terminal findings.

Native02 is preserved separately: its native snapshot at `events.jsonl:1455` directly reports `tal-durability`, with an active child and an in-progress turn. The parent timed out after 300 seconds and was interrupted. Its old aggregate `preflight_passed=false` remains untouched despite successful earlier boundary probes. No child findings or completed parent final are established by this review, and no candidate grade is assigned.

## Preserved read-only behavior

Current-source original preflight07 uses the unchanged original fixture index and copied prompt plus four raw files. The reviewer compared all **120 files** against the original baseline, staged inventory, recorded final inventory and current bytes/modes; all match. Both copied runner files match their recorded current source hashes. Its 13 boundary checks pass, including denial of optional `__pycache__` creation. It has a ready local `/trial` environment, 152 recorded feature flags, inherited `gpt-6-sol/xhigh`, nine installed role definitions, no model turn, no scope changes and confirmed owned container/transport cleanup. Authentication and configuration fingerprint comparisons are unchanged.

Full native tool availability/confinement, actual model editing and completed workflow behavior remain separate acceptance requirements. The Python-enabled target is outside this freeze and was not reviewed.
