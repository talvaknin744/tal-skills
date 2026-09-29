#!/usr/bin/env python3
"""Execute a synthetic PostgreSQL logical-recovery acceptance rehearsal."""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import platform
import secrets
import subprocess
import sys
import tempfile
import time


IMAGE = "postgres@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873"
LIMITS = [
    "Logical pg_dump/pg_restore only; no physical backup, pg_verifybackup, PITR, WAL-chain, or failover test.",
    "Synthetic tiny tmpfs data; measured duration is not a production RTO or durable-storage benchmark.",
    "Source loss is simulated; the source remains available to measure acknowledged writes.",
    "Authenticated SQL is exercised; HTTP admission, connection pools, KMS, external objects/effects, caches, and fencing are not.",
    "Interrupted restoration deliberately separates pre-data and non-atomic data sections; single-transaction recovery is not exercised.",
    "Acknowledgment gap is measured at the client, not the server commit clock; one missing operation is known in this fixture.",
]


def utc_now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


class Rehearsal:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.run_id = secrets.token_hex(8)
        self.label = f"tal-skills.recovery-run={self.run_id}"
        self.password = secrets.token_hex(24)
        self.app_password = secrets.token_hex(24)
        self.system_id = f"recovery-{self.run_id}"
        self.source = f"tal-recovery-source-{self.run_id}"
        self.target = f"tal-recovery-target-{self.run_id}"
        self.processes = []
        self.docker_available = False
        self.report = {
            "schema_version": 1,
            "kind": "executed_logical_restore_rehearsal",
            "status": "running",
            "started_at": utc_now(),
            "image": IMAGE,
            "isolation": "Disposable containers; no published ports; network=none; tmpfs data; generated credentials; synthetic records.",
            "commands": [],
            "scenarios": [],
            "limitations": LIMITS,
        }

    def clean(self, value):
        return str(value).replace(self.password, "<admin-password>").replace(
            self.app_password, "<application-password>"
        )

    def call(self, args, data=None, check=True, timeout=30, env=None):
        self.report["commands"].append([self.clean(arg) for arg in args])
        result = subprocess.run(
            args, input=data, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            timeout=timeout, env=env,
        )
        if check and result.returncode:
            raise RuntimeError(self.clean(f"{args}: exit {result.returncode}: {result.stderr.decode(errors='replace')}"))
        return result

    def spawn(self, args):
        self.report["commands"].append([self.clean(arg) for arg in args])
        process = subprocess.Popen(args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.processes.append(process)
        return process

    def sql(self, container, database, statement, app=False, check=True, app_password=None):
        args = ["docker", "exec", "-i"]
        env = None
        if app:
            args += ["-e", "PGPASSWORD"]
            env = dict(os.environ, PGPASSWORD=self.app_password if app_password is None else app_password)
        args += [container, "psql", "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-U",
                 "probe_app" if app else "postgres", "-d", database]
        if app:
            args += ["-h", "127.0.0.1"]
        return self.call(args, (statement + "\n").encode(), check=check, env=env)

    def scalar(self, container, database, statement):
        return self.sql(container, database, statement).stdout.decode().strip()

    def wait_sql(self, statement, predicate, message, timeout=10):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            value = self.scalar(self.target, "postgres", statement)
            if predicate(value):
                return value
            time.sleep(0.05)
        raise RuntimeError(message)

    def start(self, name):
        env_file = self.directory / f"{name}.env"
        env_file.touch(mode=0o600)
        env_file.write_text(f"POSTGRES_PASSWORD={self.password}\nPOSTGRES_DB=service\nPOSTGRES_INITDB_ARGS=--auth-host=scram-sha-256\n")
        container_id = self.call([
            "docker", "create", "--name", name, "--label", self.label,
            "--network", "none", "--tmpfs", "/var/lib/postgresql:rw,size=128m",
            "--env-file", str(env_file), IMAGE,
        ]).stdout.decode().strip()
        self.call(["docker", "start", container_id])
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            ready = self.call(["docker", "exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres", "-d", "service"], check=False)
            if ready.returncode == 0 and self.sql(name, "service", "SELECT 1", check=False).returncode == 0:
                return
            time.sleep(0.1)
        raise RuntimeError(f"Database startup timed out: {name}")

    def dump(self, container, database):
        return self.call(["docker", "exec", container, "pg_dump", "-U", "postgres", "-d", database, "-Fc", "--no-owner", "--no-acl"]).stdout

    def restore_args(self, database):
        return ["docker", "exec", "-i", self.target, "pg_restore", "-U", "postgres", "-d", database, "--no-owner", "--no-acl", "--exit-on-error"]

    def restore(self, database, archive):
        return self.call(self.restore_args(database), archive, check=False)

    def grants(self, database):
        self.sql(self.target, database, "GRANT USAGE ON SCHEMA public TO probe_app; GRANT SELECT ON ALL TABLES IN SCHEMA public TO probe_app;")

    def new_database(self, database):
        # Names come only from the fixture, never from CLI input.
        self.sql(self.target, "postgres", f"CREATE DATABASE {database} WITH TEMPLATE template0;")

    def acceptance(self, database, expected_id=None):
        query = """SELECT json_build_object(
          'database',current_database(),'user',current_user,
          'system_id',(SELECT system_id FROM app_meta),'schema_version',(SELECT schema_version FROM app_meta),
          'watermark',(SELECT coalesce(max(sequence),0) FROM commit_watermark),
          'orders',(SELECT count(*) FROM orders),'ledger_entries',(SELECT count(*) FROM ledger),
          'unbalanced_orders',(SELECT count(*) FROM (SELECT order_id FROM ledger GROUP BY order_id HAVING sum(cents)<>0) b),
          'missing_ledger_orders',(SELECT count(*) FROM orders o WHERE (SELECT count(*) FROM ledger l WHERE l.order_id=o.id)<>2),
          'unmatched_amount_orders',(SELECT count(*) FROM orders o WHERE (SELECT coalesce(sum(cents),0) FROM ledger l WHERE l.order_id=o.id AND l.cents>0)<>o.cents),
          'orphan_entries',(SELECT count(*) FROM ledger l LEFT JOIN orders o ON l.order_id=o.id WHERE o.id IS NULL),
          'logical_digest',(SELECT md5(string_agg(id||':'||cents,',' ORDER BY id)) FROM orders));"""
        result = self.sql(self.target, database, query, app=True, check=False)
        if result.returncode:
            return {"accepted": False, "exit_code": result.returncode, "error": self.clean(result.stderr.decode().strip())}
        row = json.loads(result.stdout)
        checks = {
            "identity": row["system_id"] == (expected_id or self.system_id) and row["database"] == database and row["user"] == "probe_app",
            "schema": row["schema_version"] == 1,
            "expected_orders": row["orders"] == 3,
            "watermark": row["watermark"] == 3,
            "double_entry_balanced": row["unbalanced_orders"] == 0,
            "complete_ledger": row["missing_ledger_orders"] == 0,
            "matching_amounts": row["unmatched_amount_orders"] == 0,
            "no_orphans": row["orphan_entries"] == 0,
            "logical_contents": row["logical_digest"] == self.baseline_digest,
        }
        return {"accepted": all(checks.values()), "checks": checks, "observed": row}

    def scenario(self, name, passed, **evidence):
        self.report["scenarios"].append({"name": name, "passed": bool(passed), **evidence})
        require(passed, f"Scenario failed: {name}")

    def preflight(self):
        context = os.environ.get("DOCKER_CONTEXT")
        host = os.environ.get("DOCKER_HOST") if not context else None
        if not host:
            command = ["docker", "context", "inspect"] + ([context] if context else [])
            host = self.call(command + ["--format", "{{.Endpoints.docker.Host}}"] ).stdout.decode().strip()
        require(host.startswith("unix://"), "Use a local Unix-socket Docker daemon; remote Docker endpoints are outside this example's scope.")
        docker_version = self.call(["docker", "version", "--format", "{{.Server.Version}}"] ).stdout.decode().strip()
        self.docker_available = True
        if self.call(["docker", "image", "inspect", IMAGE], check=False).returncode:
            self.call(["docker", "pull", IMAGE], timeout=300)
        self.report["versions"] = {"python": platform.python_version(), "docker_server": docker_version}

    def execute(self):
        self.preflight()
        self.start(self.source)
        version = self.scalar(self.source, "service", "SHOW server_version")
        require(version.startswith("18.6 ") or version == "18.6", f"Expected PostgreSQL 18.6, got {version}")
        self.report["versions"].update({
            "postgresql": self.scalar(self.source, "service", "SELECT version()"),
            "pg_dump": self.call(["docker", "exec", self.source, "pg_dump", "--version"]).stdout.decode().strip(),
            "pg_restore": self.call(["docker", "exec", self.source, "pg_restore", "--version"]).stdout.decode().strip(),
            "fsync": self.scalar(self.source, "service", "SHOW fsync"),
            "synchronous_commit": self.scalar(self.source, "service", "SHOW synchronous_commit"),
        })
        self.sql(self.source, "service", f"""CREATE TABLE app_meta(system_id text PRIMARY KEY,schema_version integer NOT NULL);
            INSERT INTO app_meta VALUES ('{self.system_id}',1);
            CREATE TABLE orders(id integer PRIMARY KEY,cents integer NOT NULL CHECK(cents>0));
            CREATE TABLE ledger(id integer PRIMARY KEY,order_id integer NOT NULL REFERENCES orders(id),cents integer NOT NULL);
            CREATE TABLE commit_watermark(sequence integer PRIMARY KEY,description text NOT NULL);""")
        acknowledgments = []

        def commit_order(number):
            self.sql(self.source, "service", f"BEGIN; INSERT INTO orders VALUES ({number},{number*100}); INSERT INTO ledger VALUES ({number*2-1},{number},{number*100}),({number*2},{number},{-number*100}); INSERT INTO commit_watermark VALUES ({number},'order {number}'); COMMIT;")
            acknowledgments.append({"sequence": number, "observed_utc": utc_now(), "monotonic": time.monotonic()})

        for number in range(1, 4):
            commit_order(number)
        archive = self.dump(self.source, "service")
        self.baseline_digest = self.scalar(self.source, "service", "SELECT md5(string_agg(id||':'||cents,',' ORDER BY id)) FROM orders")
        commit_order(4)
        require(self.scalar(self.source, "service", "SELECT max(sequence) FROM commit_watermark") == "4", "Source did not acknowledge watermark 4")
        start_utc, start_monotonic = utc_now(), time.monotonic()
        self.start(self.target)
        restore_start = time.monotonic()
        provisioning_elapsed = restore_start - start_monotonic
        restored = self.restore("service", archive)
        restore_elapsed = time.monotonic() - restore_start
        require(restored.returncode == 0, self.clean(restored.stderr.decode()))
        ready = self.call(["docker", "exec", self.target, "pg_isready", "-h", "127.0.0.1", "-U", "probe_app", "-d", "service"], check=False)
        missing = self.acceptance("service")
        self.scenario("missing_application_role_rejected", ready.returncode == 0 and not missing["accepted"], restore_exit=restored.returncode, server_ready_exit=ready.returncode, acceptance=missing)
        self.sql(self.target, "postgres", f"CREATE ROLE probe_app LOGIN PASSWORD '{self.app_password}';")
        self.grants("service")
        usable = self.acceptance("service")
        elapsed = time.monotonic() - start_monotonic
        self.scenario("recovery_after_dependency_repair", usable["accepted"], acceptance=usable)
        self.report["backup"] = {"bytes": len(archive), "sha256": hashlib.sha256(archive).hexdigest(), "independent_order_digest": self.baseline_digest, "watermark": 3}
        self.report["rto"] = {
            "start_utc": start_utc, "start": "Immediately before target provisioning; source loss is simulated",
            "stop": "Authenticated application identity, schema, watermark, content, and business invariants pass",
            "target_provisioning_seconds": round(provisioning_elapsed, 6),
            "restore_command_seconds": round(restore_elapsed, 6), "application_accepted_seconds": round(elapsed, 6),
            "target_seconds": None, "objective_met": None,
            "includes": ["target provisioning", "restore", "missing-role detection", "role/grant repair", "acceptance checks"],
            "excludes": ["incident detection", "backup creation", "image pull", "remote transfer", "traffic cutover"],
        }
        self.report["rpo"] = {
            "latest_acknowledged_watermark": 4, "restored_watermark": usable["observed"]["watermark"],
            "missing_acknowledged_operations": 1, "missing_order_ids": [4],
            "client_ack_gap_seconds": round(acknowledgments[3]["monotonic"] - acknowledgments[2]["monotonic"], 6),
            "client_ack_gap_is_exact_server_commit_gap": False,
            "meets_fixture_one_operation_budget": True, "meets_zero_loss_budget": False,
        }
        wrong_password = self.sql(self.target, "service", "SELECT 1", app=True, check=False, app_password="intentionally-invalid")
        self.scenario("wrong_application_password_rejected", wrong_password.returncode != 0, exit_code=wrong_password.returncode, error=self.clean(wrong_password.stderr.decode().strip()))
        missing_ids = self.scalar(self.target, "service", "SELECT count(*) FROM orders WHERE id=4")
        self.scenario("zero_loss_claim_rejected", missing_ids == "0" and usable["observed"]["watermark"] == 3, source_acknowledged=4, restored=3, missing_order_id=4)
        wrong = self.acceptance("service", expected_id="different-system")
        self.scenario("wrong_logical_identity_rejected", not wrong["accepted"] and not wrong["checks"]["identity"], acceptance=wrong)
        self.sql(self.target, "service", "UPDATE ledger SET cents=cents+1 WHERE id=1")
        bad_archive = self.dump(self.target, "service")
        self.new_database("semantic_bad")
        bad_restore = self.restore("semantic_bad", bad_archive)
        require(bad_restore.returncode == 0, "Semantically invalid archive failed to restore structurally")
        self.grants("semantic_bad")
        bad = self.acceptance("semantic_bad")
        self.scenario("semantic_corruption_rejected", not bad["accepted"] and not bad["checks"]["double_entry_balanced"] and not bad["checks"]["matching_amounts"], restore_exit=bad_restore.returncode, injection="One-cent ledger mutation before backup; SQL constraints remain valid", acceptance=bad)
        self.interrupted_restore(archive)
        self.new_database("retry_clean")
        retry = self.restore("retry_clean", archive)
        require(retry.returncode == 0, "Fresh retry restore failed")
        self.grants("retry_clean")
        fresh = self.acceptance("retry_clean")
        self.scenario("fresh_rehearsal_after_interruption", fresh["accepted"], restore_exit=retry.returncode, acceptance=fresh)
        self.report["acknowledgments"] = [{"sequence": ack["sequence"], "observed_utc": ack["observed_utc"]} for ack in acknowledgments]
        self.report["status"] = "passed"

    def interrupted_restore(self, archive):
        self.new_database("interrupted")
        self.call(self.restore_args("interrupted") + ["--section=pre-data"], archive)
        self.grants("interrupted")
        locker = self.spawn(["docker", "exec", "-i", "-e", "PGAPPNAME=tal-recovery-locker", self.target, "psql", "-X", "-q", "-At", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "interrupted"])
        locker.stdin.write(b"BEGIN; LOCK TABLE public.orders IN ACCESS EXCLUSIVE MODE; SELECT 1;\n")
        locker.stdin.flush()
        self.wait_sql("SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid WHERE a.datname='interrupted' AND a.application_name='tal-recovery-locker' AND l.mode='AccessExclusiveLock' AND l.granted", lambda value: value == "1", "Lock barrier was not established")
        args = self.restore_args("interrupted")
        args[3:3] = ["-e", "PGAPPNAME=tal-recovery-interrupted"]
        pending = self.spawn(args + ["--section=data"])
        pending.stdin.write(archive)
        pending.stdin.close()
        pid = self.wait_sql("SELECT pid FROM pg_stat_activity WHERE datname='interrupted' AND application_name='tal-recovery-interrupted' AND wait_event_type='Lock' AND query LIKE 'COPY public.orders%'", lambda value: value.isdigit(), "Restore did not reach the COPY lock barrier")
        self.scalar(self.target, "postgres", f"SELECT pg_terminate_backend({int(pid)})")
        pending.wait(timeout=10)
        error = self.clean(pending.stderr.read().decode().strip())
        locker.stdin.write(b"ROLLBACK;\n")
        locker.stdin.close()
        locker.wait(timeout=10)
        partial = self.acceptance("interrupted")
        self.scenario("interrupted_partial_restore_rejected", pending.returncode != 0 and not partial["accepted"] and not partial["checks"]["expected_orders"] and partial["observed"]["watermark"] == 3, restore_exit=pending.returncode, error=error, barrier="Observed pg_restore waiting during COPY public.orders; terminated only that backend", watermark_alone_would_accept=True, atomic_restore=False, acceptance=partial)

    def cleanup(self):
        outcomes = []
        errors = []
        if self.docker_available:
            try:
                ids = self.call(["docker", "ps", "-aq", "--filter", f"label={self.label}"]).stdout.decode().split()
                for container_id in ids:
                    result = self.call(["docker", "rm", "--force", container_id], check=False, timeout=15)
                    outcomes.append({"container_id": container_id, "exit_code": result.returncode})
                remaining = self.call(["docker", "ps", "-aq", "--filter", f"label={self.label}"]).stdout.decode().split()
            except Exception as error:
                remaining = None
                errors.append(self.clean(error))
        else:
            remaining = []
        for process in self.processes:
            try:
                if process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=3)
                for stream in (process.stdin, process.stdout, process.stderr):
                    if stream is not None:
                        stream.close()
            except Exception as error:
                errors.append(self.clean(error))
        passed = remaining == [] and not errors and all(item["exit_code"] == 0 for item in outcomes)
        self.report["cleanup"] = {"passed": passed, "containers": outcomes, "remaining_owned_ids": remaining, "errors": errors}
        if not passed:
            self.report["status"] = "failed"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Save the machine-readable report here; otherwise print it to stdout")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="tal-recovery-") as directory:
        rehearsal = Rehearsal(directory)
        try:
            rehearsal.execute()
        except (Exception, KeyboardInterrupt) as error:
            rehearsal.report.update(status="failed", error=rehearsal.clean(error))
        finally:
            rehearsal.cleanup()
            rehearsal.report["completed_at"] = utc_now()
            rehearsal.report["verifier_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
        report = json.dumps(rehearsal.report, indent=2) + "\n"
    if args.output:
        args.output.write_text(report)
        print(json.dumps({"status": rehearsal.report["status"], "scenarios": len(rehearsal.report["scenarios"]), "cleanup_passed": rehearsal.report["cleanup"]["passed"], "report": str(args.output)}))
    else:
        print(report, end="")
    return 0 if rehearsal.report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
