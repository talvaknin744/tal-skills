def get_report(session, report_id, database, cache):
    cached = cache.get(report_id)
    if cached is not None:
        return cached
    report = database.one(
        "SELECT id, tenant_id, title, body FROM reports WHERE id = ?",
        (report_id,),
    )
    cache.set(report_id, report)
    return report
