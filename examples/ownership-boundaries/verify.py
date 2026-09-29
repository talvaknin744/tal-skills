#!/usr/bin/env python3
"""Run isolated stdlib probes and bind their report to these exact sources."""

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import signal
import subprocess
import sys
import tempfile
import time


ROOT = Path(__file__).resolve().parent
PINS = {"python": "3.14.3", "go": "go1.27.1", "node": "25.9.0"}
SOURCES = ["README.md", "verify.py", "python/probe.py", "go/main.go", "node/probe.mjs"]
EXPECTED = {
    "python": {
        "semaphore-grant-cancel-before-resume": "pass",
        "shielded-acquisition-abandoned-grant": "observed-unsafe",
    },
    "go": {
        "select-operand-before-canceled-case": "observed-unsafe",
        "precheck-known-cancellation": "pass",
        "precheck-not-an-effect-fence": "observed-unsafe",
    },
    "node": {
        "finished-cancels-observation-only": "observed-unsafe",
        "pipeline-abort-closes-owned-streams": "pass",
    },
}


def source_hashes():
    return {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in SOURCES}


def command(args, timeout, env):
    """On timeout, kill the owned group even when its leader exits first."""
    started = time.monotonic()
    process = subprocess.Popen(
        args, cwd=ROOT, env=env, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, text=True, start_new_session=True,
    )
    timed_out = False
    timeout_cleanup = None
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        timed_out = True
        timeout_cleanup = {"term_sent": False, "kill_sent": False}
        try:
            os.killpg(process.pid, signal.SIGTERM)
            timeout_cleanup["term_sent"] = True
        except ProcessLookupError:
            pass
        try:
            stdout, stderr = process.communicate(timeout=2)
        except subprocess.TimeoutExpired:
            pass
        finally:
            # communicate() only joins the direct child. A descendant can
            # ignore TERM and close its inherited pipes, letting the leader
            # finish while that descendant remains alive in the owned group.
            try:
                os.killpg(process.pid, signal.SIGKILL)
                timeout_cleanup["kill_sent"] = True
            except ProcessLookupError:
                pass
        stdout, stderr = process.communicate(timeout=5)
        group_deadline = time.monotonic() + 1
        while True:
            try:
                os.killpg(process.pid, 0)
            except ProcessLookupError:
                timeout_cleanup["group_disappearance_observed"] = True
                break
            except OSError as error:
                timeout_cleanup["group_disappearance_observed"] = False
                timeout_cleanup["group_observation_error"] = f"{type(error).__name__}: {error}"
                break
            if time.monotonic() >= group_deadline:
                timeout_cleanup["group_disappearance_observed"] = False
                break
            time.sleep(0.01)
        timeout_cleanup["observation_limit"] = "Signal zero includes unreaped zombies; a remaining group or observation error is cleanup-unconfirmed. Descendants that leave this group are outside the launcher contract."
    return {
        "exit_code": process.returncode,
        "timed_out": timed_out,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "stdout": stdout,
        "stderr": stderr,
        "timeout_cleanup": timeout_cleanup,
    }


def checked_command(args, timeout, env):
    result = command(args, timeout, env)
    if result["timed_out"] or result["exit_code"] != 0 or result["stderr"]:
        raise RuntimeError(json.dumps({"command": args, **result}))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, default=ROOT / "evidence/verified-run.json")
    options = parser.parse_args()
    report = {
        "schema_version": 1,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "runtime_pins": PINS,
        "platform": platform.platform(),
        "source_sha256": source_hashes(),
        "status": "fail",
        "runs": [],
        "errors": [],
        "limitations": [
            "Seven controlled in-process observations, not benchmarks or all-schedule proofs.",
            "Observed-unsafe controls pass only when the specified unsafe assumption is disproved and harness cleanup finishes.",
            "No network, package installation, database, remote effect, HTTP socket, or backpressure experiment.",
            "POSIX launcher uses process-group deadlines; probe cleanup is separately observed.",
        ],
    }
    env = dict(os.environ)
    env.update({
        "GOTOOLCHAIN": "local", "GOPROXY": "off", "GOSUMDB": "off",
        "GOWORK": "off", "GOENV": "off", "GO111MODULE": "off", "GOFLAGS": "",
        "PYTHONASYNCIODEBUG": "1", "PYTHONDONTWRITEBYTECODE": "1", "PYTHONOPTIMIZE": "0",
    })
    try:
        if os.name != "posix":
            raise RuntimeError("This process-group launcher requires POSIX")
        observed = {
            "python": platform.python_version(),
            "node": checked_command(["node", "--version"], 10, env)["stdout"].strip().removeprefix("v"),
            "go": checked_command(["go", "version"], 10, env)["stdout"].split()[2],
        }
        report["observed_runtimes"] = observed
        if platform.python_implementation() != "CPython" or observed != PINS:
            raise RuntimeError(f"Runtime pins differ: expected {PINS}, observed {observed}")
        with tempfile.TemporaryDirectory(prefix="ownership-boundaries-") as temporary:
            binary = Path(temporary) / "go-probe"
            build = checked_command(
                ["go", "build", "-race", "-o", str(binary), str(ROOT / "go/main.go")], 120, env,
            )
            report["go_build"] = {"flags": ["-race"], **build}
            commands = [
                ("python", [sys.executable, "-X", "dev", str(ROOT / "python/probe.py")]),
                ("go", [str(binary)]),
                ("node", ["node", "--unhandled-rejections=strict", str(ROOT / "node/probe.mjs")]),
            ]
            for language, args in commands:
                execution = command(args, 15, env)
                run = {"language": language, "execution": execution}
                report["runs"].append(run)
                try:
                    probe = json.loads(execution["stdout"])
                    run["probe"] = probe
                    actual = {case["id"]: case["status"] for case in probe["scenarios"]}
                    if execution["timed_out"] or execution["exit_code"] != 0 or execution["stderr"]:
                        raise AssertionError("Probe process failed, timed out, or wrote diagnostics")
                    if probe["runtime"] != PINS[language] or probe["language"] != language:
                        raise AssertionError("Probe reported a mismatched runtime or language")
                    if language == "python" and probe.get("optimization_level") != 0:
                        raise AssertionError("Python probe did not run with assertions enabled")
                    if actual != EXPECTED[language] or len(probe["scenarios"]) != len(actual):
                        raise AssertionError(f"Unexpected scenario results: {actual}")
                except Exception as error:
                    report["errors"].append(f"{language}: {error}")
        if source_hashes() != report["source_sha256"]:
            raise AssertionError("Sources changed during verification")
        report["counts"] = {
            status: sum(
                case["status"] == status for run in report["runs"]
                for case in run.get("probe", {}).get("scenarios", [])
            ) for status in ["pass", "observed-unsafe", "fail"]
        }
        if not report["errors"] and len(report["runs"]) == 3:
            report["status"] = "pass"
    except Exception as error:
        report["errors"].append(repr(error))
    report["completed_at"] = datetime.now(timezone.utc).isoformat()
    target = options.report
    if report["status"] != "pass" and target.name == "verified-run.json":
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
        target = target.with_name(f"failed-run-{stamp}.json")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "counts": report.get("counts", {}), "report": str(target), "errors": report["errors"]}))
    return int(report["status"] != "pass")


if __name__ == "__main__":
    sys.exit(main())
