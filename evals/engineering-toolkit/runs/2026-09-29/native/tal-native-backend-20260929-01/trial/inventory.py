"""Existing local inventory service; callers authenticate tenant context upstream."""

import sqlite3
from contextlib import closing


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
            CREATE TABLE IF NOT EXISTS reservation_requests (
                tenant TEXT NOT NULL, request_key TEXT NOT NULL,
                sku TEXT NOT NULL, quantity INTEGER NOT NULL,
                reservation_id INTEGER NOT NULL UNIQUE,
                remaining INTEGER NOT NULL,
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
    if not isinstance(authenticated_tenant, str) or not authenticated_tenant:
        raise ValueError("authenticated_tenant must be a nonempty string")
    if not isinstance(request_key, str) or not request_key:
        raise ValueError("request_key must be a nonempty string")
    if (not isinstance(body, dict)
            or not {"sku", "quantity"} <= body.keys()
            or body.keys() - {"sku", "quantity", "tenant"}):
        raise ValueError("body must contain sku and quantity, with optional tenant")
    sku, quantity = body["sku"], body["quantity"]
    if not isinstance(sku, str) or not sku:
        raise ValueError("sku must be a nonempty string")
    if type(quantity) is not int or quantity <= 0:
        raise ValueError("quantity must be a positive built-in int")

    # The legacy body tenant has no authority and is not part of the intent.
    tenant, request_key, sku = str(authenticated_tenant), str(request_key), str(sku)
    with closing(sqlite3.connect(path, timeout=5)) as connection, connection:
        # Acquire the SQLite writer lock before either lookup. Competing calls
        # then see the committed receipt or stock from the preceding writer.
        connection.execute("BEGIN IMMEDIATE")
        previous = connection.execute(
            """SELECT reservation_id, sku, quantity, remaining
               FROM reservation_requests WHERE tenant = ? AND request_key = ?""",
            (tenant, request_key),
        ).fetchone()
        if previous is not None:
            reservation_id, saved_sku, saved_quantity, remaining = previous
            if (saved_sku, saved_quantity) != (sku, quantity):
                raise ReservationConflict("request key already used for different intent")
            return {"reservation_id": reservation_id, "tenant": tenant, "sku": saved_sku,
                    "quantity": saved_quantity, "remaining": remaining}

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
        reservation_id = cursor.lastrowid
        connection.execute(
            """INSERT INTO reservation_requests
               (tenant, request_key, sku, quantity, reservation_id, remaining)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (tenant, request_key, sku, quantity, reservation_id, remaining),
        )
    # The stock change, reservation, and complete replay receipt are committed.
    return {"reservation_id": reservation_id, "tenant": tenant, "sku": sku,
            "quantity": quantity, "remaining": remaining}
