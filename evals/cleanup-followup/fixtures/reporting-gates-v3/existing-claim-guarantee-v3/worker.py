def handle(message, worker_id, db):
    job = db.fetch_one("""
        UPDATE jobs SET owner = ?, lease_until = CURRENT_TIMESTAMP + INTERVAL '30 seconds'
        WHERE reservation_id = ? AND state = 'pending'
          AND (lease_until IS NULL OR lease_until < CURRENT_TIMESTAMP)
        RETURNING reservation_id
    """, worker_id, message.reservation_id)
    if job is None:
        return

    db.reserve_stock(message.sku, message.quantity)
    db.execute("""
        UPDATE jobs SET state = 'completed'
        WHERE reservation_id = ? AND owner = ?
    """, message.reservation_id, worker_id)
