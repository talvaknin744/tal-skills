# Fresh installation verification, checkpoint 16

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

The source was checked against all five regression freeze-16 candidate trees
before installation. Both installed host layouts, the captured inventory and
the source after the commands match those same trees. Full candidate and freeze
identities are recorded in the verification JSON.

The installation source digest is `44d652411f2e6ae661937191e7c64915f99451f58ef117a043be192ac25bcc59`.
The installed manifest SHA-256 is `d3f4f850f8bd9b62527e489508ebfe0d1734bd716da885c0ef7db943243bc394`.
The source inventory SHA-256 is `2799f5865fc7597da638a862d4089a2aa7b7ca091cfdf629dbf59a3b98cd1d38`.

- [Command record, results and artifact hashes](installation-final-16-record.json)
- [Dry run](installation-final-16-dry-run.json), [installation](installation-final-16-install.json)
  and [repeat run](installation-final-16-repeat.json)
- [Installed manifest](installation-final-16-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-16-verification.json)
- [Source input inventory](installation-final-16-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the raw output hashes. Manifest bytes needed no
transformation. Earlier installation evidence, including checkpoint 15, is preserved.

This is structural installation evidence only. No model or native host execution
ran. It does not establish authentication, isolation, delegation, behavior or
production rollout safety. Subsequent source changes make this a historical
checkpoint. The word “final” identifies this requested installation checkpoint;
publication decisions are separate from this structural check.
