#!/usr/bin/env python3
"""Run bounded synthetic probes against one owned disposable Redis container."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import signal
import sqlite3
import subprocess
import sys
import tempfile
import time
import uuid

from redis_client import Redis
from probes import run_probes


ROOT = Path(__file__).resolve().parent
LABEL = "io.tal-skills.cache-load-protection-run"
SOURCE_FILES = [".gitignore", "README.md", "dependencies.lock.json", "redis_client.py", "probes.py", "verify.py"]


def hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in SOURCE_FILES}


def command(arguments, timeout=20):
    process = subprocess.Popen(arguments, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               text=True, start_new_session=True)
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except BaseException:
        for sig in (signal.SIGTERM, signal.SIGKILL):
            try:
                os.killpg(process.pid, sig)
            except ProcessLookupError:
                pass
            if sig == signal.SIGTERM:
                try:
                    process.communicate(timeout=1)
                except subprocess.TimeoutExpired:
                    pass
        process.communicate(timeout=5)
        raise
    if process.returncode:
        raise RuntimeError(f"Command failed ({process.returncode}): {arguments[0:2]!r}: {stderr.strip()}")
    return stdout.strip()


def docker(*arguments, timeout=20):
    return command(["docker", *arguments], timeout=timeout)


def cleanup(run_id):
    result = {"owner_label": LABEL, "owned_ids": [], "removed_ids": [], "errors": []}
    try:
        ids = docker("ps", "-aq", "--no-trunc", "--filter", f"label={LABEL}={run_id}").split()
        result["owned_ids"] = ids
        for container_id in ids:
            metadata = json.loads(docker("inspect", container_id))[0]
            if metadata["Config"]["Labels"].get(LABEL) != run_id:
                raise RuntimeError("Refusing cleanup of a container with another owner")
            docker("rm", "--force", container_id)
            result["removed_ids"].append(container_id)
        remaining = docker("ps", "-aq", "--filter", f"label={LABEL}={run_id}").split()
        result["remaining_ids"] = remaining
        if remaining:
            result["errors"].append("Owned container remains")
    except Exception as error:
        result["errors"].append(repr(error))
    result["complete"] = not result["errors"]
    return result


def interrupted(signum, frame):
    raise KeyboardInterrupt(f"Signal {signum}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, default=ROOT / "evidence/verified-run.json")
    options = parser.parse_args()
    pins = json.loads((ROOT / "dependencies.lock.json").read_text())
    run_id = uuid.uuid4().hex
    report = {"schema_version": 1, "started_at": datetime.now(timezone.utc).isoformat(),
              "status": "fail", "pins": pins, "source_sha256": hashes(), "scenarios": [],
              "runtime": {"python": platform.python_version(), "sqlite": sqlite3.sqlite_version,
                          "platform": platform.platform()}, "errors": []}
    container_attempted = False
    container_id = None
    prior_handlers = {}
    try:
        if os.name != "posix" or sys.flags.optimize:
            raise RuntimeError("Requires POSIX and Python assertions enabled")
        if platform.python_version() != pins["python"]:
            raise RuntimeError(f"Requires the recorded Python pin {pins['python']}")
        for signum in (signal.SIGTERM, signal.SIGINT):
            prior_handlers[signum] = signal.signal(signum, interrupted)
        docker("info", "--format", "{{.ServerVersion}}", timeout=10)
        with tempfile.TemporaryDirectory(prefix="tal-cache-load-") as temporary:
            container_attempted = True
            container_id = docker(
                "run", "--detach", "--pull=missing", "--name", f"tal-cache-load-{run_id}",
                "--label", f"{LABEL}={run_id}", "--platform", pins["redis_image_platform"],
                "--cidfile", str(Path(temporary) / "container.id"),
                "--publish", "127.0.0.1::6379", "--memory", "256m", "--cpus", "1",
                "--read-only", "--tmpfs", "/data:rw,noexec,nosuid,size=16m", pins["redis_image"],
                "redis-server",
                "--save", "", "--appendonly", "no", "--maxmemory", "128mb",
                "--maxmemory-policy", "noeviction", timeout=120,
            )
            metadata = json.loads(docker("inspect", container_id))[0]
            assert metadata["Config"]["Labels"].get(LABEL) == run_id
            port = int(metadata["NetworkSettings"]["Ports"]["6379/tcp"][0]["HostPort"])
            deadline = time.monotonic() + 10
            while True:
                try:
                    with Redis(port) as cache:
                        assert cache.command("PING") == "PONG"
                    break
                except (OSError, ConnectionError):
                    if time.monotonic() >= deadline:
                        raise RuntimeError("Owned Redis did not become ready")
                    time.sleep(0.02)
            with Redis(port) as cache:
                info = dict(line.split(":", 1) for line in cache.command("INFO", "server").splitlines() if ":" in line)
                assert info["redis_version"] == pins["redis_version"]
                modules = cache.command("MODULE", "LIST")
                capabilities = cache.command("COMMAND", "INFO", "BF.RESERVE", "BF.EXISTS")
                assert all(capabilities), "Pinned image did not expose required Bloom commands"
                report["container"] = {"id": container_id, "image_id": metadata["Image"],
                    "configured_image": metadata["Config"]["Image"], "port": port,
                    "redis_version": info["redis_version"], "modules": modules,
                    "persistence": "disabled", "maxmemory_policy": "noeviction"}
            run_probes(port, Path(temporary) / "source.sqlite3", report["scenarios"])
            assert len(report["scenarios"]) == 8
            assert all(case["status"] == "pass" for case in report["scenarios"])
            assert hashes() == report["source_sha256"], "Candidate changed during execution"
    except BaseException as error:
        report["errors"].append(f"{type(error).__name__}: {error}")
    finally:
        if container_id and report["errors"]:
            try:
                report["container_failure_logs"] = docker("logs", "--tail", "60", container_id)
                report["container_failure_state"] = json.loads(docker("inspect", container_id))[0]["State"]
            except Exception as diagnostic_error:
                report["diagnostic_error"] = repr(diagnostic_error)
        report["cleanup"] = cleanup(run_id) if container_attempted else {"complete": True, "not_started": True}
        for signum, handler in prior_handlers.items():
            signal.signal(signum, handler)
    if report["cleanup"].get("errors"):
        report["errors"].extend(report["cleanup"]["errors"])
    if not report["errors"] and len(report["scenarios"]) == 8:
        report["status"] = "pass"
    report["completed_at"] = datetime.now(timezone.utc).isoformat()
    report["counts"] = {"scenarios": len(report["scenarios"]),
                        "passed": sum(case["status"] == "pass" for case in report["scenarios"])}
    target = options.report
    if report["status"] != "pass" and target.name == "verified-run.json":
        target = target.with_name("failed-run-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ") + ".json")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "counts": report["counts"],
                      "report": str(target), "errors": report["errors"]}))
    return int(report["status"] != "pass")


if __name__ == "__main__":
    raise SystemExit(main())
