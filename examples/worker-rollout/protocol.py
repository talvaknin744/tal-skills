"""Database-owned effects and progress; not an external-effect guarantee."""
from __future__ import annotations
from contextlib import contextmanager
import hashlib
import json
import time
import psycopg
from psycopg.rows import dict_row

APPLICATION_NAME = "tal-worker-rollout"
LEASE_SECONDS = 2


class DrainBudgetExceeded(Exception):
    pass


def input_digest(manifest):
    return hashlib.sha256(json.dumps(manifest, separators=(",", ":"), sort_keys=True).encode()).hexdigest()


def amounts(row):
    data = row["manifest"]
    if row["input_schema"] == 1 and row["semantics"] == "sum-v1":
        values = data
    elif row["input_schema"] == 2 and row["semantics"] == "sum-v2":
        if not isinstance(data, list) or any(not isinstance(item, dict) or set(item) != {"amount"} for item in data):
            raise ValueError("invalid v2 retained input")
        values = [item["amount"] for item in data]
    else:
        raise ValueError("unsupported retained interpretation")
    if (not isinstance(values, list) or not 1 <= len(values) <= 100
            or any(type(amount) is not int or not 1 <= amount <= 1_000_000 for amount in values)):
        raise ValueError("invalid retained input")
    return values


class Session:
    def __init__(self, dsn, *, worker=False):
        self.deadline = None
        self.timeout_ms = 100 if worker else 5000
        self.connection = psycopg.connect(
            dsn, autocommit=True, row_factory=dict_row, connect_timeout=3,
            application_name=APPLICATION_NAME,
            options=f"-c statement_timeout={self.timeout_ms} -c lock_timeout={min(self.timeout_ms, 50) if worker else 2000}",
        )

    @contextmanager
    def transaction(self):
        timeout = self.timeout_ms
        if self.deadline is not None:
            remaining = self.deadline - time.monotonic()
            if remaining <= 0:
                raise DrainBudgetExceeded("no drain budget for another transaction")
            timeout = min(timeout, max(1, int(remaining * 1000)))
        with self.connection.transaction():
            self.connection.execute("SELECT set_config('statement_timeout',%s,true)", (str(timeout),))
            self.connection.execute("SELECT set_config('lock_timeout',%s,true)", (str(min(timeout, 50)),))
            yield self.connection

    def close(self):
        self.connection.close()


def locked(connection, job):
    row = connection.execute("SELECT * FROM jobs WHERE id=%s FOR UPDATE", (job,)).fetchone()
    if row is None:
        raise ValueError("unknown job")
    now = connection.execute("SELECT clock_timestamp() AS now").fetchone()["now"]
    return row, now


def expire_deadline(connection, row, now):
    if row["deadline"] <= now:
        connection.execute("UPDATE jobs SET status='deadline-exceeded',owner=NULL,generation=NULL,lease_until=NULL WHERE id=%s", (row["id"],))
        return True
    return False


def claim(session, job, owner, generation, supported):
    with session.transaction() as connection:
        gate = connection.execute("SELECT admitted FROM generations WHERE name=%s FOR SHARE", (generation,)).fetchone()
        if not gate or not gate["admitted"]:
            return {"accepted": False, "reason": "generation-excluded"}
        row, now = locked(connection, job)
        if row["status"] != "pending":
            return {"accepted": False, "reason": row["status"]}
        if expire_deadline(connection, row, now):
            return {"accepted": False, "reason": "deadline-exceeded"}
        interpretation = (row["input_schema"], row["checkpoint_schema"], row["semantics"])
        if interpretation not in supported:
            return {"accepted": False, "reason": "input-checkpoint-incompatible"}
        values = amounts(row)
        if row["input_hash"] != input_digest(row["manifest"]) or row["checkpoint"] > len(values):
            raise ValueError("retained input or cursor does not match immutable intent")
        if row["owner"] is not None and row["lease_until"] > now:
            return {"accepted": False, "reason": "leased"}
        epoch = row["epoch"] + 1
        connection.execute(
            "UPDATE jobs SET epoch=%s,owner=%s,generation=%s,lease_until=clock_timestamp()+%s*interval '1 second',claims=claims+1 WHERE id=%s",
            (epoch, owner, generation, LEASE_SECONDS, job),
        )
        return {"accepted": True, "job": job, "epoch": epoch, "checkpoint": row["checkpoint"],
                "input_hash": row["input_hash"], "manifest": row["manifest"],
                "input_schema": row["input_schema"], "checkpoint_schema": row["checkpoint_schema"],
                "semantics": row["semantics"], "deadline": row["deadline"].isoformat()}


