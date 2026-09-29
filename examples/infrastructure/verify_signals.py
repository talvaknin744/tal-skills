#!/usr/bin/env python3
"""Send TERM to the verifier after observing its owned child, then check cleanup."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time


HERE = Path(__file__).resolve().parent


def group_exists(group):
    try:
        os.killpg(group, 0)
    except ProcessLookupError:
        return False
    return True


def wait_for_absence(group, seconds):
    deadline = time.monotonic() + seconds
    while group_exists(group) and time.monotonic() < deadline:
        time.sleep(0.02)
    return not group_exists(group)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verifier", type=Path, default=HERE / "verify.py", help="Trusted verifier candidate, defaulting to the adjacent script")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    report = {"status": "running", "started_at": datetime.now(timezone.utc).isoformat(), "verifier_sha256": hashlib.sha256(args.verifier.read_bytes()).hexdigest(), "harness_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "scope": "Synthetic wait executable only; no actual Terraform behavior or cloud resources are tested."}
    verifier = None
    child_info = None
    previous = signal.getsignal(signal.SIGTERM)

    def terminate(signum, frame):
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        raise KeyboardInterrupt(f"signal {signum}")

    signal.signal(signal.SIGTERM, terminate)
    try:
        with tempfile.TemporaryDirectory(prefix="tal-infra-signal-check-") as directory:
            root = Path(directory)
            marker = root / "ready.json"
            ready_child = root / "child.json"
            stub = root / "wait-terraform"
            stub.write_text(f'''#!{sys.executable}
import json, os, pathlib, signal, subprocess, sys, time
if sys.argv[1:] == ["version", "-json"]:
    print(json.dumps({{"terraform_version": "1.16.4", "platform": "synthetic-wait-stub", "provider_selections": {{}}}}))
    sys.exit(0)
child_code = "import os,pathlib,signal,time; signal.signal(signal.SIGTERM, signal.SIG_IGN); pathlib.Path({str(ready_child)!r}).write_text(str(os.getpid())); time.sleep(60)"
child = subprocess.Popen([sys.executable, "-c", child_code])
deadline = time.monotonic() + 10
while not pathlib.Path({str(ready_child)!r}).exists():
    if time.monotonic() >= deadline:
        raise RuntimeError("child startup deadline exceeded")
    time.sleep(0.01)
pathlib.Path({str(marker)!r}).write_text(json.dumps({{"pid": os.getpid(), "group": os.getpgrp(), "child_pid": child.pid, "project": os.getcwd()}}))
time.sleep(60)
''')
            stub.chmod(0o700)
            child_report = root / "verifier-report.json"
            command = [sys.executable, str(args.verifier.resolve()), "--terraform", str(stub), "--terraform-sha256", hashlib.sha256(stub.read_bytes()).hexdigest(), "--report", str(child_report)]
            verifier = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
            deadline = time.monotonic() + 15
            while not marker.exists():
                if verifier.poll() is not None:
                    raise RuntimeError("Verifier exited before the child startup marker")
                if time.monotonic() >= deadline:
                    raise RuntimeError("Timed out observing the verifier child")
                time.sleep(0.02)
            child_info = json.loads(marker.read_text())
            scratch = Path(child_info["project"]).resolve().parent
            if scratch.parent != Path(tempfile.gettempdir()).resolve() or not scratch.name.startswith("tal-infrastructure-"):
                raise RuntimeError("Unexpected verifier scratch path")
            started = time.monotonic()
            os.kill(verifier.pid, signal.SIGTERM)
            stdout, stderr = verifier.communicate(timeout=15)
            gone = wait_for_absence(child_info["group"], 5)
            nested = json.loads(child_report.read_text()) if child_report.exists() else None
            report["observations"] = {
                "startup_marker_observed": True,
                "child_ignored_sigterm": True,
                "verifier_exit_code": verifier.returncode,
                "expected_exit_code": 143,
                "owned_process_group_gone": gone,
                "scratch_removed_before_harness_cleanup": not scratch.exists(),
                "elapsed_seconds": round(time.monotonic() - started, 3),
                "stdout": stdout,
                "stderr": stderr,
                "verifier_report": nested,
            }
            passed = verifier.returncode == 143 and gone and not scratch.exists() and nested is not None and nested.get("termination_signal") == signal.SIGTERM and nested.get("cleanup", {}).get("temporary_directory_removed") is True
            report["status"] = "passed" if passed else "failed"
            if not passed:
                report["error"] = "Verifier did not complete the expected TERM cleanup and evidence path"
    except (Exception, KeyboardInterrupt) as error:
        report["status"] = "failed"
        report["error"] = f"{type(error).__name__}: {error}"
    finally:
        # Clean up a failing candidate too, after recording what it left behind.
        if verifier is not None and verifier.poll() is None:
            os.killpg(verifier.pid, signal.SIGKILL)
            verifier.communicate(timeout=5)
        if child_info is not None:
            if group_exists(child_info["group"]):
                os.killpg(child_info["group"], signal.SIGKILL)
                wait_for_absence(child_info["group"], 5)
            scratch = Path(child_info["project"]).resolve().parent
            if scratch.parent == Path(tempfile.gettempdir()).resolve() and scratch.name.startswith("tal-infrastructure-") and scratch.exists():
                shutil.rmtree(scratch)
        signal.signal(signal.SIGTERM, previous)
        report["finished_at"] = datetime.now(timezone.utc).isoformat()
    encoded = json.dumps(report, indent=2) + "\n"
    if args.report:
        args.report.write_text(encoded)
        print(json.dumps({"status": report["status"], "report": str(args.report.resolve()), "observations": {k: v for k, v in report.get("observations", {}).items() if k not in ("stdout", "stderr", "verifier_report")}}))
    else:
        print(encoded)
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
