"""Run a verifier against a new disposable PostgreSQL database and fault proxy."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import secrets
import signal
import subprocess
import sys
import time
import uuid

from commit_proxy import CommitReplyProxy

IMAGE = "postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873"
HERE = Path(__file__).resolve().parent


def docker(*args, **kwargs):
    result = subprocess.run(["docker", *args], text=True,
                            capture_output=True, timeout=60, **kwargs)
    if result.returncode:
        raise RuntimeError(f"docker {args[0]} failed: {result.stderr.strip()}")
    return result.stdout.strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, help="Verifier JSON output path")
    parser.add_argument("--timeout", type=float, default=300, help="Verifier time limit in seconds")
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command or args.timeout <= 0:
        parser.error("provide a positive timeout and -- <verifier command>")
    name = f"tal-backend-{uuid.uuid4().hex[:12]}"
    password = secrets.token_urlsafe(24)
    env = os.environ | {"POSTGRES_PASSWORD": password}
    proxy = None
    child = None
    started = False
    cleanup_errors = []

    def interrupted(signum, _):
        raise KeyboardInterrupt(f"received signal {signum}")

    signal.signal(signal.SIGTERM, interrupted)
    try:
        # The password is supplied by environment, never placed in the command.
        started = True  # Also clean up if Docker creates it but its response fails.
        docker("run", "--detach", "--name", name, "--label", "tal-skills.fixture=backend",
               "--publish", "127.0.0.1::5432", "--tmpfs", "/var/lib/postgresql:rw",
               "--env", "POSTGRES_PASSWORD", "--env", "POSTGRES_DB=tal_example", IMAGE, env=env)
        deadline = time.monotonic() + 45
        while True:
            # The image's temporary initialization server accepts Unix sockets;
            # TCP readiness waits until initialization and its restart finish.
            ready = subprocess.run(["docker", "exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres", "-d", "tal_example"],
                                   capture_output=True, timeout=10)
            if ready.returncode == 0:
                break
            if time.monotonic() >= deadline:
                raise TimeoutError("disposable PostgreSQL did not become ready")
            time.sleep(0.1)
        port = int(docker("port", name, "5432/tcp").splitlines()[0].rsplit(":", 1)[1])
        docker("exec", "-i", name, "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "tal_example",
               input=(HERE / "schema.sql").read_text())
        server_version = docker("exec", name, "psql", "-At", "-U", "postgres", "-d", "tal_example",
                                "-c", "SHOW server_version")
        proxy = CommitReplyProxy("127.0.0.1", port)

        def database_url(target_port):
            return f"postgresql://postgres:{password}@127.0.0.1:{target_port}/tal_example?sslmode=disable"

        verifier_env = os.environ | {
            "TAL_EXAMPLE_DATABASE_URL": database_url(port),
            "TAL_EXAMPLE_PROXY_URL": database_url(proxy.port),
            "TAL_EXAMPLE_PROXY_CONTROL_URL": proxy.control_url,
            "TAL_EXAMPLE_FIXTURE": "disposable-postgres",
        }
        if args.report:
            verifier_env["TAL_EXAMPLE_REPORT"] = str(args.report.resolve())
        print(json.dumps({"fixture": "disposable-postgres", "image": IMAGE,
                          "server_version": server_version, "command": command}), flush=True)
        child = subprocess.Popen(command, env=verifier_env, start_new_session=True)
        code = child.wait(timeout=args.timeout)
        state = proxy.snapshot()
        print(json.dumps({"proxy": state}), flush=True)
        if state["errors"]:
            return 1
        return code
    finally:
        if child:
            try:
                # A verifier can exit while a descendant still owns resources.
                # Signal its group even when the leader has already completed.
                try:
                    os.killpg(child.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                try:
                    child.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    pass  # Escalate below; successful escalation is cleanup.
                finally:
                    try:
                        os.killpg(child.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                    child.wait(timeout=5)
            except Exception as exc:
                cleanup_errors.append(f"verifier cleanup: {exc}")
        if proxy:
            try:
                proxy.close()
            except Exception as exc:
                cleanup_errors.append(str(exc))
        if started:
            try:
                docker("rm", "--force", "--volumes", name)
            except Exception as exc:
                cleanup_errors.append(str(exc))
        if cleanup_errors:
            raise RuntimeError("fixture cleanup failed: " + "; ".join(cleanup_errors))


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
