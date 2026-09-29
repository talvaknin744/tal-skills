#!/usr/bin/env python3
"""Explicit local A2A verification; never imported by the repository test runner."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def http_json(base_url, method, params):
    payload = json.dumps({"jsonrpc": "2.0", "id": "launcher", "method": method, "params": params}).encode()
    request = urllib.request.Request(
        base_url + "/guarded/rpc", data=payload,
        headers={"Authorization": "Bearer fixture-alice", "Content-Type": "application/json", "A2A-Version": "1.0"},
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response)


def source_hashes():
    excluded = {"node_modules", ".venv", ".run", "dist", "__pycache__", "evidence"}
    return {
        str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in sorted(ROOT.rglob("*"))
        if path.is_file() and not any(part in excluded for part in path.relative_to(ROOT).parts)
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--python", default=str(ROOT / ".venv/bin/python"), help="Python with requirements.lock.txt installed")
    parser.add_argument("--report", type=Path, default=ROOT / ".run/report.json")
    args = parser.parse_args()
    report_path = args.report.resolve()
    report_path.parent.mkdir(parents=True, exist_ok=True)
    python = os.path.abspath(args.python)  # Preserve the virtualenv executable path.
    report = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "specification": "1.0.1", "wire_version": "1.0",
        "scope": "Local deterministic JSON-RPC/SSE probes; no model or paid service",
        "commands": [], "results": {}, "status": "running", "source_sha256": source_hashes(),
        "limitations": [
            "Synthetic fixed identities; no JWT/OAuth/mTLS validation",
            "Memory-only task/receipt storage and simulated counter effects",
            "No durable concurrent deduplication, webhook delivery, REST/gRPC, or full conformance",
            "Two Go handlers share memory in one process; no distributed deployment claim",
        ],
    }
    environment = {**os.environ, "GOWORK": "off", "GOTOOLCHAIN": "local"}

    def run(command, cwd=ROOT, timeout=90):
        started = time.monotonic()
        completed = subprocess.run(command, cwd=cwd, env=environment, text=True, capture_output=True, timeout=timeout)
        report["commands"].append({
            "argv": command, "cwd": str(Path(cwd).relative_to(ROOT)) or ".",
            "exit_code": completed.returncode, "seconds": round(time.monotonic() - started, 3),
        })
        if completed.returncode:
            report["commands"][-1]["stdout"] = completed.stdout
            report["commands"][-1]["stderr"] = completed.stderr
            raise RuntimeError(f"Command failed ({completed.returncode}): {command}\n{completed.stdout}\n{completed.stderr}")
        return completed.stdout

    with tempfile.TemporaryDirectory(prefix="tal-a2a-verify-") as temporary_directory:
        temporary = Path(temporary_directory)
        server = None
        log_handle = None
        server_number = 0

        def stop_server():
            nonlocal server, log_handle
            if server is None:
                return
            server.terminate()
            try:
                exit_code = server.wait(timeout=15)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)
                raise RuntimeError("Owned fixture exceeded its shutdown deadline; it was killed")
            finally:
                if log_handle:
                    log_handle.close()
            log = (temporary / f"server-{server_number}.log").read_text()
            suspicious = [line for line in log.splitlines() if any(
                marker in line.lower() for marker in ("task was destroyed", "pending task", "failed to detach", "exception in dispatcher")
            )]
            report["results"].setdefault("shutdown", []).append({
                "exit_code": exit_code, "unexpected_cleanup_lines": suspicious,
                "expected_request_errors": sum("Request Error" in line for line in log.splitlines()),
                **({"server_log": log} if suspicious else {}),
            })
            server = None
            if exit_code not in (0, -15, 143) or suspicious:
                raise RuntimeError(f"Unexpected fixture shutdown evidence: exit={exit_code}, lines={suspicious}")

        def start_server():
            nonlocal server, log_handle, server_number
            server_number += 1
            ready_file = temporary / f"ready-{server_number}.json"
            log_handle = (temporary / f"server-{server_number}.log").open("w")
            command = [python, str(ROOT / "python/server.py"), "--ready-file", str(ready_file)]
            server = subprocess.Popen(command, cwd=ROOT, stdout=log_handle, stderr=subprocess.STDOUT, env=environment)
            report["commands"].append({"argv": command, "cwd": ".", "lifecycle": "owned subprocess; terminated and awaited"})
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                if server.poll() is not None:
                    raise RuntimeError("Fixture exited before readiness; inspect shutdown evidence")
                if ready_file.exists():
                    ready = json.loads(ready_file.read_text())
                    try:
                        with urllib.request.urlopen(ready["base_url"] + "/.well-known/agent-card.json", timeout=1) as response:
                            assert json.load(response)["supportedInterfaces"][0]["protocolVersion"] == "1.0"
                        return ready
                    except (OSError, urllib.error.URLError):
                        pass
                time.sleep(0.02)
            raise RuntimeError("Fixture did not become ready within fifteen seconds")

        try:
            report["runtime"] = {
                "launcher_python": platform.python_version(),
                "peer_python": run([python, "-c", "import platform; print(platform.python_version())"]).strip(),
                "node": run(["node", "--version"]).strip(),
                "go": run(["go", "version"]).strip(),
            }
            locked = {}
            for line in (ROOT / "python/requirements.lock.txt").read_text().splitlines():
                if line.strip() and not line.startswith("#"):
                    package, version = line.split("==", 1)
                    locked[package.split("[", 1)[0]] = version
            installed = json.loads(run([
                python, "-c",
                "import importlib.metadata as m,json,sys; print(json.dumps({p:m.version(p) for p in json.loads(sys.argv[1])}))",
                json.dumps(list(locked)),
            ]))
            assert installed == locked, {"installed": installed, "locked": locked}
            report["python_packages"] = installed
            node_package = json.loads((ROOT / "typescript/node_modules/@a2a-js/sdk/package.json").read_text())
            assert node_package["version"] == "1.2.1", node_package["version"]
            run(["npm", "run", "build"], ROOT / "typescript")
            go_module = json.loads(run(["go", "list", "-m", "-json", "github.com/a2aproject/a2a-go/v2"], ROOT / "go"))
            assert go_module["Version"] == "v2.6.0", go_module
            report["go_module"] = {key: go_module.get(key) for key in ("Path", "Version", "Sum", "GoModSum")}
            report["results"]["owner_scope"] = json.loads(run([python, str(ROOT / "python/verify_owner_scope.py")]))
            ready = start_server()
            ts_output = temporary / "typescript.json"
            try:
                run(["node", str(ROOT / "typescript/dist/verify.js"), ready["base_url"], str(ts_output)])
            finally:
                if ts_output.exists():
                    report["results"]["typescript_to_python"] = json.loads(ts_output.read_text())
            go_output = temporary / "go-crosslang.json"
            try:
                run(["go", "run", "./cmd/crosslang", ready["base_url"], str(go_output)], ROOT / "go")
            finally:
                if go_output.exists():
                    report["results"]["go_to_python"] = json.loads(go_output.read_text())
            # A fresh process uses a different listener and a newly empty task store.
            message = {"message": {"messageId": "restart-observation", "role": "ROLE_USER", "parts": [{"text": "immediate"}]}}
            accepted = http_json(ready["base_url"], "SendMessage", message)["result"]["task"]
            before = http_json(ready["base_url"], "GetTask", {"id": accepted["id"]})
            assert before["result"]["status"]["state"] == "TASK_STATE_COMPLETED"
            first_instance = ready["instance_id"]
            stop_server()
            restarted = start_server()
            assert restarted["instance_id"] != first_instance
            after = http_json(restarted["base_url"], "GetTask", {"id": accepted["id"]})
            assert after["error"]["code"] == -32001
            report["results"]["restart"] = {
                "status": "observed-state-loss", "before": "completed", "after": "TASK_NOT_FOUND",
                "scope": "Default in-memory storage; observation is not a passed durability guarantee",
            }
            stop_server()
            go_events = run(["go", "test", "-race", "-json", "-count=1", "-timeout=60s", "./..."], ROOT / "go")
            events = [json.loads(line) for line in go_events.splitlines() if line.strip()]
            passed = [event["Test"] for event in events if event.get("Action") == "pass" and "Test" in event]
            report["results"]["go_to_go"] = {
                "status": "passed", "race_detector": "no report",
                "top_level_tests": [name for name in passed if "/" not in name],
                "race_subtests": len([name for name in passed if "/" in name]),
                "observations": [event["Output"].strip() for event in events if event.get("Test") and event.get("Output") and any(
                    marker in event["Output"] for marker in ("races: outcomes=", "unfenced simulated", "same messageId", "terminal task", "second observer", "both cancel")
                )],
                "adverse_case": "Shared-store cancellation leaves an unfenced simulated effect possible; passing assertion records the unsafe behavior",
            }
            report["status"] = "verified-with-two-observed-stock-validation-gaps"
        except Exception as error:
            report["status"] = "failed"
            report["error"] = f"{type(error).__name__}: {error}"
        finally:
            try:
                stop_server()
            except Exception as error:
                report["status"] = "failed"
                report["shutdown_error"] = str(error)
            report["finished_at"] = datetime.now(timezone.utc).isoformat()
            report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "report": str(report_path)}, indent=2))
    return 1 if report["status"] == "failed" else 0


if __name__ == "__main__":
    sys.exit(main())
