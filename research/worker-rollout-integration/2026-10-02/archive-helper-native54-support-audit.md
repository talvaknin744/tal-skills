# Native score inventory export compatibility

The exporter can derive publication bindings from the independent native score's
explicit source artifacts, original input pairs and complete final inventory.
It validates every hash against a declared copy source, checks the trial root and
complete file set, and rejects unsafe, missing, duplicate or conflicting paths
before creating an archive. Existing native scores with a `bindings` map retain
their prior export path. Original scoring fields and the host-blocked disposition
remain unchanged; the archive manifest identifies derived metadata explicitly.

The actual frozen score produces 133 validated bindings in a read-only preflight.
The 46 focused exporter and evidence-checker tests pass. All 1,959 previously
archived files and 612 raw source files remained unchanged. The helper and tests
are refrozen for independent review; attempt 54 has not been exported.

The first independent review identified three guard gaps. Copy-list destination
collisions now fail before directory creation. Score records bypass event-only
filtering, preserving grading criteria named `reasoning_quality` while hidden
reasoning events remain omitted. Each original input's `trial_path` must identify
the corresponding copied trial file; fixture aliases, unrelated same-byte files
and scorer projections are rejected. Separate tests reproduce each finding, and
the first reviewed helper, tests and audit are retained as historical snapshots.

- [Source fingerprints, freeze hashes and detailed checks](archive-helper-native54-support-audit.json)
- [Exporter](archive-evaluations.py)
- [Original exporter bytes](history/archive-exporter-before-native54.py)
- [Focused exporter tests](../../../tests/evaluation-export.test.mjs)

The separate checker work now supports source-bound final inventories in
`evidence/linux-host.json.final_files`; its 28 tests pass. No run fields were
invented and no completeness requirement was relaxed. Actual export still waits
for independent recheck of the repaired helper. This work does not establish
native acceptance or candidate quality, and the native attempt still identifies
its earlier 0ef candidate closure.
