"""Run worker rollout boundaries against an owned, disposable PostgreSQL fixture."""
from __future__ import annotations
import argparse
import errno
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import secrets
import select
import signal
import socket
import subprocess
import sys
import tempfile
import time
import uuid
import psycopg
import protocol

HERE = Path(__file__).resolve().parent
IMAGE = "postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873"
SOURCE_FILES = ("verify.py", "runtime.py", "protocol.py", "worker_v1.py", "worker_v2.py",
                "worker_incompatible.py", "schema.sql", "requirements.txt", "README.md", "sources.md")
LIMITS = [
    "Bounded slices represent 12/24-hour jobs; no endurance, Kubernetes, scheduler, or orchestrator test.",
    "Effects, receipts, checkpoints and epoch fencing share one PostgreSQL database; no external provider or broker guarantee.",
    "v1/v2 are distinct entrypoints with differing input interpreters over a shared runtime/protocol, not independently released production binaries.",
    "Ownership uses a two-second fixture lease without renewal; only the budget scenario waits for natural expiry. Other expiry schedules are fixture mutations.",
    "The first-SIGTERM monotonic budget stops new slices and bounds cooperative waits. SQL has per-statement/lock bounds; this is not a strict cumulative transaction or commit deadline.",
    "Persisted job deadlines reject decisions after database-time expiry; effects admitted before expiry can commit afterward.",
    "Admission ordering covers committed-before-local-publication and post-gate-close rejection; no exhaustive concurrent admission stress test.",
    "PostgreSQL tmpfs has fsync and synchronous_commit on, but no power-loss, restore, partition, database crash or failover evidence.",
    "Prefetch is a leased local database reservation, not a broker delivery/redelivery budget. Control barriers run outside protected transactions.",
]


def require(value, message):
    if not value:
        raise AssertionError(message)


def docker(*args, env=None, check=True):
    result = subprocess.run(["docker", *args], text=True, capture_output=True, timeout=45, env=env)
    if check and result.returncode:
        raise RuntimeError(f"docker {args[0]} failed: {result.stderr.strip()}")
    return result


def socket_closed(port):
    try:
        with socket.create_connection(("127.0.0.1", port), timeout=0.2):
            return False
    except OSError as error:
        if error.errno == errno.ECONNREFUSED:
            return True
        raise