def close_admission(session, generation, owner):
    with session.transaction() as connection:
        connection.execute("UPDATE generations SET admitted=false WHERE name=%s", (generation,))
        # This transaction waits for claims holding FOR SHARE before inventorying.
        rows = connection.execute("SELECT * FROM jobs WHERE owner=%s ORDER BY id", (owner,)).fetchall()
        return rows


def guard(connection, job, owner, epoch, digest):
    row, now = locked(connection, job)
    if row["status"] != "pending" or row["owner"] != owner or row["epoch"] != epoch or row["input_hash"] != digest:
        return None, "stale-owner-or-terminal"
    if expire_deadline(connection, row, now):
        return None, "deadline-exceeded"
    if row["lease_until"] is None or row["lease_until"] <= now:
        return None, "lease-expired"
    return row, None


def effect(session, job, owner, epoch, digest, step, amount):
    with session.transaction() as connection:
        row, reason = guard(connection, job, owner, epoch, digest)
        if row is None:
            return {"accepted": False, "reason": reason}
        values = amounts(row)
        if step != row["checkpoint"] or not 0 <= step < len(values) or values[step] != amount:
            return {"accepted": False, "reason": "effect-intent-mismatch"}
        inserted = connection.execute(
            "INSERT INTO receipts VALUES(%s,%s,%s,%s) ON CONFLICT(job,step) DO NOTHING RETURNING step",
            (job, step, amount, digest),
        ).fetchone()
        if inserted:
            changed = connection.execute("UPDATE totals SET value=value+%s WHERE job=%s RETURNING value", (amount, job)).fetchone()
            if changed is None:
                raise RuntimeError("missing business target; receipt must roll back")
        else:
            receipt = connection.execute("SELECT amount,input_hash FROM receipts WHERE job=%s AND step=%s", (job, step)).fetchone()
            if receipt != {"amount": amount, "input_hash": digest}:
                raise RuntimeError("receipt conflicts with immutable intent")
        return {"accepted": True, "replayed": inserted is None, "step": step}


def checkpoint(session, job, owner, epoch, digest, step):
    with session.transaction() as connection:
        row, reason = guard(connection, job, owner, epoch, digest)
        if row is None:
            return {"accepted": False, "reason": reason}
        values = amounts(row)
        if step != row["checkpoint"] or not 0 <= step < len(values):
            return {"accepted": False, "reason": "cursor-mismatch"}
        receipt = connection.execute("SELECT amount,input_hash FROM receipts WHERE job=%s AND step=%s", (job, step)).fetchone()
        if receipt != {"amount": values[step], "input_hash": digest}:
            return {"accepted": False, "reason": "receipt-missing-or-conflicting"}
        connection.execute("UPDATE jobs SET checkpoint=checkpoint+1 WHERE id=%s", (job,))
        return {"accepted": True, "checkpoint": step + 1}


def release(session, job, owner, epoch, digest, reason):
    with session.transaction() as connection:
        row, rejected = guard(connection, job, owner, epoch, digest)
        if row is None:
            return {"accepted": False, "reason": rejected}
        if reason == "maintenance":
            connection.execute("UPDATE jobs SET owner=NULL,generation=NULL,lease_until=NULL,maintenance_handoffs=maintenance_handoffs+1 WHERE id=%s", (job,))
        elif reason == "business-failure":
            connection.execute(
                "UPDATE jobs SET owner=NULL,generation=NULL,lease_until=NULL,business_failures=business_failures+1,"
                "status=CASE WHEN business_failures+1=business_budget THEN 'business-failed' ELSE status END WHERE id=%s", (job,),
            )
        else:
            raise ValueError("explicit release classification required")
        return {"accepted": True, "classification": reason}


def finish(session, job, owner, epoch, digest):
    with session.transaction() as connection:
        row, reason = guard(connection, job, owner, epoch, digest)
        if row is None:
            return {"accepted": False, "reason": reason}
        if row["checkpoint"] != len(amounts(row)):
            return {"accepted": False, "reason": "work-incomplete"}
        connection.execute("UPDATE jobs SET status='completed',completed_at=clock_timestamp(),owner=NULL,generation=NULL,lease_until=NULL WHERE id=%s", (job,))
        return {"accepted": True}
