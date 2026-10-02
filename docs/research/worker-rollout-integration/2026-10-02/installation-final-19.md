# Fresh installation verification, checkpoint 19

The requested worker workflow and four selected concern skills installed into a
new, empty temporary project for both Codex and Claude layouts. Dependency
resolution selected nine agents and fourteen skills. The dry run planned 233
creates without changing the project; installation created those paths; the
repeat run reported all 233 unchanged and changed zero files. All three commands
exited successfully with no conflicts or warnings.

An independent comparison checked all 232 managed data files against the installed
manifest and repository source: 212 copied canonical files and 20 generated agent
definitions or workflow wrappers. Every byte hash and installed file mode matched.
Generated files were compared directly with the checked-in adapters without
calling installer generation functions. The source digest was independently
recomputed. The installed manifest was the only additional file; no extra files
or symlinks appeared. Repeat-run hashes, modes, sizes and modification times stayed
unchanged. All 577 source inputs and earlier installation records remained unchanged.

The installation source digest is `836873f9f4276c07b0224842b02afcfd87b5d202577f0339dfc3d77e57f2cf09`.
The installed manifest SHA-256 is `168fec33bd03c59d57c611f5212d1f5931854eb5a5cd762f606d71d3286d2f8b`.
The source inventory SHA-256 is `6ed668c6a5088eefdb8ce94ac344b09ed1cf9e253181d169718c75bad68a0750`.

- [Command record, results and artifact hashes](installation-final-19-record.json)
- [Dry run](installation-final-19-dry-run.json), [installation](installation-final-19-install.json)
  and [repeat run](installation-final-19-repeat.json)
- [Installed manifest](installation-final-19-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-19-verification.json)
- [Source input inventory](installation-final-19-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the raw output hashes. Manifest bytes needed no
transformation. Earlier installation evidence, including checkpoint 18, is preserved.

This is structural installation evidence only. No model or native host execution
ran. It does not establish authentication, isolation, delegation, behavior or
production rollout safety. Subsequent source changes make this a historical
checkpoint. The word “final” identifies this requested installation checkpoint;
publication decisions are separate from this structural check.