class DatabaseFixture:
    def __init__(self):
        self.run_id = uuid.uuid4().hex
        self.name = f"tal-worker-rollout-{self.run_id[:12]}"
        self.password = secrets.token_urlsafe(24)
        self.dsn, self.port, self.attempted = None, None, False

    def start(self):
        server = docker("version", "--format", "{{.Server.Version}}").stdout.strip()
        require(int(server.split(".", 1)[0]) >= 28, "Docker 28+ required for documented loopback isolation")
        self.attempted = True
        docker("run", "--detach", "--name", self.name,
               "--label", "tal-skills.fixture=worker-rollout", "--label", f"tal-skills.run={self.run_id}",
               "--publish", "127.0.0.1::5432", "--tmpfs", "/var/lib/postgresql:rw", "--memory", "512m",
               "--env", "POSTGRES_PASSWORD", "--env", "POSTGRES_DB=worker_rollout", IMAGE,
               env=os.environ | {"POSTGRES_PASSWORD": self.password})
        until = time.monotonic() + 45
        while docker("exec", self.name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres", "-d", "worker_rollout", check=False).returncode:
            require(time.monotonic() < until, "database readiness deadline")
            time.sleep(0.1)
        binding = docker("port", self.name, "5432/tcp").stdout.strip()
        require(binding.startswith("127.0.0.1:"), "database is not loopback-only")
        self.port = int(binding.rsplit(":", 1)[1])
        self.dsn = f"postgresql://postgres:{self.password}@127.0.0.1:{self.port}/worker_rollout?sslmode=disable"
        self.session = protocol.Session(self.dsn)
        with self.session.transaction() as connection:
            connection.execute((HERE / "schema.sql").read_text())
        return self.session

    def close(self):
        if hasattr(self, "session"):
            self.session.close()
        if not self.attempted:
            return {"container_removed": True}
        names = docker("container", "ls", "-a", "--filter", f"name=^/{self.name}$", "--format", "{{.Names}}").stdout.splitlines()
        if names:
            labels = json.loads(docker("inspect", "--format", "{{json .Config.Labels}}", self.name).stdout)
            require(labels.get("tal-skills.fixture") == "worker-rollout" and labels.get("tal-skills.run") == self.run_id,
                    "refusing removal without this run's ownership labels")
            docker("rm", "--force", "--volumes", self.name)
        remaining = docker("container", "ls", "-a", "--filter", f"label=tal-skills.run={self.run_id}", "--format", "{{.Names}}").stdout.strip()
        require(not remaining, "owned container leaked")
        require(self.port is None or socket_closed(self.port), "database loopback port remains open")
        return {"container_removed": True, "database_port_closed": True, "owned_containers_remaining": 0,
                "observer_database_connection_closed": True}


class Worker:
    def __init__(self, dsn, version, owner, generation, *, policy="protected", budget=1):
        self.error_stream = tempfile.TemporaryFile()
        args = [sys.executable, str(HERE / f"worker_{version}.py"), "--owner", owner,
                "--generation", generation, "--policy", policy, "--drain-budget", str(budget)]
        self.process = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        stderr=self.error_stream, start_new_session=True,
                                        env={"PATH": os.environ.get("PATH", ""), "WORKER_ROLLOUT_DSN": dsn,
                                             "PYTHONUNBUFFERED": "1", "PYTHONDONTWRITEBYTECODE": "1"})
        self.buffer, self.pending, self.events = b"", [], []
        self.closed, self.port, self.version, self.budget = False, None, version, budget
        ready = self.receive("ready")
        require(ready["host"] == "127.0.0.1" and ready["version"] == version, "wrong worker or health binding")
        self.port = ready["port"]
        self.ready = ready

    def send(self, operation, **data):
        require(self.process.poll() is None, "worker already exited")
        self.process.stdin.write((json.dumps({"operation": operation, **data}) + "\n").encode())
        self.process.stdin.flush()

    def receive(self, event, timeout=10):
        until = time.monotonic() + timeout
        while True:
            while self.pending:
                message = self.pending.pop(0)
                self.events.append(message)
                if message["event"] == "error":
                    raise RuntimeError(f"worker error: {message}")
                if message["event"] == event:
                    return message
            remaining = until - time.monotonic()
            if remaining <= 0:
                raise TimeoutError(f"worker event deadline: {event}")
            readable, _, _ = select.select([self.process.stdout], [], [], remaining)
            if not readable:
                continue
            chunk = os.read(self.process.stdout.fileno(), 4096)
            if not chunk:
                self.error_stream.seek(0)
                raise RuntimeError(f"worker exited before {event}: {self.error_stream.read().decode()[-2000:]}")
            self.buffer += chunk
            while b"\n" in self.buffer:
                line, self.buffer = self.buffer.split(b"\n", 1)
                self.pending.append(json.loads(line))

    def claim(self, job, **options):
        self.send("reserve", job=job, **options)
        return self.receive("claim")

    def readiness(self):
        with socket.create_connection(("127.0.0.1", self.port), timeout=0.5) as client:
            client.settimeout(0.5)
            client.sendall(b"GET /ready HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n")
            result = client.recv(1024).decode()
            return int(result.split(" ", 2)[1])

    def signum(self, number):
        require(self.process.poll() is None, "cannot signal an exited owned process")
        os.killpg(self.process.pid, number)

    def join(self, expected=0, timeout=3):
        try:
            code = self.process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            self.signum(signal.SIGKILL)
            self.process.wait(timeout=3)
            raise AssertionError("owned worker exceeded termination bound; escalated to SIGKILL")
        require(code == expected, f"worker exit {code}, expected {expected}")
        self.close_streams()
        require(socket_closed(self.port), "worker readiness listener leaked")
        return {"pid": self.process.pid, "exit_code": code, "listener_closed": True, "control_streams_closed": True}

    def stop(self):
        self.send("stop")
        self.receive("stopped")
        return self.join()

    def close_streams(self):
        for stream in (self.process.stdin, self.process.stdout, self.error_stream):
            stream.close()
        self.closed = True


