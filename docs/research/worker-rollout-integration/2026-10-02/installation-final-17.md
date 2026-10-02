# Fresh installation verification, checkpoint 17

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

The installation source digest is `3caba82b06151afd7f72815494fd3729962c78dca59ea9943aed8b6d08b6068a`.
The installed manifest SHA-256 is `721291e492c7b00783b82e03f5f6f7caa8533b6aef7dba440b026639a9996d11`.
The source inventory SHA-256 is `30b3d5b24615ad1697b5f9374a2bf488899677669c81ed64f32624864a56bc9e`.

- [Command record, results and artifact hashes](installation-final-17-record.json)
- [Dry run](installation-final-17-dry-run.json), [installation](installation-final-17-install.json)
  and [repeat run](installation-final-17-repeat.json)
- [Installed manifest](installation-final-17-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-17-verification.json)
- [Source input inventory](installation-final-17-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the raw output hashes. Manifest bytes needed no
transformation. Earlier installation evidence, including checkpoint 16, is preserved.

This is structural installation evidence only. No model or native host execution
ran. It does not establish authentication, isolation, delegation, behavior or
production rollout safety. Subsequent source changes make this a historical
checkpoint. The word “final” identifies this requested installation checkpoint;
publication decisions are separate from this structural check.
