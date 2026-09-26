import uuid


def create_order(db, broker, account_id, items):
    order_id = str(uuid.uuid4())
    with db.transaction():
        db.execute(
            "INSERT INTO orders (id, account_id, items) VALUES (?, ?, ?)",
            (order_id, account_id, items),
        )
    broker.publish("order.created", {"order_id": order_id, "items": items})
    return {"order_id": order_id, "status": "accepted"}
