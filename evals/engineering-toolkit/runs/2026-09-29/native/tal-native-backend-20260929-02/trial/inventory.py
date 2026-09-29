"""Existing local inventory service; callers authenticate tenant context upstream."""

from contextlib import closing
import sqlite3


class ReservationConflict(ValueError):
    pass


class InsufficientStock(ValueError):
    pass


def initialize(path):
    with closing(sqlite3.connect(path)) as connection, connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS inventory (
                tenant TEXT NOT NULL, sku TEXT NOT NULL, quantity INTEGER NOT NULL,
                PRIMARY KEY (tenant, sku)
            );
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL,
                sku TEXT NOT NULL, quantity INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS reservation_receipts (
                tenant TEXT NOT NULL, request_key TEXT NOT NULL,
                reservation_id INTEGER NOT NULL, sku TEXT NOT NULL,
                quantity INTEGER NOT NULL, remaining INTEGER NOT NULL,
                PRIMARY KEY (tenant, request_key)
            );
        """)
        connection.executemany(
            "INSERT OR IGNORE INTO inventory VALUES (?, ?, ?)",
            [("tenant-a", "gear", 5), ("tenant-a", "bolt", 8), ("tenant-b", "gear", 7)],
        )


def stock(path, tenant, sku):
    with closing(sqlite3.connect(path)) as connection:
        row = connection.execute(
            "SELECT quantity FROM inventory WHERE tenant = ? AND sku = ?", (tenant, sku)
        ).fetchone()
    return None if row is None else row[0]


def reserve(path, authenticated_tenant, request_key, body):
    for name, value in (("tenant", authenticated_tenant), ("request_key", request_key)):
        if not isinstance(value, str) or not value:
            raise ValueError(f"{name} must be a nonempty string")
    if not isinstance(body, dict):
        raise ValueError("body must be a dictionary")
    if not {"sku", "quantity"} <= body.keys() or body.keys() - {"sku", "quantity", "tenant"}:
        raise ValueError("body must contain sku and quantity, with only optional tenant")
    sku, quantity = body["sku"], body["quantity"]
    if not isinstance(sku, str) or not sku:
        raise ValueError("sku must be a nonempty string")
    if type(quantity) is not int or quantity <= 0:
        raise ValueError("quantity must be a positive built-in int")

    tenant = authenticated_tenant
    with closing(sqlite3.connect(path, timeout=5)) as connection, connection:
        # Take SQLite's writer lock before reading receipts or stock. Separate
        # callers then observe the committed result of the preceding writer.
        connection.execute("BEGIN IMMEDIATE")
        receipt_query = (
            "SELECT reservation_id, tenant, sku, quantity, remaining "
            "FROM reservation_receipts WHERE tenant = ? AND request_key = ?"
        )
        receipt = connection.execute(receipt_query, (tenant, request_key)).fetchone()
        if receipt is not None:
            if (receipt[2], receipt[3]) != (sku, quantity):
                raise ReservationConflict("request key already used for different intent")
        else:
            row = connection.execute(
                "SELECT quantity FROM inventory WHERE tenant = ? AND sku = ?", (tenant, sku)
            ).fetchone()
            if row is None or row[0] < quantity:
                raise InsufficientStock("not enough stock")
            remaining = row[0] - quantity
            connection.execute(
                "UPDATE inventory SET quantity = ? WHERE tenant = ? AND sku = ?",
                (remaining, tenant, sku),
            )
            cursor = connection.execute(
                "INSERT INTO reservations (tenant, sku, quantity) VALUES (?, ?, ?)",
                (tenant, sku, quantity),
            )
            connection.execute(
                "INSERT INTO reservation_receipts "
                "(tenant, request_key, reservation_id, sku, quantity, remaining) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (tenant, request_key, cursor.lastrowid, sku, quantity, remaining),
            )
            # Read both initial and replay receipts through SQLite so their
            # value types match even when callers supply string subclasses.
            receipt = connection.execute(receipt_query, (tenant, request_key)).fetchone()
    # The context commits all three writes before publishing the receipt.
    return dict(zip(("reservation_id", "tenant", "sku", "quantity", "remaining"), receipt))
