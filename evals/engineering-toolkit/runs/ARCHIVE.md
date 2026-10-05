# Archived evaluation sources

The complete baseline engineering-toolkit and performance run trees are preserved in `tal-skills-evidence-2026-10-02.tar.zst`.

- SHA-256: `c458344334e5772646c9d797ac13392386e913fe854edab99bac07f84a56f49e`
- Compressed bytes: `7765035`
- Regular file members: `10349`
- Published release: [https://github.com/talvaknin744/tal-skills/releases/tag/v1.0.0](https://github.com/talvaknin744/tal-skills/releases/tag/v1.0.0) (all three assets uploaded and digest-verified 2026-10-05)
- Source commit: `67eba56a33168f2d52c8d17397a1038f76e3f20d`

Before pruning, the original integrity checker verified 256 manifests, 9,870
published artifacts and 9,002 source bindings. Every tar member was then streamed
back and compared by SHA-256 to the original source file.

Only the named evidence, candidate (including candidates), candidate-dependencies,
original-project, final-project and trial directories, plus the additionally
authorized snapshots, have been removed.
Scores, reviews, rubrics, original manifests, supplements, failed-attempt records
remain. The runner code copies and performance candidate snapshots were additionally
archived with user authorization on 5 October 2026; all 15 snapshot manifests
and all freeze records remain in source. The plan's original target of 400
files cannot accommodate the 609 required score/review/rubric/base-manifest files,
even before fixture corpora. The file targets are revised to the measured retained tree, as authorized on
5 October 2026. Supplemental manifests, grading provenance and freezes also
exceed the later 617-run-file estimate. Additional deletions require a scope decision.
The measured Phase 1 tree contains 2,863 tracked files, including 1,633 under
`evals/`; 1,026 original engineering run files survive alongside this document
and the release catalog. These retained counts govern the file-count acceptance
targets. Source bytes fit within 25 MB; ignored local environments are excluded.

`release-archive.json` binds the complete surviving inventory to its original
bytes. Personal-home redactions and archive-link changes record both original and retained hashes; the
archive preserves the unmodified originals. CI verifies retained bytes, original
manifest bindings and rubric identities. It does not claim to reread absent
source trees or rerun experiments.

To revalidate all original source bindings, verify the compressed hash, extract
the archive outside the repository, then run:

```sh
shasum -a 256 tal-skills-evidence-2026-10-02.tar.zst
mkdir -p /tmp/restored-tal-skills
tar --zstd -xf tal-skills-evidence-2026-10-02.tar.zst -C /tmp/restored-tal-skills
node scripts/check-evaluation-evidence.mjs /tmp/restored-tal-skills/evals/engineering-toolkit/runs
node scripts/check-performance-archive.mjs /tmp/restored-tal-skills/evals/performance/runs/2026-10-01
```

Historical relative paths in surviving manifests and reports identify members
of this archive when the source is no longer in the checkout. Failed, partial,
blocked and corrected outcomes retain their original interpretation.
