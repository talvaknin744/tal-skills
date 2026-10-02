# Fresh installation verification, checkpoint 08

The requested worker workflow and four selected concern skills installed into a
new, empty temporary project for both Codex and Claude layouts. Dependency
resolution selected nine agents and fourteen skills. The dry run planned 231
creates without changing the project; installation created those paths; the
repeat run reported all 231 unchanged and changed zero files. All three commands
exited successfully with no conflicts or warnings.

An independent file comparison checked all 230 managed data files against both
the installed manifest and repository source captured during the run: 210 copied
canonical files and 20 generated agent definitions or workflow wrappers. Every
byte hash and installed file mode matched. Generated files were compared directly
with the checked-in adapters, without calling the installer's generation
functions. The installed manifest was the only additional file; no extra files or
symlinks were present. All 576 captured source inputs and earlier installation
records stayed unchanged throughout the commands.

The installation source digest is
`879319822017325f00767d68a3f2408250ec60a22578f119441724be32b6c73c`.
The installed manifest SHA-256 is
`169af085640da285c5bd67a492811cf1ddba2e4bfaf525125aeb10aaadd00a79`.
The source inventory SHA-256 is
`bb6895352cfa00aa21a00cea25f874562af9b2ede18de3de0d1a24a3c990652a`.

- [Command record, results and artifact hashes](installation-final-08-record.json)
- [Dry run](installation-final-08-dry-run.json),
  [installation](installation-final-08-install.json) and
  [repeat run](installation-final-08-repeat.json)
- [Installed manifest](installation-final-08-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-08-verification.json)
- [Source input inventory](installation-final-08-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the original output hashes. The manifest bytes needed
no transformation. Earlier installation evidence, including checkpoint 06, is
preserved.

This is structural installation evidence only. No model or native host execution
was run, and this check does not establish authentication, isolation, delegation,
behavior or production rollout safety. The evidence binds the captured source
inventory; subsequent source changes make it a historical checkpoint. The word
“final” identifies this requested installation checkpoint, and the publication
hold remains in force.
