[group.py:7](<trial>/workspace/project/group.py:7) currently combines everything under `"all"`. The smallest change is to replace lines 7–10 with:

```python
    totals = {}
    for row in rows:
        date = row["date"]
        totals[date] = totals.get(date, 0) + row["amount"]
    return totals
```

This uses the supplied UTC date directly and counts every row, including identical rows.

Expected result for `ROWS`:

```python
{"2026-10-01": 7, "2026-10-02": 4}
```

Verified locally in memory. The file is unchanged; no external services were used.
