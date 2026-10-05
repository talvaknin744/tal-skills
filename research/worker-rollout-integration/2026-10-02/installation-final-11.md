# Fresh installation verification, checkpoint 11

The requested worker workflow and four selected concern skills installed into a
new, empty temporary project for both Codex and Claude layouts. Dependency
resolution selected nine agents and fourteen skills. The dry run planned 231
creates without changing the project; installation created those paths; the
repeat run reported all 231 unchanged and changed zero files. All three commands
exited successfully with no conflicts or warnings.

An independent comparison checked all 230 managed data files against the installed
manifest and repository source: 210 copied canonical files and 20 generated agent
definitions or workflow wrappers. Every byte hash and installed file mode matched.
Generated files were compared directly with the checked-in adapters without
calling installer generation functions. The source digest was independently
recomputed. The installed manifest was the only additional file; no extra files
or symlinks appeared. Repeat-run hashes, modes, sizes and modification times stayed
unchanged. All 576 source inputs and earlier installation records remained unchanged.

Both installed host layouts and the captured source inventory match all five
candidate package trees in regression freeze11. After the commands and source
checks completed, the infrastructure source changed from `d90f9286…` to
`82295c47…`. This installation remains a historical freeze11 checkpoint; it does
not verify that later source version. Full identities are in the verification JSON.

The installation source digest is `a8d4f032e48fca2e95a650f09e49f56a055b3070eb61c68acd18586b8f8dc622`.
The installed manifest SHA-256 is `fb6a661b89f0271fa0eff6f7341a5cc90b559a495de8791df714da8b59f4d562`.
The source inventory SHA-256 is `3b15db77f2ebf89955f0619f51800e520cf651e64ea005b9a288749c67eccd85`.

- [Command record, results and artifact hashes](installation-final-11-record.json)
- [Dry run](installation-final-11-dry-run.json), [installation](installation-final-11-install.json)
  and [repeat run](installation-final-11-repeat.json)
- [Installed manifest](installation-final-11-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-11-verification.json)
- [Source input inventory](installation-final-11-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the raw output hashes. Manifest bytes needed no
transformation. Earlier installation evidence, including checkpoint 08, is preserved.

This is structural installation evidence only. No model or native host execution
ran. It does not establish authentication, isolation, delegation, behavior or
production rollout safety. Subsequent source changes make this a historical
checkpoint. The word “final” identifies this requested installation checkpoint;
the publication hold remains in force.
