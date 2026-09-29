"""Explicit runtime verifier; writes observed evidence and returns a failing status."""

import argparse
import asyncio
import datetime
import hashlib
import importlib.metadata
import json
import pathlib
import platform
import sys
import traceback

from support import ROOT, PROTOCOL_VERSION, server
from verify_authorization import verify_authorization
from verify_cancellation import verify_cancellation
from verify_contracts import verify_contracts


async def command(*args, cwd=ROOT, timeout=90):
    process = await asyncio.create_subprocess_exec(
        *args, cwd=cwd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout)
    except BaseException:
        if process.returncode is None:
            process.kill()
        await process.wait()
        raise
    result = {
        "command": list(args),
        "returncode": process.returncode,
        "stdout": stdout.decode(),
        "stderr": stderr.decode(),
    }
    if process.returncode:
        raise RuntimeError(json.dumps(result))
    return result


def source_hashes():
    names = [
        "server.ts",
        "package.json",
        "package-lock.json",
        "tsconfig.json",
        "verify.sh",
        "README.md",
        "python/requirements.lock",
        "go/main.go",
        "go/go.mod",
        "go/go.sum",
    ]
    names += [
        str(path.relative_to(ROOT)) for path in sorted((ROOT / "python").glob("*.py"))
    ]
    return {
        name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in names
    }


async def verify(report_path):
    report = {
        "format_version": 1,
        "observed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "protocol": PROTOCOL_VERSION,
        "source_sha256": source_hashes(),
        "environment": {
            "python": platform.python_version(),
            "platform": platform.platform(),
            "mcp": importlib.metadata.version("mcp"),
            "mcp-types": importlib.metadata.version("mcp-types"),
            "httpx2": importlib.metadata.version("httpx2"),
        },
        "checks": [],
        "phases": [],
        "limitations": [
            "Selected SDK interoperability checks, not complete protocol conformance.",
            "Synthetic credential lookup only; no OAuth/JWT verifier conformance.",
            "Effects and cache are in memory; no durability, provider rollback or distributed recovery claim.",
            "Python and Go clients against TypeScript only; no reverse language pairs or stdio.",
            "No legacy migration, MRTR, tasks, DPoP, revocation or actual client/gateway cache conformance.",
        ],
    }
    try:
        report["environment"]["node"] = (await command("node", "--version"))[
            "stdout"
        ].strip()
        report["environment"]["go"] = (await command("go", "version"))["stdout"].strip()
        for package in ("server", "core", "node"):
            manifest = (
                ROOT
                / "node_modules"
                / "@modelcontextprotocol"
                / package
                / "package.json"
            )
            report["environment"]["@modelcontextprotocol/" + package] = json.loads(
                manifest.read_text()
            )["version"]
        report["phases"].append(await command("npm", "run", "typecheck"))
        report["phases"].append(
            await command(
                "go",
                "build",
                "-mod=readonly",
                "-o",
                "probe",
                ".",
                cwd=ROOT / "go",
                timeout=180,
            )
        )
        report["environment"]["go_sdk"] = (
            await command(
                "go",
                "list",
                "-m",
                "github.com/modelcontextprotocol/go-sdk",
                cwd=ROOT / "go",
            )
        )["stdout"].strip()
        for label, mode, verify_function in (
            ("python-and-http", "contracts", verify_contracts),
            ("python-cancellation", "contracts", verify_cancellation),
            ("synthetic-authorization-cache", "authorization", verify_authorization),
        ):
            async with server(mode) as endpoint:
                checks = await asyncio.wait_for(verify_function(endpoint), 30)
                for item in checks:
                    item["suite"] = label
                report["checks"].extend(checks)
            report["phases"].append({"suite": label, "server_cleanup": "exited-zero"})
        async with server() as endpoint:
            go_result = await command(str(ROOT / "go" / "probe"), endpoint, timeout=25)
            observed = json.loads(go_result["stdout"])
            for item in observed["checks"]:
                item["suite"] = "go-client"
            report["checks"].extend(observed["checks"])
            report["go_wire_observations"] = observed["server_observations"]["requests"]
        report["phases"].append({"suite": "go-client", "server_cleanup": "exited-zero"})
    except Exception as error:
        report["harness_error"] = {
            "type": type(error).__name__,
            "message": str(error),
            "traceback": traceback.format_exc(),
        }
    report["passed"] = sum(item["passed"] for item in report["checks"])
    report["failed"] = sum(not item["passed"] for item in report["checks"])
    report["status"] = (
        "passed"
        if report["passed"] == 42
        and report["failed"] == 0
        and "harness_error" not in report
        else "failed"
    )
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(
        json.dumps(
            {
                "status": report["status"],
                "passed": report["passed"],
                "failed": report["failed"],
                "report": str(report_path),
            }
        )
    )
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--report", type=pathlib.Path, required=True)
    args = parser.parse_args()
    raise SystemExit(asyncio.run(verify(args.report.resolve())))
