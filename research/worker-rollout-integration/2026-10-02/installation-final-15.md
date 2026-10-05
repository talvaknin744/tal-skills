# Fresh installation verification, checkpoint 15

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

Both installed host layouts, the captured inventory and the source at verification
match all five candidate package trees in regression freeze 15. Full candidate
and freeze identities are recorded in the verification JSON.

The installation source digest is `99ac69dff8458c8ae9fb35d96e0bab1c13aff22d22b7a6a020c8db6984abe928`.
The installed manifest SHA-256 is `549177ed9b4f8259dc9a9aea715ecc580f99ad63e03572c301ebfab103a6a232`.
The source inventory SHA-256 is `6364f372e25ca8577ea041903fa89c80d7ac41bb83d06c3f17fea5a02b765c75`.

- [Command record, results and artifact hashes](installation-final-15-record.json)
- [Dry run](installation-final-15-dry-run.json), [installation](installation-final-15-install.json)
  and [repeat run](installation-final-15-repeat.json)
- [Installed manifest](installation-final-15-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-15-verification.json)
- [Source input inventory](installation-final-15-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the raw output hashes. Manifest bytes needed no
transformation. Earlier installation evidence, including checkpoint 11, is preserved.

This is structural installation evidence only. No model or native host execution
ran. It does not establish authentication, isolation, delegation, behavior or
production rollout safety. Subsequent source changes make this a historical
checkpoint. The word “final” identifies this requested installation checkpoint;
the publication hold remains in force.