class Workers:
    def __init__(self, dsn):
        self.dsn, self.owned = dsn, []

    def start(self, version, owner, generation, **options):
        # Register before waiting on readiness so partial startup is still owned.
        worker = Worker.__new__(Worker)
        self.owned.append(worker)
        worker.__init__(self.dsn, version, owner, generation, **options)
        return worker

    def close(self):
        failures = []
        for worker in self.owned:
            if hasattr(worker, "process"):
                if worker.process.poll() is None:
                    worker.signum(signal.SIGKILL)
                worker.process.wait(timeout=3)
                if not getattr(worker, "closed", False):
                    worker.close_streams()
                if worker.port is not None and not socket_closed(worker.port):
                    failures.append(worker.port)
            elif hasattr(worker, "error_stream"):
                worker.error_stream.close()
        require(not failures, "owned worker sockets remain open")
        alive = sum(worker.process.poll() is None for worker in self.owned if hasattr(worker, "process"))
        require(alive == 0, "owned worker process leaked")
        return {"worker_processes_started": len(self.owned), "worker_processes_alive": alive,
                "worker_listeners_open": len(failures), "worker_control_streams_open": 0,
                "owned_worker_pids": [worker.process.pid for worker in self.owned if hasattr(worker, "process")],
                "owned_worker_listener_ports": [worker.port for worker in self.owned if getattr(worker, "port", None) is not None]}


def generation(session, name):
    with session.transaction() as connection:
        connection.execute("INSERT INTO generations VALUES(%s,true) ON CONFLICT DO NOTHING", (name,))


def add_job(session, job, manifest=None, version=1):
    if manifest is None:
        manifest = [1, 2, 3, 4, 5, 6]
    with session.transaction() as connection:
        connection.execute(
            "INSERT INTO jobs(id,manifest,input_hash,input_schema,checkpoint_schema,semantics,deadline) "
            "VALUES(%s,%s::jsonb,%s,%s,%s,%s,clock_timestamp()+interval '24 hours')",
            (job, json.dumps(manifest), protocol.input_digest(manifest), version, version, f"sum-v{version}"),
        )
        connection.execute("INSERT INTO totals(job) VALUES(%s)", (job,))


def snapshot(session, job):
    with session.transaction() as connection:
        row = connection.execute("SELECT * FROM jobs WHERE id=%s", (job,)).fetchone()
        for field in ("deadline", "lease_until", "completed_at"):
            if row[field] is not None:
                row[field] = row[field].isoformat()
        row["receipts"] = connection.execute("SELECT step,amount,input_hash FROM receipts WHERE job=%s ORDER BY step", (job,)).fetchall()
        row["total"] = connection.execute("SELECT value FROM totals WHERE job=%s", (job,)).fetchone()["value"]
        return row


def exact_progress(row, cursor, *, completed=False):
    values = protocol.amounts(row)
    expected = [{"step": i, "amount": value, "input_hash": row["input_hash"]} for i, value in enumerate(values[:cursor])]
    require(row["checkpoint"] == cursor and row["receipts"] == expected and row["total"] == sum(values[:cursor]), "exact logical progress/receipt reconciliation failed")
    if completed:
        require(row["status"] == "completed" and row["owner"] is None and row["completed_at"] is not None, "useful completion not persisted")


def run_to_completion(worker, job, claim):
    require(claim["accepted"], "successor claim rejected")
    replayed = []
    if claim["checkpoint"] == len(claim["manifest"]):
        require(worker.receive("completion")["result"]["accepted"], "checkpoint-complete resume did not finalize")
        return replayed
    for step in range(claim["checkpoint"], len(claim["manifest"])):
        worker.send("slice", job=job, seconds=0.015)
        effect = worker.receive("effect")["result"]
        require(effect["accepted"], "successor effect rejected")
        if effect["replayed"]:
            replayed.append(step)
        progress = worker.receive("checkpoint")["result"]
        require(progress["accepted"] and progress["checkpoint"] == step + 1, "successor checkpoint rejected")
        if step == len(claim["manifest"]) - 1:
            require(worker.receive("completion")["result"]["accepted"], "durable completion rejected")
        worker.receive("slice_done")
    return replayed


def post_gate_rejection(session, workers, generation_name, job):
    before = snapshot(session, job)
    probe = workers.start("v1", f"probe-{generation_name}", generation_name)
    rejected = probe.claim(job)
    require(not rejected["accepted"] and rejected["reason"] == "generation-excluded", "retiring generation admitted work after closure")
    probe.stop()
    require(snapshot(session, job) == before, "post-close claimant changed job state")
    return rejected["reason"]


