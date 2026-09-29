"""Verify durable handoffs using owned disposable PostgreSQL and real processes."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import multiprocessing as mp
import os
from pathlib import Path
import secrets
import signal
import subprocess
import sys
import time
import uuid

import psycopg

import worker

HERE = Path(__file__).resolve().parent
IMAGE = "postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873"
LIMITS = [
    "Short processes stand in for a 12/24-hour job; no endurance or Kubernetes test.",
    "Effects, receipts, and fencing are local PostgreSQL state, not external-provider guarantees.",
    "All workers use the same binary; schema mismatch rejection is not mixed-version compatibility proof.",
    "Lease/deadline expiry is advanced by the fixture; no lease-renewal or clock-jump test.",
    "No broker delivery counter, prefetch, SIGTERM drain, partition, database crash, or failover test.",
    "Database storage is disposable tmpfs; no physical durability or RPO claim.",
    "Only closed-generation rejection is exercised; concurrent admission-gate transitions need further tests.",
]


def require(condition, explanation):
    if not condition:
        raise AssertionError(explanation)


def docker(*args, env=None, input=None, check=True):
    result = subprocess.run(["docker", *args], text=True, capture_output=True,
                            timeout=60, env=env, input=input)
    if check and result.returncode:
        raise RuntimeError(f"docker {args[0]} failed: {result.stderr.strip()}")
    return result


class DatabaseFixture:
    def __init__(self):
        self.run_id = uuid.uuid4().hex
        self.name = f"tal-draining-{self.run_id[:12]}"
        self.password = secrets.token_urlsafe(24)
        self.dsn = None
        self.creation_attempted = False

    def start(self):
        self.creation_attempted = True
        docker("run", "--detach", "--name", self.name,
               "--label", "tal-skills.fixture=draining",
               "--label", f"tal-skills.run={self.run_id}",
               "--publish", "127.0.0.1::5432",
               "--tmpfs", "/var/lib/postgresql:rw", "--memory", "512m",
               "--env", "POSTGRES_PASSWORD", "--env", "POSTGRES_DB=draining",
               IMAGE, env=os.environ | {"POSTGRES_PASSWORD": self.password})
        deadline = time.monotonic() + 45
        while True:
            ready = docker("exec", self.name, "pg_isready", "-h", "127.0.0.1",
                           "-U", "postgres", "-d", "draining", check=False)
            if ready.returncode == 0:
                break
            if time.monotonic() >= deadline:
                raise TimeoutError("disposable PostgreSQL readiness deadline")
            time.sleep(0.1)
        port = int(docker("port", self.name, "5432/tcp").stdout.strip().rsplit(":", 1)[1])
        self.dsn = f"postgresql://postgres:{self.password}@127.0.0.1:{port}/draining?sslmode=disable"
        with worker.transaction(self.dsn) as connection:
            connection.execute((HERE / "schema.sql").read_text())
            connection.execute(
                "INSERT INTO generations VALUES('compatible',true,1),('retiring',true,1),"
                "('incompatible',true,2)"
            )

    def close(self):
        if not self.creation_attempted:
            return {"container_removed": True}
        names = docker("container", "ls", "-a", "--filter", f"name=^/{self.name}$",
                       "--format", "{{.Names}}").stdout.splitlines()
        if not names:
            return {"container_removed": True}
        labels = json.loads(docker("inspect", "--format", "{{json .Config.Labels}}",
                                   self.name).stdout)
        require(labels.get("tal-skills.fixture") == "draining"
                and labels.get("tal-skills.run") == self.run_id,
                "refusing cleanup of container without this run's ownership labels")
        docker("rm", "--force", "--volumes", self.name)
        remaining = docker("container", "ls", "-a", "--filter", f"label=tal-skills.run={self.run_id}",
                           "--format", "{{.Names}}").stdout.strip()
        require(not remaining, "owned container remains after cleanup")
        return {"container_removed": True}


def worker_process(dsn, job, owner, generation, pipe):
    state = worker.claim(dsn, job, owner, generation)
    pipe.send({"event": "claim", **state})
    if not state["accepted"]:
        pipe.close()
        return
    args = (dsn, job, owner, state["epoch"], state["input_hash"])
    try:
        while True:
            if not pipe.poll(20):
                raise TimeoutError("fixture coordinator stopped sending commands")
            command = pipe.recv()
            operation = command["operation"]
            if operation == "effect":
                result = worker.apply_effect(*args, command["step"])
            elif operation == "checkpoint":
                result = worker.checkpoint(*args, command["step"])
            elif operation == "release":
                result = worker.release(*args, command["reason"])
            elif operation == "finish":
                result = worker.finish(*args)
            else:
                raise ValueError("unknown fixture command")
            pipe.send({"event": operation, "result": result})
            if operation in ("release", "finish"):
                return
    finally:
        pipe.close()


class Workers:
    def __init__(self, dsn):
        self.dsn = dsn
        self.owned = []

    @staticmethod
    def receive(pipe):
        if not pipe.poll(10):
            raise TimeoutError("worker response deadline")
        return pipe.recv()

    def start(self, job, owner, generation="compatible"):
        context = mp.get_context("spawn")
        parent, child = context.Pipe()
        process = context.Process(target=worker_process, args=(self.dsn, job, owner, generation, child))
        process.start()
        child.close()
        self.owned.append((process, parent))
        return process, parent, self.receive(parent)

    def command(self, pipe, operation, **parameters):
        pipe.send({"operation": operation, **parameters})
        response = self.receive(pipe)
        require(response["event"] == operation, "worker returned a different operation")
        return response["result"]

    @staticmethod
    def join(process, pipe, expected=0):
        process.join(10)
        require(not process.is_alive() and process.exitcode == expected,
                f"worker exit {process.exitcode}, expected {expected}")
        pipe.close()

    def close(self):
        for process, pipe in self.owned:
            if process.is_alive():
                process.kill()
            process.join(5)
            pipe.close()
        alive = sum(process.is_alive() for process, _ in self.owned)
        require(alive == 0, "worker process remains alive after cleanup")
        return {"worker_processes_started": len(self.owned), "worker_processes_alive": alive}


def add_job(dsn, job, manifest=None):
    # Fixture can also insert malformed retained input to verify quarantine.
    if manifest is None:
        manifest = [1, 2, 3, 4, 5, 6]
    with worker.transaction(dsn) as connection:
        connection.execute(
            "INSERT INTO jobs(id,manifest,input_hash,deadline) "
            "VALUES(%s,%s::jsonb,%s,clock_timestamp()+interval '30 minutes')",
            (job, json.dumps(manifest), worker.input_digest(manifest)),
        )
        connection.execute("INSERT INTO totals(job) VALUES(%s)", (job,))


def snapshot(dsn, job):
    with worker.transaction(dsn) as connection:
        row = connection.execute(
            "SELECT checkpoint,epoch,claims,maintenance_handoffs,infrastructure_interruptions,"
            "business_failures,business_budget,status,owner FROM jobs WHERE id=%s", (job,)
        ).fetchone()
        row["effect_count"] = connection.execute(
            "SELECT count(*) AS count FROM effects WHERE job=%s", (job,)
        ).fetchone()["count"]
        row["effect_total"] = connection.execute("SELECT value FROM totals WHERE job=%s", (job,)).fetchone()["value"]
        return row


def expire_lease(dsn, job, infrastructure_interruption=False):
    with worker.transaction(dsn) as connection:
        connection.execute(
            "UPDATE jobs SET lease_until=clock_timestamp()-interval '1 second',"
            "infrastructure_interruptions=infrastructure_interruptions+%s WHERE id=%s",
            (int(infrastructure_interruption), job),
        )


def completed_step(workers, pipe, step):
    require(workers.command(pipe, "effect", step=step)["accepted"], "effect was rejected")
    require(workers.command(pipe, "checkpoint", step=step), "checkpoint was rejected")


def rolling_handoffs(dsn, workers):
    add_job(dsn, "rolling")
    trace = []
    for step, owner in enumerate(("A", "B", "C")):
        process, pipe, state = workers.start("rolling", owner)
        require(state["accepted"] and state["checkpoint"] == step, "handoff lost checkpoint")
        completed_step(workers, pipe, step)
        require(workers.command(pipe, "release", reason="maintenance"), "maintenance release failed")
        workers.join(process, pipe)
        trace.append({"owner": owner, "epoch": state["epoch"], "checkpoint": step + 1})
    process, pipe, state = workers.start("rolling", "A-new")
    require(state["accepted"] and state["checkpoint"] == 3, "successor did not restore progress")
    for step in range(3, 6):
        completed_step(workers, pipe, step)
    require(workers.command(pipe, "finish"), "completion was rejected")
    workers.join(process, pipe)
    final = snapshot(dsn, "rolling")
    require(final["status"] == "completed" and final["maintenance_handoffs"] == 3
            and final["business_failures"] == 0 and final["business_budget"] == 3
            and final["effect_count"] == 6 and final["effect_total"] == 21,
            "rolling handoff changed business outcome or retry budget")
    return {"trace": trace, "final": final}


def stale_owner(dsn, workers):
    add_job(dsn, "fencing")
    old, old_pipe, old_state = workers.start("fencing", "old-A")
    expire_lease(dsn, "fencing")
    new, new_pipe, new_state = workers.start("fencing", "new-B")
    require(new_state["accepted"] and new_state["epoch"] == old_state["epoch"] + 1,
            "successor did not acquire a fresh epoch")
    require(workers.command(old_pipe, "effect", step=0) == {"accepted": False}, "stale effect accepted")
    require(workers.command(old_pipe, "checkpoint", step=0) is False, "stale checkpoint accepted")
    require(workers.command(old_pipe, "release", reason="maintenance") is False, "stale cleanup accepted")
    workers.join(old, old_pipe)
    current = snapshot(dsn, "fencing")
    require(current["owner"] == "new-B" and current["effect_count"] == 0, "old owner changed successor state")
    completed_step(workers, new_pipe, 0)
    require(workers.command(new_pipe, "release", reason="maintenance"), "successor release failed")
    workers.join(new, new_pipe)
    return {"effect_rejected": True, "checkpoint_rejected": True, "release_rejected": True,
            "successor_claim_preserved": True, "final": snapshot(dsn, "fencing")}


def effect_before_checkpoint(dsn, workers):
    add_job(dsn, "crash-gap")
    process, pipe, state = workers.start("crash-gap", "C-crashes")
    require(state["accepted"], "initial claim rejected")
    require(workers.command(pipe, "effect", step=0)["accepted"], "initial effect rejected")
    before = snapshot(dsn, "crash-gap")
    require(before["checkpoint"] == 0 and before["effect_count"] == 1, "crash seam not reached")
    process.kill()
    workers.join(process, pipe, expected=-signal.SIGKILL)
    expire_lease(dsn, "crash-gap", infrastructure_interruption=True)
    successor, successor_pipe, resumed = workers.start("crash-gap", "successor")
    require(resumed["accepted"] and resumed["checkpoint"] == 0, "recovery skipped incomplete checkpoint")
    repeated = workers.command(successor_pipe, "effect", step=0)
    require(repeated == {"accepted": True, "replayed": True, "step": 0}, "effect identity lost on resume")
    require(workers.command(successor_pipe, "checkpoint", step=0), "reconciled effect not checkpointed")
    for step in range(1, 6):
        completed_step(workers, successor_pipe, step)
    require(workers.command(successor_pipe, "finish"), "resumed completion rejected")
    workers.join(successor, successor_pipe)
    final = snapshot(dsn, "crash-gap")
    require(final["status"] == "completed" and final["effect_count"] == 6
            and final["effect_total"] == 21 and final["business_failures"] == 0
            and final["infrastructure_interruptions"] == 1, "crash recovery duplicated or lost work")
    return {"killed_exit_code": -signal.SIGKILL, "first_step_replayed": True, "final": final}


def admission_and_schema(dsn, workers):
    add_job(dsn, "gate")
    with worker.transaction(dsn) as connection:
        connection.execute("UPDATE generations SET admitted=false WHERE name='retiring'")
    for generation, reason in (("retiring", "generation-excluded"),
                               ("incompatible", "checkpoint-schema-incompatible")):
        process, pipe, state = workers.start("gate", generation, generation)
        workers.join(process, pipe)
        require(not state["accepted"] and state["reason"] == reason, f"unsafe admission for {generation}")
    final = snapshot(dsn, "gate")
    require(final["claims"] == 0 and final["effect_count"] == 0, "rejected claimant mutated work")
    return final


def poison_input(dsn, workers):
    add_job(dsn, "poison", [1, True, 3])
    for attempt in range(2):
        process, pipe, state = workers.start("poison", f"poison-{attempt}")
        workers.join(process, pipe)
        require(not state["accepted"] and state["reason"] == "quarantined", "poison input was admitted")
    final = snapshot(dsn, "poison")
    require(final["claims"] == 0 and final["effect_count"] == 0
            and final["business_failures"] == 0, "poison work was retried as business failure")
    return final


def business_budget(dsn, workers):
    add_job(dsn, "business-limit")
    for attempt in range(3):
        process, pipe, state = workers.start("business-limit", f"failure-{attempt}")
        require(state["accepted"], "budget exhausted too early")
        require(workers.command(pipe, "release", reason="confirmed-business-failure"), "failure not recorded")
        workers.join(process, pipe)
    process, pipe, state = workers.start("business-limit", "must-not-run")
    workers.join(process, pipe)
    require(not state["accepted"] and state["reason"] == "business-failed", "failure budget did not stop work")
    final = snapshot(dsn, "business-limit")
    require(final["business_failures"] == 3 and final["effect_count"] == 0, "failure accounting changed")
    return final


def job_deadline(dsn, workers):
    add_job(dsn, "deadline")
    with worker.transaction(dsn) as connection:
        connection.execute("UPDATE jobs SET deadline=clock_timestamp()-interval '1 second' WHERE id='deadline'")
    process, pipe, state = workers.start("deadline", "too-late")
    workers.join(process, pipe)
    require(not state["accepted"] and state["reason"] == "deadline-exceeded", "expired job admitted")
    final = snapshot(dsn, "deadline")
    require(final["effect_count"] == 0, "expired job changed business state")
    add_job(dsn, "active-deadline")
    process, pipe, state = workers.start("active-deadline", "expires-while-owned")
    require(state["accepted"], "active deadline fixture claim failed")
    with worker.transaction(dsn) as connection:
        connection.execute(
            "UPDATE jobs SET deadline=clock_timestamp()-interval '1 second' WHERE id='active-deadline'"
        )
    require(workers.command(pipe, "effect", step=0) == {"accepted": False}, "expired owner wrote effect")
    require(workers.command(pipe, "release", reason="maintenance") is False, "expired owner counted handoff")
    workers.join(process, pipe)
    active = snapshot(dsn, "active-deadline")
    require(active["status"] == "deadline-exceeded" and active["owner"] is None
            and active["effect_count"] == 0 and active["maintenance_handoffs"] == 0,
            "active deadline did not record terminal disposition")
    return {"before_claim": final, "during_ownership": active}


def immutable_input(dsn, _workers):
    add_job(dsn, "immutable")
    try:
        with worker.transaction(dsn) as connection:
            connection.execute("UPDATE jobs SET manifest='[9]'::jsonb WHERE id='immutable'")
    except psycopg.errors.CheckViolation:
        return {"changed_manifest_rejected": True}
    raise AssertionError("checkpoint input was mutable")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, help="Write the JSON evidence to this file as well as stdout")
    parser.add_argument("--timeout", type=int, default=300, help="Whole-verifier deadline in seconds")
    args = parser.parse_args()
    if args.timeout < 1 or os.name != "posix":
        parser.error("requires a positive deadline and a POSIX host for SIGKILL verification")
    fixture = DatabaseFixture()
    workers = None
    report = {"example": "durable-job-handoff", "status": "failed", "image": IMAGE,
              "invocation": {"timeout_seconds": args.timeout},
              "checks": [], "limitations": LIMITS, "source_sha256": {
                  name: hashlib.sha256((HERE / name).read_bytes()).hexdigest()
                  for name in ("verify.py", "worker.py", "schema.sql", "requirements.txt", "README.md")}}

    def interrupted(signum, _frame):
        if signum == signal.SIGALRM:
            raise TimeoutError("whole-verifier deadline exceeded")
        raise KeyboardInterrupt("verifier interrupted")

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGALRM, interrupted)
    signal.alarm(args.timeout)
    cleanup_errors = []
    try:
        fixture.start()
        with worker.transaction(fixture.dsn) as connection:
            report["versions"] = {"postgres": connection.execute("SHOW server_version").fetchone()["server_version"],
                                  "psycopg": psycopg.__version__, "python": sys.version.split()[0],
                                  "fsync": connection.execute("SHOW fsync").fetchone()["fsync"],
                                  "synchronous_commit": connection.execute("SHOW synchronous_commit").fetchone()["synchronous_commit"]}
        workers = Workers(fixture.dsn)
        for scenario in (rolling_handoffs, stale_owner, effect_before_checkpoint, admission_and_schema,
                         poison_input, business_budget, job_deadline, immutable_input):
            check = {"name": scenario.__name__, "status": "running"}
            report["checks"].append(check)
            check["evidence"] = scenario(fixture.dsn, workers)
            check["status"] = "passed"
        with worker.transaction(fixture.dsn) as connection:
            remaining = connection.execute(
                "SELECT count(*) AS count FROM pg_stat_activity "
                "WHERE application_name=%s AND pid<>pg_backend_pid()", (worker.APPLICATION_NAME,)
            ).fetchone()["count"]
        require(remaining == 0, "probe database sessions remain")
        report["resources"] = {"remaining_database_sessions": remaining}
        report["status"] = "passed"
    except (Exception, KeyboardInterrupt) as exc:
        report["error"] = {"type": type(exc).__name__, "message": str(exc).replace(fixture.password, "[redacted]")}
        if report["checks"] and report["checks"][-1]["status"] == "running":
            report["checks"][-1]["status"] = "failed"
    finally:
        signal.alarm(0)
        if workers:
            try:
                report.setdefault("resources", {}).update(workers.close())
            except Exception as exc:
                cleanup_errors.append(type(exc).__name__)
        try:
            report.setdefault("resources", {}).update(fixture.close())
        except Exception as exc:
            cleanup_errors.append(type(exc).__name__)
        if cleanup_errors:
            report["status"] = "failed"
            report["cleanup_errors"] = cleanup_errors
        report["completed_at"] = datetime.now(timezone.utc).isoformat()
        encoded = json.dumps(report, indent=2) + "\n"
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(encoded)
        print(encoded, end="")
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
