def consume(event, db, delivery):
    with db.transaction():
        db.set_account(event["account_id"], event["revision"], event["tier"])
        db.insert_audit(event["event_id"])
    delivery.ack()
