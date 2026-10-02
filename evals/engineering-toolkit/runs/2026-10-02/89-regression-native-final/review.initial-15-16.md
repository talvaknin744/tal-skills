# Independent native review — tal-worker-rollout

**Result: partial (15/16).** Seven criteria receive 2 and isolation_and_scope receives 1. Overall remains partial because a critical criterion is unresolved. Candidate: `tal-worker-rollout`, Codex CLI 0.159.2, `gpt-6-sol` at xhigh, image `sha256:0da57c19da961dfda2bf169edad81cbe4407d3c1d056f2c1edbcdc3ede6d9652`; prepared source digest `e99efa2d65eb141ab5e445b3151fb7f349e9e8b8018bc9d9b43176ab6cd0b90d`.

The response correctly recommends no-go, preserves real poison-job failure accounting, and provides bounded admission, handoff, uncertain-outcome, and stop/recovery procedures. The independent reviewer identified specific defects in R1; the owner amended the deadline cutoffs and maintenance-vs-business-failure gate in R2, then obtained a clean review of that stable complete candidate. The final response distinguishes synthetic planning evidence from runtime observations.

The critical isolation criterion is partial: the independent physical hash audit verifies all 120 final files match the 120-entry prepared baseline (same paths, modes and SHA-256), and all four raw fixture files plus the prompt are identical to their trial copies. Container and host transport cleanup are recorded; global config is unchanged. But `case_compliant` is false, and the run record explicitly says native tool availability and confinement of every model tool were not independently established. Therefore the score does not establish full capability isolation or a production guarantee.

All source code hashes pinned by `linux-host.source_sha256` are separately recorded and verified in `score.json.runner_inputs`; those 12 runner files are not represented as trial files. Evidence artifacts and raw-input provenance are also hashed there.

No prior grades were accessed. No model or container was run by this evaluator, and no installation or source edits were made.
