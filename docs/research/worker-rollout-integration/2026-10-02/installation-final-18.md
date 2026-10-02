# Fresh installation verification, checkpoint 18

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

The installation source digest is `44ab1cc9ff876c34852ee1e65e2ce7dd4246d83414daffc8848c98d4c9a31d91`.
The installed manifest SHA-256 is `418866349825676bc8ed9c6dee23ec68ae90ef802a6ecaa8e41f3617d4cdb8b9`.
The source inventory SHA-256 is `cdeff8ea5ee75b7c8de1c6fa320a845787229a79aad8baafd2d9ac2c263e8596`.

- [Command record, results and artifact hashes](installation-final-18-record.json)
- [Dry run](installation-final-18-dry-run.json), [installation](installation-final-18-install.json)
  and [repeat run](installation-final-18-repeat.json)
- [Installed manifest](installation-final-18-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-18-verification.json)
- [Source input inventory](installation-final-18-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the raw output hashes. Manifest bytes needed no
transformation. Earlier installation evidence, including checkpoint 17, is preserved.

This is structural installation evidence only. No model or native host execution
ran. It does not establish authentication, isolation, delegation, behavior or
production rollout safety. Subsequent source changes make this a historical
checkpoint. The word “final” identifies this requested installation checkpoint;
publication decisions are separate from this structural check.