def retire(session, workers, name, job, side, step, policy):
    generation(session, name)
    old = workers.start("v1", name, name, policy=policy, budget=1)
    require(old.readiness() == 200, "healthy worker was not ready")
    state = old.claim(job)
    require(state["accepted"] and state["checkpoint"] == step, "retirement lost retained checkpoint")
    prefetch = old.claim(side)
    require(prefetch["accepted"], "side job was not genuinely prefetched")
    before = snapshot(session, side)
    require(before["owner"] == name and before["checkpoint"] == 0 and not before["receipts"], "prefetch was not durably owned and unstarted")
    old.send("slice", job=job, seconds=0.35)
    old.receive("slice_started")
    old.signum(signal.SIGTERM)
    draining = old.receive("drain_started")
    require({(item["job"], item["kind"]) for item in draining["inventory"]} == {(job, "active"), (side, "prefetched")}, "retirement inventory omitted active or prefetched work")
    require(old.readiness() == 503, "SIGTERM did not stop readiness while active work remained")
    rejection = old.claim("must-not-be-admitted")
    require(not rejection["accepted"] and rejection["reason"] == "local-admission-closed", "SIGTERM accepted new local work")
    old.signum(signal.SIGTERM)
    old.send("status")
    status = old.receive("status")
    require(status["signal_count"] == 2 and status["drain_deadline_monotonic"] == draining["drain_deadline_monotonic"], "second SIGTERM extended the drain budget")
    old.receive("slice_done")
    shutdown = old.receive("shutdown")
    require(shutdown["reason"] == "current-slice-finished", "bounded current slice did not finish")
    require(all(item["disposition"] == "released" and item["result"]["accepted"] for item in shutdown["dispositions"]), "worker did not release its entire retirement inventory")
    require(shutdown["drain_elapsed_seconds"] <= old.budget + 0.2, "observed local retirement exceeded budget plus scheduling margin")
    joined = old.join(timeout=old.budget + 0.2)
    exact_progress(snapshot(session, job), step + 1)
    exact_progress(snapshot(session, side), 0)
    rejected = post_gate_rejection(session, workers, name, job)
    return {"worker_version": "v1", "checkpoint": step + 1, "inventory": draining["inventory"],
            "readiness_before_after": [200, 503], "post_gate_rejection": rejected,
            "shutdown": shutdown, "process": joined}


def rollout(session, workers, policy):
    main = f"{policy}-main"
    add_job(session, main)
    deadline = snapshot(session, main)["deadline"]
    trace, sides = [], []
    for step, label in enumerate(("A", "B", "C")):
        side = f"{policy}-prefetch-{label}"
        add_job(session, side, [7])
        sides.append(side)
        trace.append(retire(session, workers, f"{policy}-{label}", main, side, step, policy))
    before = snapshot(session, main)
    require(before["deadline"] == deadline and before["checkpoint"] == 3, "deployment changed logical deadline or progress")
    generation(session, f"{policy}-successor")
    new = workers.start("v2", f"{policy}-A-new", f"{policy}-successor")
    successor = new.claim(main)
    if policy == "harmful":
        require(not successor["accepted"] and successor["reason"] == "business-failed", "harmful baseline did not burn retry budget")
        require(before["business_failures"] == before["business_budget"] == 3 and before["completed_at"] is None, "baseline failure accounting is not durable")
        new.stop()
        return {"operational_retirements": trace, "useful_completion": False, "successor_rejected": successor["reason"], "final": before}
    require(before["business_failures"] == 0 and before["maintenance_handoffs"] == 3, "deployment consumed business failure budget")
    run_to_completion(new, main, successor)
    for side in sides:
        run_to_completion(new, side, new.claim(side))
    new.stop()
    final = snapshot(session, main)
    exact_progress(final, 6, completed=True)
    require(final["deadline"] == deadline and final["business_failures"] == 0, "compatible successor changed job deadline or failure accounting")
    side_results = [snapshot(session, side) for side in sides]
    for row in side_results:
        exact_progress(row, 1, completed=True)
        require(row["business_failures"] == 0 and row["maintenance_handoffs"] == 1, "prefetch retirement lost ownership accounting")
    return {"operational_retirements": trace, "useful_completion": True, "successor_version": "v2", "final": final, "prefetched_jobs": side_results}


