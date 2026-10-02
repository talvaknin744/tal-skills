# Installation after regression repair

The current worker workflow and four explicitly selected concern skills were
installed into a fresh temporary project for both Codex and Claude layouts.
Dependency resolution selected nine roles and fourteen skills. The dry run
planned 231 creates; installation performed those creates; repeated installation
reported all 231 paths unchanged. This checks packaging, not native execution.

The first attempt returned ENOENT because the target directory did not exist.
After creating that owned temporary directory, all three recorded commands
completed successfully. Existing user settings were not changed.

Selection: `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations`, `overload-control`.

- [Dry-run plan](installation-repaired-dry-run.json)
- [Installation result](installation-repaired-install.json)
- [Repeated installation](installation-repaired-repeat.json)
- [Installed manifest](installation-repaired-manifest.json) and
  [file hash/mode verification](installation-repaired-integrity.json)

Records replace only the temporary target path with `/PROJECT` and serialize
the captured JSON. Earlier installation records remain historical. These
layouts do not establish Claude authentication, native workflow behavior or
operational deployment readiness.
