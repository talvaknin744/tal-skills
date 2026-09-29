# October release proposal

The README already marks v1 deprecated. The last seven days had zero v1 calls and
our symbol search found no callers. Schedule complete library and endpoint removal
for October 1, after the next monthly export. Announce that deadline once this
review is complete; no further assignee tracking is needed because each consumer
has a team.

Replace any remaining `export_v1(period)` use with `scan_v2()`, collect pages and
filter by period. The row schema is identical, so this should preserve behavior.
Leave the scaffolding template unchanged to keep this release small. Add a CI rule
that rejects every v1 import immediately, including existing reporting jobs.

Delete the old snapshot store with the endpoint. If consumers complain, restore
the previous API binary; that should be enough to reproduce any old export. Treat
a merged deletion PR as evidence that retirement is finished.
