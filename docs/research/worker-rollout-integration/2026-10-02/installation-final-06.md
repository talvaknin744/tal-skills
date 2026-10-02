# Fresh installation verification, checkpoint 06

The requested worker workflow and four selected concern skills installed into a
new, empty temporary project for both Codex and Claude layouts. Dependency
resolution selected nine agents and fourteen skills. The dry run planned 231
creates without changing the project; installation created those paths; the
repeat run reported all 231 unchanged and changed zero files.

An independent file comparison checked all 230 managed data files against both
the installed manifest and current repository source: 210 copied canonical files
and 20 generated agent definitions or workflow wrappers. Every byte hash and
installed file mode matched. The generated files were compared directly with
the checked-in adapters, without calling the installer's generation functions.
The installed manifest was the only additional file; no extra files or symlinks
were present. The 576 captured source inputs and all earlier installation
records stayed unchanged throughout these commands.

The installation source digest is
`4d33043ada81aa1186ba3045986899aa46ffa1d67a5ec838f920941f8c47807c`.
The installed manifest SHA-256 is
`122390c641803222d61875ecfabd9b5fbd7841b273df7abd583a0e0fe902b4f8`.

- [Command record, results and artifact hashes](installation-final-06-record.json)
- [Dry run](installation-final-06-dry-run.json),
  [installation](installation-final-06-install.json) and
  [repeat run](installation-final-06-repeat.json)
- [Installed manifest](installation-final-06-manifest.json)
- [Per-file source, manifest and mode verification](installation-final-06-verification.json)
- [Source input inventory](installation-final-06-source-inventory.json)

The selected packages were `tal-worker-rollout`, `concurrency-correctness`,
`infrastructure-change-safety`, `microservice-operations` and `overload-control`.
Only an owned temporary project received installed files. Captured JSON replaces
the project, repository and home paths with `/PROJECT`, `/SOURCE` and `/HOME`;
the command record binds the original output hashes. The manifest bytes needed
no transformation. Earlier installation evidence is preserved.

This is structural installation evidence only. No model or native host execution
was run, and this check does not establish authentication, isolation, delegation,
behavior or production rollout safety. The word “final” identifies this requested
installation checkpoint; the existing publication hold remains in force.
