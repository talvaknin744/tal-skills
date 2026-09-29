#!/usr/bin/env python3
"""Create only a disposable local database, run the probe, and remove it."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import secrets
import signal
import subprocess
import sys
import time
import uuid


ROOT = Path(__file__).resolve().parent
IMAGE = "postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873"
SOURCES = ["README.md", "requirements.in", "requirements.lock", "probe.py", "verify.py"]
EXPECTED = {
    "shared-session-cross-task-rollback": "observed-unsafe",
    "task-owned-asgi-fanout-pool-budget": "pass",
    "taskgroup-cancel-real-lock-wait": "pass",
    "independent-sessions-not-common-snapshot": "observed-unsafe",
    "generic-sql-hides-bound-intent": "observed-unsafe",
    "whitespace-normalizer-changes-literals": "observed-unsafe",
    "semantic-oracle-rejects-filter-and-join": "pass",
    "unawaited-query-does-not-execute": "observed-unsafe",
}


def hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in SOURCES}


def stop_group(process):
    result = {}
    for signum, grace in [(signal.SIGTERM, 2), (signal.SIGKILL, 5)]:
        try:
            os.killpg(process.pid, signum)
            result[signum.name] = "sent"
        except ProcessLookupError:
            result[signum.name] = "group-absent"
        except OSError as error:
            result[signum.name] = repr(error)
        try:
            process.communicate(timeout=grace)
        except subprocess.TimeoutExpired:
            pass
    try:
        os.killpg(process.pid, 0)
        result["group_disappearance_observed"] = False
    except ProcessLookupError:
        result["group_disappearance_observed"] = True
    except OSError as error:
        result["group_disappearance_observed"] = False
        result["observation_error"] = repr(error)
    result["limit"] = "A remaining group or observation error is cleanup-unconfirmed; escaped descendants are not covered."
    return result


def command(args, *, timeout=30, env=None):
    process = subprocess.Popen(args, cwd=ROOT, env=env, text=True,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True)
    result = {"timed_out": False}
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        result["timed_out"] = True
        result["timeout_cleanup"] = stop_group(process)
        stdout, stderr = process.communicate(timeout=5)
    except BaseException:
        stop_group(process)
        raise
    return result | {"exit_code": process.returncode, "stdout": stdout, "stderr": stderr}


def docker(*args, timeout=30, env=None):
    result = command(["docker", *args], timeout=timeout, env=env)
    if result["exit_code"] != 0 or result["timed_out"]:
        raise RuntimeError(f"Docker {args[0]} failed: {result}")
    return result["stdout"].strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--python", type=Path, default=ROOT / ".venv/bin/python")
    parser.add_argument("--report", type=Path, default=ROOT / "evidence/verified-run.json")
    options = parser.parse_args()
    name = "tal-sqlalchemy-" + uuid.uuid4().hex[:12]
    password = secrets.token_urlsafe(24)
    env = os.environ | {"PYTHONOPTIMIZE": "0", "PYTHONASYNCIODEBUG": "1", "PYTHONDONTWRITEBYTECODE": "1"}
    report = {"schema_version": 1, "started_at": datetime.now(timezone.utc).isoformat(),
              "status": "fail", "image": IMAGE, "container": name,
              "source_sha256": hashes(), "errors": [], "cleanup": {},
              "runtime_pin": "CPython 3.14.3", "platform": platform.platform()}
    started = False

    def interrupted(signum, _frame):
        raise KeyboardInterrupt(f"signal {signum}")

    previous_term = signal.signal(signal.SIGTERM, interrupted)
    try:
        if os.name != "posix":
            raise RuntimeError("This process-group launcher requires POSIX")
        if not options.python.is_file():
            raise RuntimeError("Create the isolated .venv and install requirements.lock; see README.md")
        # Preserve the venv executable path: resolving its interpreter symlink
        # would select the base interpreter and lose the isolated environment.
        interpreter = str(options.python.absolute())
        preflight = command([interpreter, "-c", "import json,platform,sys; print(json.dumps({'implementation':platform.python_implementation(),'runtime':platform.python_version(),'isolated':sys.prefix!=sys.base_prefix}))"], env=env)
        runtime = json.loads(preflight["stdout"])
        if preflight["exit_code"] != 0 or runtime != {"implementation": "CPython", "runtime": "3.14.3", "isolated": True}:
            raise RuntimeError(f"Unexpected Python runtime: {preflight}")
        report["observed_runtime"] = runtime
        started = True  # Clean up even if create succeeds but its response fails.
        docker("run", "--detach", "--name", name, "--label", "tal-skills.fixture=sqlalchemy-gotchas",
               "--publish", "127.0.0.1::5432", "--tmpfs", "/var/lib/postgresql:rw",
               "--env", "POSTGRES_PASSWORD", "--env", "POSTGRES_DB=tal_sqlalchemy", IMAGE,
               timeout=60, env=env | {"POSTGRES_PASSWORD": password})
        deadline = time.monotonic() + 45
        while True:
            ready = command(["docker", "exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres", "-d", "tal_sqlalchemy"], timeout=5)
            if ready["exit_code"] == 0:
                break
            if time.monotonic() >= deadline:
                raise TimeoutError("Disposable PostgreSQL TCP readiness deadline")
            time.sleep(0.1)
        port = int(docker("port", name, "5432/tcp").splitlines()[0].rsplit(":", 1)[1])
        server = docker("exec", name, "psql", "-At", "-U", "postgres", "-d", "tal_sqlalchemy", "-c", "SHOW server_version")
        if server.split()[0] != "18.6":
            raise RuntimeError(f"Unexpected server version: {server}")
        report["server_version"] = server
        child_env = env | {"TAL_SQLA_FIXTURE": "disposable-postgres", "TAL_SQLA_FIXTURE_URL":
                           f"postgresql+psycopg://postgres:{password}@127.0.0.1:{port}/tal_sqlalchemy?sslmode=disable"}
        execution = command([interpreter, "-X", "dev", str(ROOT / "probe.py")], timeout=150, env=child_env)
        execution = {key: value.replace(password, "[redacted]") if isinstance(value, str) else value for key, value in execution.items()}
        # Asyncio debug logs slow callbacks according to host load. Preserve
        # those notices, but do not turn this correctness fixture into a timing
        # benchmark. Never-awaited/resource/error diagnostics remain failures.
        notices, diagnostic_errors = [], []
        for line in execution["stderr"].splitlines():
            if re.fullmatch(r"Executing <.*> took [0-9]+(?:\.[0-9]+)? seconds", line):
                notices.append(line)
            elif line.strip():
                diagnostic_errors.append(line)
        execution["scheduler_timing_notices"] = notices
        execution["diagnostic_errors"] = diagnostic_errors
        report["execution"] = execution
        probe = json.loads(execution["stdout"])
        report["probe"] = probe
        actual = {case["id"]: case["status"] for case in probe["scenarios"]}
        pins = dict(line.split("==") for line in (ROOT / "requirements.lock").read_text().splitlines() if "==" in line)
        if probe["distributions"] != pins or probe["runtime"] != "3.14.3" or probe["optimization_level"] != 0:
            raise AssertionError("Observed distributions or Python options do not match pins")
        if actual != EXPECTED or len(probe["scenarios"]) != len(EXPECTED):
            raise AssertionError(f"Unexpected scenarios: {actual}")
        if execution["exit_code"] != 0 or execution["timed_out"] or diagnostic_errors:
            raise AssertionError("Probe failed, timed out, or emitted diagnostics")
        if probe["cleanup"]["worker_leases"] != 0 or not probe["cleanup"]["engines_disposed"] or probe["cleanup"]["pending_tasks"] != 0:
            raise AssertionError("Probe did not finish owned cleanup")
        remaining = docker("exec", name, "psql", "-At", "-U", "postgres", "-d", "tal_sqlalchemy", "-c",
                           "SELECT count(*) FROM pg_stat_activity WHERE datname='tal_sqlalchemy' AND backend_type='client backend' AND pid<>pg_backend_pid()")
        report["cleanup"]["client_backends_after_probe"] = int(remaining)
        if remaining != "0":
            raise AssertionError("Database client backends remain after engine disposal")
        if hashes() != report["source_sha256"]:
            raise AssertionError("Sources changed during verification")
        report["counts"] = {status: list(actual.values()).count(status) for status in ["pass", "observed-unsafe", "fail"]}
        report["status"] = "pass"
    except BaseException as error:
        report["errors"].append(repr(error).replace(password, "[redacted]"))
    finally:
        if started:
            try:
                docker("rm", "--force", "--volumes", name)
                # Use a successful Docker inventory query, not arbitrary inspect
                # failure, as evidence that this exact container is absent.
                remaining = docker("ps", "--all", "--filter", f"name=^/{name}$", "--format", "{{.Names}}")
                if remaining:
                    raise RuntimeError("Owned container is still present")
                report["cleanup"]["container_removed"] = True
            except Exception as error:
                report["status"] = "fail"
                report["cleanup"]["container_removed"] = False
                report["errors"].append(f"container cleanup: {error}".replace(password, "[redacted]"))
        signal.signal(signal.SIGTERM, previous_term)
    report["completed_at"] = datetime.now(timezone.utc).isoformat()
    target = options.report
    if report["status"] != "pass" and target.name == "verified-run.json":
        target = target.with_name("failed-run-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".json")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "counts": report.get("counts", {}), "report": str(target), "errors": report["errors"]}))
    return int(report["status"] != "pass")


if __name__ == "__main__":
    sys.exit(main())
