The change is **unsafe**.

**[P1] Full pages incorrectly end pagination** — [change.diff:8](https://github.com/talvaknin744/tal-skills/releases/download/v1.0.0/tal-skills-phase2-native-2026-10-05.tar.zst#member=phase2-eval/invocation-policy/runs/ordinary-pr-nontrigger/trial/change.diff&line=8) changes `<` to `<=`. Since the endpoint returns at most `page_size` records, every valid response now returns `None`, silently truncating results after the first page.

For example, `next_offset(0, 50, 50)` should return `50`; the patch returns `None`.

Keep `returned_count < page_size`. No files were edited.
