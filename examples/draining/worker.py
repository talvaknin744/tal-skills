"""Small database-owned job protocol; external effects need their own contract."""

from __future__ import annotations

from contextlib import contextmanager
import hashlib
import json

import psycopg
from psycopg.rows import dict_row

APPLICATION_NAME = "tal-draining-example"


def input_digest(manifest):
    return hashlib.sha256(json.dumps(manifest, separators=(",", ":")).encode()).hexdigest()


def valid_manifest(manifest):
    return (isinstance(manifest, list) and 1 <= len(manifest) <= 100
            and all(type(amount) is int and 1 <= amount <= 1_000_000
                    for amount in manifest))


@contextmanager
def transaction(dsn):
    connection = psycopg.connect(
        dsn, autocommit=True, row_factory=dict_row, connect_timeout=5,
        application_name=APPLICATION_NAME,
        options="-c statement_timeout=5000 -c lock_timeout=2000",
    )
    try:
        with connection.transaction():
            yield connection
    finally:
        # Finalize even when commit itself fails; no connection crosses a work slice.
        connection.close()


def locked_job(connection, job):
    row = connection.execute("SELECT * FROM jobs WHERE id=%s FOR UPDATE", (job,)).fetchone()
    if row is None:
        raise ValueError("job does not exist")
    # Sample after lock acquisition, not before a potentially long lock wait.
    now = connection.execute("SELECT clock_timestamp() AS now").fetchone()["now"]
    return row, now


def claim(dsn, job, owner, generation):
    with transaction(dsn) as connection:
        gate = connection.execute(
            "SELECT * FROM generations WHERE name=%s FOR SHARE", (generation,)
        ).fetchone()
        if gate is None or not gate["admitted"]:
            return {"accepted": False, "reason": "generation-excluded"}
        row, now = locked_job(connection, job)
        if row["status"] != "pending":
            return {"accepted": False, "reason": row["status"]}
        if row["deadline"] <= now:
            connection.execute(
                "UPDATE jobs SET status='deadline-exceeded',owner=NULL,lease_until=NULL WHERE id=%s", (job,)
            )
            return {"accepted": False, "reason": "deadline-exceeded"}
        if row["schema_version"] != gate["schema_version"] or row["schema_version"] != 1:
            return {"accepted": False, "reason": "checkpoint-schema-incompatible"}
        if row["owner"] is not None and row["lease_until"] > now:
            return {"accepted": False, "reason": "leased"}
        if (not valid_manifest(row["manifest"])
                or row["input_hash"] != input_digest(row["manifest"])
                or row["checkpoint"] > len(row["manifest"])):
            connection.execute(
                "UPDATE jobs SET status='quarantined',owner=NULL,lease_until=NULL WHERE id=%s", (job,)
            )
            return {"accepted": False, "reason": "quarantined"}
        epoch = row["epoch"] + 1
        connection.execute(
            "UPDATE jobs SET epoch=%s,owner=%s,lease_until=clock_timestamp()+interval '5 minutes',"
            "claims=claims+1 WHERE id=%s", (epoch, owner, job)
        )
        return {"accepted": True, "epoch": epoch, "checkpoint": row["checkpoint"],
                "input_hash": row["input_hash"]}


def guarded_job(connection, job, owner, epoch, digest):
    row, now = locked_job(connection, job)
    if (row["status"] != "pending" or row["owner"] != owner or row["epoch"] != epoch
            or row["input_hash"] != digest):
        return None
    if row["deadline"] <= now:
        connection.execute(
            "UPDATE jobs SET status='deadline-exceeded',owner=NULL,lease_until=NULL WHERE id=%s", (job,)
        )
        return None
    if row["lease_until"] is None or row["lease_until"] <= now:
        return None
    return row


def apply_effect(dsn, job, owner, epoch, digest, step):
    with transaction(dsn) as connection:
        row = guarded_job(connection, job, owner, epoch, digest)
        if row is None or step != row["checkpoint"] or not 0 <= step < len(row["manifest"]):
            return {"accepted": False}
        amount = row["manifest"][step]
        inserted = connection.execute(
            "INSERT INTO effects(job,step,amount,input_hash) VALUES(%s,%s,%s,%s) "
            "ON CONFLICT(job,step) DO NOTHING RETURNING step", (job, step, amount, digest)
        ).fetchone()
        if inserted:
            changed = connection.execute(
                "UPDATE totals SET value=value+%s WHERE job=%s RETURNING value", (amount, job)
            ).fetchone()
            if changed is None:
                raise RuntimeError("business target is missing; receipt must not commit")
        else:
            receipt = connection.execute(
                "SELECT amount,input_hash FROM effects WHERE job=%s AND step=%s", (job, step)
            ).fetchone()
            if receipt != {"amount": amount, "input_hash": digest}:
                raise RuntimeError("retained effect conflicts with job intent")
        return {"accepted": True, "replayed": inserted is None, "step": step}


def checkpoint(dsn, job, owner, epoch, digest, step):
    with transaction(dsn) as connection:
        row = guarded_job(connection, job, owner, epoch, digest)
        if row is None or step != row["checkpoint"] or not 0 <= step < len(row["manifest"]):
            return False
        receipt = connection.execute(
            "SELECT amount,input_hash FROM effects WHERE job=%s AND step=%s", (job, step)
        ).fetchone()
        if receipt != {"amount": row["manifest"][step], "input_hash": digest}:
            return False
        connection.execute("UPDATE jobs SET checkpoint=checkpoint+1 WHERE id=%s", (job,))
        return True


def release(dsn, job, owner, epoch, digest, reason):
    with transaction(dsn) as connection:
        if guarded_job(connection, job, owner, epoch, digest) is None:
            return False
        if reason == "maintenance":
            connection.execute(
                "UPDATE jobs SET owner=NULL,lease_until=NULL,maintenance_handoffs=maintenance_handoffs+1 "
                "WHERE id=%s", (job,)
            )
        elif reason == "confirmed-business-failure":
            connection.execute(
                "UPDATE jobs SET owner=NULL,lease_until=NULL,business_failures=business_failures+1,"
                "status=CASE WHEN business_failures+1>=business_budget THEN 'business-failed' "
                "ELSE status END WHERE id=%s", (job,)
            )
        else:
            raise ValueError("release requires an explicit classified outcome")
        return True


def finish(dsn, job, owner, epoch, digest):
    with transaction(dsn) as connection:
        row = guarded_job(connection, job, owner, epoch, digest)
        if row is None or row["checkpoint"] != len(row["manifest"]):
            return False
        connection.execute(
            "UPDATE jobs SET status='completed',owner=NULL,lease_until=NULL WHERE id=%s", (job,)
        )
        return True