def admission_publication_race(session, workers):
    add_job(session, "admission-race", [5])
    generation(session, "race-old")
    old = workers.start("v1", "race-old", "race-old", budget=3)
    old.send("reserve", job="admission-race", pause_before_publish=True)
    old.receive("claim_committed")
    old.receive("before_claim_publish")
    require(snapshot(session, "admission-race")["claims"] == 1, "claim was not committed before signal")
    old.signum(signal.SIGTERM)
    drained = old.receive("drain_started")
    require(drained["reconciled_committed_claims"] == ["admission-race"], "retirement relied on a local prefetch list")
    require(old.readiness() == 503, "closed admission remained ready")
    rejected = post_gate_rejection(session, workers, "race-old", "admission-race")
    old.send("continue")
    old.receive("claim")
    shutdown = old.receive("shutdown")
    old.join()
    row = snapshot(session, "admission-race")
    require(row["owner"] is None and row["business_failures"] == 0 and row["maintenance_handoffs"] == 1, "accepted-before-close work was not accounted for")
    generation(session, "race-new")
    new = workers.start("v2", "race-new", "race-new")
    run_to_completion(new, "admission-race", new.claim("admission-race"))
    new.stop()
    exact_progress(snapshot(session, "admission-race"), 1, completed=True)
    return {"committed_claim_reconciled": drained, "post_gate_rejection": rejected, "shutdown": shutdown}


def receipt_gap(session, workers):
    add_job(session, "receipt-gap")
    generation(session, "gap-old")
    old = workers.start("v1", "gap-old", "gap-old")
    require(old.claim("receipt-gap")["accepted"], "gap claim rejected")
    old.send("slice", job="receipt-gap", seconds=0, pause_after_effect=True)
    require(old.receive("effect")["result"]["accepted"], "effect did not commit")
    old.receive("after_effect")
    before = snapshot(session, "receipt-gap")
    require(before["checkpoint"] == 0 and before["receipts"] == [{"step": 0, "amount": 1, "input_hash": before["input_hash"]}] and before["total"] == 1, "committed-effect/checkpoint gap not selected")
    old.signum(signal.SIGKILL)
    joined = old.join(expected=-signal.SIGKILL)
    with session.transaction() as connection:
        connection.execute("UPDATE jobs SET lease_until=clock_timestamp()-interval '1 second',infrastructure_interruptions=infrastructure_interruptions+1 WHERE id='receipt-gap'")
    generation(session, "gap-new")
    new = workers.start("v2", "gap-new", "gap-new")
    replayed = run_to_completion(new, "receipt-gap", new.claim("receipt-gap"))
    new.stop()
    final = snapshot(session, "receipt-gap")
    exact_progress(final, 6, completed=True)
    require(replayed == [0] and final["business_failures"] == 0 and final["infrastructure_interruptions"] == 1, "receipt recovery duplicated effects or consumed business budget")
    return {"selected_boundary": before, "killed_process": joined, "v2_receipt_replays": replayed, "final": final}


def stale_owner(session, workers):
    add_job(session, "stale-owner", [2, 3])
    generation(session, "stale-old")
    old = workers.start("v1", "stale-old", "stale-old")
    initial = old.claim("stale-owner")
    old.send("slice", job="stale-owner", seconds=0, pause_before_effect=True)
    old.receive("before_effect")
    old.signum(signal.SIGSTOP)
    with session.transaction() as connection:
        connection.execute("UPDATE jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id='stale-owner'")
    generation(session, "stale-new")
    new = workers.start("v2", "stale-new", "stale-new")
    takeover = new.claim("stale-owner")
    require(takeover["accepted"] and takeover["epoch"] == initial["epoch"] + 1, "takeover epoch not advanced")
    before = snapshot(session, "stale-owner")
    old.send("continue")
    old.signum(signal.SIGCONT)
    result = old.receive("effect")["result"]
    require(not result["accepted"], "resumed old owner changed protected effect")
    old.receive("slice_done")
    rejected = {"effect": result}
    for mutation in ("checkpoint", "release"):
        old.send("mutate", job="stale-owner", mutation=mutation)
        result = old.receive("mutation")["result"]
        require(not result["accepted"], f"stale {mutation} accepted")
        rejected[mutation] = result
        require(snapshot(session, "stale-owner") == before, "stale mutation changed successor ownership or durable state")
    old.stop()
    run_to_completion(new, "stale-owner", takeover)
    new.stop()
    final = snapshot(session, "stale-owner")
    exact_progress(final, 2, completed=True)
    return {"signals": ["SIGSTOP", "SIGCONT"], "takeover_snapshot": before, "rejected": rejected, "final": final}


