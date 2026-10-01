# Finite local preview

This script only previews a supplied list of names. It runs once on a developer's
machine, calls no external service, mutates no file, and shares no resource with
a serving workload. Select names whose case-sensitive suffix is exactly `.tmp`.

Input: `a.tmp`, `b.tmp.backup`, `tmp-report.txt`, `c.txt`.

Review the filter only. No deletion, scheduler, or background worker is needed.
