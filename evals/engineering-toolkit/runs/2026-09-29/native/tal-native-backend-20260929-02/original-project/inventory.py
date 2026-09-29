"""Existing local inventory service; callers authenticate tenant context upstream."""

import sqlite3


class ReservationConflict(ValueError):
    pass


class InsufficientStock(ValueError):
    pass


def initialize(path):
    with sqlite3.connect(path) as connection:
        connection.executescript("""
            CREATE TABLE IF NOT EXISTS inventory (
                tenant TEXT NOT NULL, sku TEXT NOT NULL, quantity INTEGER NOT NULL,
                PRIMARY KEY (tenant, sku)
            );
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT, tenant TEXT NOT NULL,
                sku TEXT NOT NULL, quantity INTEGER NOT NULL
            );
        """)
        connection.executemany(
            "INSERT OR IGNORE INTO inventory VALUES (?, ?, ?)",
            [("tenant-a", "gear", 5), ("tenant-a", "bolt", 8), ("tenant-b", "gear", 7)],
        )


def stock(path, tenant, sku):
    with sqlite3.connect(path) as connection:
        row = connection.execute(
            "SELECT quantity FROM inventory WHERE tenant = ? AND sku = ?", (tenant, sku)
        ).fetchone()
    return None if row is None else row[0]


def reserve(path, authenticated_tenant, request_key, body):
    tenant = body.get("tenant", authenticated_tenant)
    sku, quantity = body["sku"], body["quantity"]
    with sqlite3.connect(path, timeout=5) as connection:
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
        return {"reservation_id": cursor.lastrowid, "tenant": tenant, "sku": sku,
                "quantity": quantity, "remaining": remaining}