def checkpoint_before_completion(session, workers):
    add_job(session, "completion-gap", [4])
    generation(session, "completion-old")
    old = workers.start("v1", "completion-old", "completion-old")
    require(old.claim("completion-gap")["accepted"], "completion seam claim rejected")
    old.send("slice", job="completion-gap", seconds=0, pause_after_final_checkpoint=True)
    old.receive("checkpoint")
    old.receive("after_final_checkpoint")
    before = snapshot(session, "completion-gap")
    exact_progress(before, 1)
    require(before["status"] == "pending" and before["completed_at"] is None, "final checkpoint/finish seam not selected")
    old.signum(signal.SIGKILL)
    killed = old.join(expected=-signal.SIGKILL)
    with session.transaction() as connection:
        connection.execute("UPDATE jobs SET lease_until=clock_timestamp()-interval '1 second',infrastructure_interruptions=infrastructure_interruptions+1 WHERE id='completion-gap'")
    generation(session, "completion-new")
    new = workers.start("v2", "completion-new", "completion-new")
    resumed = new.claim("completion-gap")
    require(resumed["checkpoint"] == len(resumed["manifest"]), "complete cursor was not retained")
    run_to_completion(new, "completion-gap", resumed)
    new.stop()
    final = snapshot(session, "completion-gap")
    exact_progress(final, 1, completed=True)
    return {"selected_boundary": before, "killed_process": killed, "finalized_without_new_effect": True, "final": final}


def compatibility(session, workers):
    add_job(session, "retained-v1", [4, 6])
    generation(session, "compat-old")
    old = workers.start("v1", "compat-old", "compat-old")
    require(old.claim("retained-v1")["accepted"], "old version rejected its input")
    old.send("slice", job="retained-v1", seconds=0.35)
    old.receive("slice_started")
    old.signum(signal.SIGTERM)
    old.receive("drain_started")
    old.receive("shutdown")
    old.join()
    before = snapshot(session, "retained-v1")
    generation(session, "compat-candidate")
    incompatible = workers.start("incompatible", "compat-candidate", "compat-candidate")
    rejection = incompatible.claim("retained-v1")
    require(not rejection["accepted"] and rejection["reason"] == "input-checkpoint-incompatible", "incompatible successor was admitted")
    incompatible.stop()
    require(snapshot(session, "retained-v1") == before, "incompatible successor mutated retained job")
    generation(session, "compat-new")
    new = workers.start("v2", "compat-new", "compat-new")
    resumed = new.claim("retained-v1")
    require(resumed["checkpoint"] == 1 and resumed["input_schema"] == resumed["checkpoint_schema"] == 1, "new version silently migrated retained interpretation")
    run_to_completion(new, "retained-v1", resumed)
    add_job(session, "structured-v2", [{"amount": 5}, {"amount": 7}], version=2)
    run_to_completion(new, "structured-v2", new.claim("structured-v2"))
    new.stop()
    for job in ("retained-v1", "structured-v2"):
        exact_progress(snapshot(session, job), 2, completed=True)
    immutable = []
    for field, sql in (("manifest", "manifest='[8,9]'::jsonb"), ("checkpoint_schema", "checkpoint_schema=2"), ("semantics", "semantics='sum-v2'")):
        try:
            with session.transaction() as connection:
                connection.execute(f"UPDATE jobs SET {sql} WHERE id='retained-v1'")
        except psycopg.errors.CheckViolation:
            immutable.append(field)
        else:
            raise AssertionError("retained interpretation was mutable")
    return {"old_version": old.ready, "new_version": new.ready, "incompatible_rejection": rejection["reason"],
            "incompatible_preserved": before, "immutable_fields_rejected": immutable,
            "retained_v1": snapshot(session, "retained-v1"), "new_v2": snapshot(session, "structured-v2")}


