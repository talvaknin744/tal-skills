def totals_by_date(rows):
    """Rows are a completed list; date is already an ISO UTC calendar date.

    Each row is an intentional contribution, including identical rows.
    No source, progress signal, ongoing updates, or external state exists.
    """
    total = 0
    for row in rows:
        total += row["amount"]
    return {"all": total}


ROWS = [
    {"date": "2026-10-01", "amount": 2},
    {"date": "2026-10-01", "amount": 2},
    {"date": "2026-10-01", "amount": 3},
    {"date": "2026-10-02", "amount": 4},
]
