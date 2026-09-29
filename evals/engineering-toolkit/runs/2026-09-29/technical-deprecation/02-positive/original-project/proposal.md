# Proposed configuration simplification

Drafted 2026-09-29 at 10:00 UTC for the October maintenance release. Decision requested: approve the following package and allow Fleet Systems to schedule it.

The replacement schema is ready: the dashboard shows 70/70 schema-2-capable installations and no legacy console writes for seven days. The converter's representative configuration starts successfully on 3.9-rc1, and the binary rollback test passed. Continuing two key spellings and two editor generations adds support work without visible active demand.

## Stage 1 — Announce, 2026-10-01

Publish a release-note entry describing the new `prefetch` object and telling customers that the old keys and editor are deprecated. The October installation kit will include only editor 10.0. Fleet Systems will coordinate the change; the responsibility register lists the other groups for questions. The absence of exception requests is sufficient to retain the October date.

## Stage 2 — Migrate, 2026-10-08

Send executable 3.8 to the 20 online installations still on 3.6. Once their download acknowledgements appear, run the converter against all 108 centrally registered installation configurations and queue the resulting files. The 18 offline installations will receive their queued changes on reconnection. Send the converter instructions to the 12 locally administered installations through the usual maintenance bulletin. Their administrators can run them when convenient.

Use the installation policy as the converter's fallback so every output file is self-contained. Consider a central file successfully converted when it contains only replacement keys. The dashboard's existing schema capability percentage and legacy-write counter will be the progress measures. No additional adoption record is planned.

## Stage 3 — Complete, 2026-10-15

Bundle executable 3.9, editor 10.0, and the converted configuration into one scheduled release. Remove legacy-key handling from the central console, withdraw editor 9.2 from the supported kit download, and close the migration once the release is marked deployed. Locally managed installations will finish the same process during their next maintenance window. Old kits already held by customers can remain in use for recovery.

If startup errors rise during this stage, use the normal executable rollback to the pre-migration version recorded for each installation. The converted files can remain because conversion only renames the settings, and the rollback rehearsal passed. Seven-day central revision retention should cover any remaining recovery work.