def deadlines_and_budget(session, workers):
    add_job(session, "expired-before-claim", [3])
    generation(session, "deadline-before")
    with session.transaction() as connection:
        connection.execute("UPDATE jobs SET deadline=clock_timestamp()-interval '1 second' WHERE id='expired-before-claim'")
    before = workers.start("v1", "deadline-before", "deadline-before")
    rejection = before.claim("expired-before-claim")
    require(not rejection["accepted"] and rejection["reason"] == "deadline-exceeded", "expired job admitted")
    before.stop()
    add_job(session, "expires-during-drain", [4])
    generation(session, "deadline-active")
    active = workers.start("v1", "deadline-active", "deadline-active", budget=2)
    require(active.claim("expires-during-drain")["accepted"], "active deadline claim rejected")
    active.send("slice", job="expires-during-drain", seconds=0, pause_before_effect=True)
    active.receive("before_effect")
    active.signum(signal.SIGTERM)
    active.receive("drain_started")
    with session.transaction() as connection:
        connection.execute("UPDATE jobs SET deadline=clock_timestamp()-interval '1 second' WHERE id='expires-during-drain'")
    active.send("continue")
    require(active.receive("effect")["result"]["reason"] == "deadline-exceeded", "expired active owner wrote effect")
    disposition = active.receive("shutdown")
    active.join()
    require(disposition["dispositions"][0]["disposition"] == "deadline-exceeded", "terminal expiry was mislabeled useful completion")
    for job in ("expired-before-claim", "expires-during-drain"):
        row = snapshot(session, job)
        require(row["status"] == "deadline-exceeded" and row["owner"] is None and row["business_failures"] == 0 and row["completed_at"] is None, "deadline disposition is not durable")
        exact_progress(row, 0)
    add_job(session, "budget-recovery", [8, 9])
    durable_deadline = snapshot(session, "budget-recovery")["deadline"]
    generation(session, "budget-old")
    slow = workers.start("v2", "budget-old", "budget-old", budget=0.2)
    require(slow.claim("budget-recovery")["accepted"], "budget fixture claim rejected")
    slow.send("slice", job="budget-recovery", seconds=2)
    slow.receive("slice_started")
    slow.signum(signal.SIGTERM)
    started = slow.receive("drain_started")
    slow.signum(signal.SIGTERM)
    slow.send("status")
    status = slow.receive("status")
    require(status["drain_deadline_monotonic"] == started["drain_deadline_monotonic"], "repeat signal extended short drain budget")
    exhausted = slow.receive("shutdown")
    require(exhausted["reason"] == "drain-budget-exhausted" and exhausted["drain_elapsed_seconds"] <= 0.4, "monotonic budget did not stop bounded work")
    require(exhausted["dispositions"][0]["disposition"] == "lease-recovery-required", "budget exhaustion silently performed unbounded release")
    slow.join(timeout=0.4)
    pending = snapshot(session, "budget-recovery")
    exact_progress(pending, 0)
    require(pending["status"] == "pending" and pending["deadline"] == durable_deadline and pending["business_failures"] == 0, "local drain deadline became a business deadline/failure")
    generation(session, "budget-new")
    new = workers.start("v2", "budget-new", "budget-new")
    until, waits = time.monotonic() + 5, 0
    while True:
        resumed = new.claim("budget-recovery")
        if resumed["accepted"]:
            break
        require(resumed["reason"] == "leased" and time.monotonic() < until, "natural lease recovery did not converge")
        waits += 1
        time.sleep(0.05)
    run_to_completion(new, "budget-recovery", resumed)
    new.stop()
    final = snapshot(session, "budget-recovery")
    exact_progress(final, 2, completed=True)
    require(final["deadline"] == durable_deadline and final["business_failures"] == 0, "budget recovery changed durable job intent")
    return {"expired_before_claim": snapshot(session, "expired-before-claim"),
            "expired_during_drain": snapshot(session, "expires-during-drain"), "expiry_shutdown": disposition,
            "monotonic_budget_shutdown": exhausted, "pending_after_budget": pending,
            "natural_lease_rejections": waits, "budget_recovery_completed": final}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--timeout", type=int, default=300)
    args = parser.parse_args()
    if os.name != "posix" or not 1 <= args.timeout <= 600:
        parser.error("POSIX required; timeout must be between one and 600 seconds")
    fixture = DatabaseFixture()
    workers = None
    report = {"example": "worker-rollout", "status": "failed", "image": IMAGE,
              "invocation": {"timeout_seconds": args.timeout}, "checks": [], "limitations": LIMITS,
              "source_sha256": {name: hashlib.sha256((HERE / name).read_bytes()).hexdigest() for name in SOURCE_FILES}}

    def interrupted(number, _frame):
        if number == signal.SIGALRM:
            raise TimeoutError("whole-verifier deadline")
        raise KeyboardInterrupt("verifier interrupted")

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGALRM, interrupted)
    signal.alarm(args.timeout)
    cleanup_errors = []
    try:
        session = fixture.start()
        workers = Workers(fixture.dsn)
        with session.transaction() as connection:
            report["versions"] = {"postgres": connection.execute("SHOW server_version").fetchone()["server_version"],
                                  "python": sys.version.split()[0], "psycopg": psycopg.__version__,
                                  "fsync": connection.execute("SHOW fsync").fetchone()["fsync"],
                                  "synchronous_commit": connection.execute("SHOW synchronous_commit").fetchone()["synchronous_commit"]}
        report["fixture"] = {"run_id": fixture.run_id, "container_name": fixture.name,
                             "binding": "127.0.0.1", "storage": "tmpfs", "lease_seconds": protocol.LEASE_SECONDS,
                             "docker_server": docker("version", "--format", "{{.Server.Version}}").stdout.strip(),
                             "observed_image_digests": json.loads(docker("image", "inspect", IMAGE, "--format", "{{json .RepoDigests}}").stdout)}
        scenarios = [("harmful_retry_budget_baseline", lambda: rollout(session, workers, "harmful")),
                     ("protected_three_retirements", lambda: rollout(session, workers, "protected")),
                     ("admission_publication_race", lambda: admission_publication_race(session, workers)),
                     ("committed_effect_before_checkpoint", lambda: receipt_gap(session, workers)),
                     ("final_checkpoint_before_completion", lambda: checkpoint_before_completion(session, workers)),
                     ("paused_old_owner_after_takeover", lambda: stale_owner(session, workers)),
                     ("old_new_compatibility", lambda: compatibility(session, workers)),
                     ("durable_deadlines_and_local_budget", lambda: deadlines_and_budget(session, workers))]
        for name, scenario in scenarios:
            check = {"name": name, "status": "running"}
            report["checks"].append(check)
            check["evidence"] = scenario()
            check["status"] = "passed"
        with session.transaction() as connection:
            count = connection.execute("SELECT count(*) AS count FROM pg_stat_activity WHERE application_name=%s AND pid<>pg_backend_pid()", (protocol.APPLICATION_NAME,)).fetchone()["count"]
        require(count == 0, "worker PostgreSQL sessions leaked")
        report["resources"] = {"remaining_worker_database_sessions": count, "remaining_database_sessions": count,
                               "database_session_probe_excludes_live_observer": True}
        report["status"] = "passed"
    except (Exception, KeyboardInterrupt) as error:
        report["error"] = {"type": type(error).__name__, "message": str(error).replace(fixture.password, "[redacted]")}
        if report["checks"] and report["checks"][-1]["status"] == "running":
            report["checks"][-1]["status"] = "failed"
    finally:
        signal.alarm(0)
        if workers:
            try:
                report.setdefault("resources", {}).update(workers.close())
            except Exception as error:
                cleanup_errors.append(type(error).__name__)
        if hasattr(fixture, "session"):
            try:
                with fixture.session.transaction() as connection:
                    count = connection.execute("SELECT count(*) AS count FROM pg_stat_activity WHERE application_name=%s AND pid<>pg_backend_pid()", (protocol.APPLICATION_NAME,)).fetchone()["count"]
                require(count == 0, "worker database session remains after process cleanup")
                report.setdefault("resources", {}).update({"remaining_worker_database_sessions": count,
                                                            "remaining_database_sessions": count,
                                                            "database_session_probe_excludes_live_observer": True})
            except Exception as error:
                cleanup_errors.append(type(error).__name__)
        try:
            report.setdefault("resources", {}).update(fixture.close())
        except Exception as error:
            cleanup_errors.append(type(error).__name__)
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
