#!/usr/bin/env python3
"""Explicit local Terraform lifecycle verification; never uses the caller's project."""

import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import platform
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from urllib.request import urlopen
import zipfile


HERE = Path(__file__).resolve().parent
PIN = json.loads((HERE / "terraform.lock.json").read_text())
VERSION = PIN["version"]


class ProbeError(Exception):
    pass


class TerminationRequested(Exception):
    def __init__(self, signum):
        super().__init__(f"received signal {signum}")
        self.signum = signum


class Termination:
    def __init__(self):
        self.signum = None
        self.spawning = False

    def handle(self, signum, frame):
        # Let the first request finish child and directory cleanup even when
        # a supervisor sends TERM repeatedly during that cleanup.
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        self.signum = signum
        if not self.spawning:
            self.check()

    def check(self):
        if self.signum is not None:
            raise TerminationRequested(self.signum)


def require(condition, message):
    if not condition:
        raise ProbeError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def now():
    return datetime.now(timezone.utc).isoformat()


def fetch(url, limit):
    with urlopen(url, timeout=30) as response:
        data = response.read(limit + 1)
    require(len(data) <= limit, f"Download exceeds expected size limit: {url}")
    return data


def prepare_binary(args, scratch, report):
    if args.terraform:
        require(args.terraform_sha256 is not None, "--terraform requires --terraform-sha256 to pin the supplied executable")
        require(re.fullmatch(r"[0-9a-fA-F]{64}", args.terraform_sha256) is not None, "Executable SHA-256 must contain 64 hexadecimal digits")
        source = Path(args.terraform).expanduser().resolve(strict=True)
        binary_data = source.read_bytes()
        expected = args.terraform_sha256.lower()
        require(digest(binary_data) == expected, "Supplied executable checksum mismatch; it was not executed")
        executable = scratch / "terraform"
        executable.write_bytes(binary_data)
        report["binary"] = {"source": "supplied", "sha256": expected, "publisher_authentication": "caller responsibility"}
    else:
        require(args.terraform_sha256 is None, "--terraform-sha256 requires --terraform")
        system = platform.system().lower()
        machine = {"x86_64": "amd64", "aarch64": "arm64", "arm64": "arm64"}.get(platform.machine().lower())
        target = f"{system}_{machine}"
        require(target in PIN["archives"], f"No pinned download for {target}; supported downloads are macOS/Linux amd64/arm64")
        archive_name = f"terraform_{VERSION}_{target}.zip"
        checksum_url = PIN["release_base"] + f"terraform_{VERSION}_SHA256SUMS"
        checksum_data = fetch(checksum_url, 256_000)
        checksums = dict((parts[1].lstrip("*"), parts[0]) for line in checksum_data.decode().splitlines() if len(parts := line.split()) == 2)
        expected = PIN["archives"][target]
        require(checksums.get(archive_name) == expected, "Official checksum differs from the repository pin; review the release before changing the pin")
        archive_url = PIN["release_base"] + archive_name
        payload = fetch(archive_url, 100_000_000)
        require(digest(payload) == expected, "Downloaded archive checksum mismatch; nothing was executed")
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            member = archive.getinfo("terraform")
            require(member.file_size <= 250_000_000, "Executable exceeds expected size limit")
            binary_data = archive.read(member)
        executable = scratch / "terraform"
        executable.write_bytes(binary_data)
        report["binary"] = {"source": "official-download", "archive_url": archive_url, "archive_sha256": expected, "checksum_url": checksum_url, "checksum_manifest_sha256": digest(checksum_data), "sha256": digest(binary_data), "release_signature_verified": False}
    executable.chmod(0o700)
    return executable


def stop_process(process):
    # Each invocation owns a process group, including its local provisioner shell.
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        return process.communicate(timeout=3)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        return process.communicate(timeout=3)
    finally:
        # A terminated parent can leave a descendant in the group even after
        # its pipes close; the timeout owns termination of that entire group.
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass


class Probe:
    def __init__(self, executable, scratch, report, termination):
        self.executable = executable
        self.scratch = scratch
        self.report = report
        self.termination = termination
        self.project = scratch / "project"
        self.project.mkdir()
        (scratch / "tmp").mkdir()
        (scratch / "terraform.rc").write_text("disable_checkpoint = true\n")
        self.environment = {
            "PATH": "/usr/bin:/bin:/usr/sbin:/sbin",
            "TMPDIR": str(scratch / "tmp"),
            "TF_CLI_CONFIG_FILE": str(scratch / "terraform.rc"),
            "TF_IN_AUTOMATION": "1",
            "CHECKPOINT_DISABLE": "1",
        }

    def run(self, label, args, expected=0):
        started = time.monotonic()
        argv = [str(self.executable), *args]
        process = None
        timed_out = False
        interrupted = None
        stdout, stderr = "", ""
        try:
            # Defer raising TERM until Popen returns its owned process handle.
            # The child still inherits the ordinary, unblocked signal mask.
            self.termination.spawning = True
            try:
                process = subprocess.Popen(argv, cwd=self.project, env=self.environment, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
            finally:
                self.termination.spawning = False
            self.termination.check()
            stdout, stderr = process.communicate(timeout=45)
        except subprocess.TimeoutExpired:
            timed_out = True
            stdout, stderr = stop_process(process)
        except BaseException as error:
            interrupted = error
            if process is not None:
                stdout, stderr = stop_process(process)
        finally:
            result = {"label": label, "argv": ["terraform", *args], "exit_code": process.returncode if process is not None else None, "expected_exit_code": expected, "timed_out": timed_out, "interrupted": interrupted is not None, "elapsed_ms": round((time.monotonic() - started) * 1000), "stdout": stdout, "stderr": stderr}
            self.report["commands"].append(result)
        if interrupted is not None:
            raise interrupted
        require(not timed_out, f"{label} exceeded the 45-second command deadline")
        require(process.returncode == expected, f"{label}: expected exit {expected}, observed {process.returncode}; see command output")
        return result

    def configure(self, name):
        source = HERE / "fixtures" / name / "main.tf"
        shutil.copyfile(source, self.project / "main.tf")
        self.report["configuration_transitions"].append({"fixture": name, "before_command_index": len(self.report["commands"]), "sha256": digest(source.read_bytes())})

    def plan(self, name, variables):
        self.run(name, ["plan", "-no-color", "-input=false", "-detailed-exitcode", f"-out={name}.tfplan", *variables], 2)
        value = json.loads(self.run(name + "-json", ["show", "-json", f"{name}.tfplan"])["stdout"])
        return {change["address"]: change for change in value.get("resource_changes", [])}

    def apply(self, name, expected=0):
        return self.run(name + "-apply", ["apply", "-no-color", "-input=false", name + ".tfplan"], expected)

    def state(self, name):
        raw = json.loads((self.project / "terraform.tfstate").read_text())
        value = json.loads(self.run(name, ["show", "-json"])["stdout"])
        return raw, {r["address"]: r for r in value["values"]["root_module"]["resources"]}

    def check(self, name, evidence):
        self.report["checks"].append({"name": name, "status": "passed", "evidence": evidence})

    def verify(self):
        version = json.loads(self.run("version", ["version", "-json"])["stdout"])
        self.report["runtime"] = version
        require(version["terraform_version"] == VERSION, f"This example requires Terraform {VERSION}")
        self.configure("initial")
        self.run("init", ["init", "-no-color", "-input=false"])
        self.plan("failing-plan", [])
        self.apply("failing-plan", expected=1)
        raw, resources = self.state("after-failure")
        first_id = resources["terraform_data.first"]["values"]["id"]
        later_id = resources["terraform_data.later"]["values"]["id"]
        later = next(r for r in raw["resources"] if r["name"] == "later")
        require(later["instances"][0].get("status") == "tainted", "Failed creation did not leave the expected tainted resource")
        require((self.project / "first-events.txt").read_text() == "first-created\n", "Completed first effect was not preserved")
        require(not (self.project / "later-effect.txt").exists(), "Later operation unexpectedly succeeded")
        self.check("partial-apply-persists", {"first_id": first_id, "later_id": later_id, "later_status": "tainted", "serial": raw["serial"]})

        healthy = ["-var=fail_later=false"]
        changes = self.plan("recovery-plan", healthy)
        require(changes["terraform_data.first"]["change"]["actions"] == ["no-op"], "Recovery would change the completed resource")
        require(changes["terraform_data.later"]["change"]["actions"] == ["delete", "create"], "Recovery does not replace the tainted resource")
        self.apply("recovery-plan")
        _, resources = self.state("after-recovery")
        require(resources["terraform_data.first"]["values"]["id"] == first_id, "Recovery replaced the completed resource")
        require(resources["terraform_data.later"]["values"]["id"] != later_id, "Failed resource was not replaced")
        require((self.project / "first-events.txt").read_text() == "first-created\n", "Recovery repeated the completed external effect")
        require((self.project / "later-effect.txt").read_text() == "later-recovered\n", "Recovery effect is absent")
        self.check("recovery-preserves-completed-work", {"first_id": first_id, "first_create_count": 1, "restored_old_state_file": False})

        self.plan("reviewed-plan", [*healthy, "-var=first_value=reviewed"])
        current = [*healthy, "-var=first_value=intervening"]
        self.plan("intervening-plan", current)
        self.apply("intervening-plan")
        rejected = self.apply("reviewed-plan", expected=1)
        require("Saved plan is stale" in rejected["stderr"], "Old plan failed for an unexpected reason")
        raw, resources = self.state("after-stale-rejection")
        require(resources["terraform_data.first"]["values"]["input"] == "intervening", "Old plan overwrote the intervening state")
        self.check("saved-plan-staleness", {"message": "Saved plan is stale", "serial": raw["serial"], "cloud_drift_tested": False})

        self.configure("moved")
        changes = self.plan("move-plan", current)
        moved = changes["terraform_data.first_renamed"]
        require(moved.get("previous_address") == "terraform_data.first", "Move did not identify the previous address")
        require(moved["change"]["actions"] == ["no-op"], "Address migration changed resource behavior")
        self.apply("move-plan")
        _, resources = self.state("after-move")
        require(resources["terraform_data.first_renamed"]["values"]["id"] == first_id, "Move replaced resource identity")
        require((self.project / "first-events.txt").read_text() == "first-created\n", "Move repeated creation")
        self.check("same-state-move", {"from": "terraform_data.first", "to": "terraform_data.first_renamed", "preserved_id": first_id})

        self.configure("retained")
        changes = self.plan("retention-plan", current)
        require(changes["terraform_data.first_renamed"]["change"]["actions"] == ["forget"], "Retained removal is not a forget action")
        self.apply("retention-plan")
        _, resources = self.state("after-retention")
        require("terraform_data.first_renamed" not in resources, "Ownership remains in source state")
        require(not (self.project / "first-destroy.txt").exists(), "Retained removal executed a destroy provisioner")
        require((self.project / "first-events.txt").read_text() == "first-created\n", "Retained removal lost the local effect")
        self.check("retained-removal", {"action": "forget", "source_ownership_removed": True, "destroy_hook_executed": False, "destination_import_tested": False})

        self.run("cleanup-managed-state", ["destroy", "-auto-approve", "-no-color", "-input=false", *current])
        empty = self.run("cleanup-state-list", ["state", "list"])
        require(empty["stdout"].strip() == "", "Managed test state is not empty after cleanup")
        self.report["cleanup"]["managed_state_empty"] = True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--terraform", help="Use a preverified executable instead of downloading the pinned release")
    parser.add_argument("--terraform-sha256", help="Expected digest of the supplied executable, checked before execution")
    parser.add_argument("--report", type=Path, help="Write full JSON evidence here and print a compact result")
    args = parser.parse_args()
    report = {
        "schema_version": 1,
        "status": "running",
        "started_at": now(),
        "expected_terraform_version": VERSION,
        "commands": [],
        "checks": [],
        "configuration_transitions": [],
        "cleanup": {"managed_state_empty": False, "temporary_directory_removed": False},
        "scope": {"cloud_resources": False, "external_provider_downloads": False, "global_install": False},
        "limits": ["Local terraform_data and scratch effects only; no cloud provider or physical resource tested.", "State-update staleness was tested; out-of-band cloud drift was not.", "Same-state moves and source forgetting were tested; cross-state adoption and remote locking were not.", "local-exec is a fault injector here, not a general provisioning recommendation."],
        "source_hashes": {str(path.relative_to(HERE)): digest(path.read_bytes()) for path in [HERE / "verify.py", HERE / "terraform.lock.json", *sorted((HERE / "fixtures").rglob("*.tf"))]},
    }
    scratch = None
    termination = Termination()
    previous_term_handler = signal.getsignal(signal.SIGTERM)
    try:
        require(os.name == "posix", "This example requires macOS or Linux")
        signal.signal(signal.SIGTERM, termination.handle)
        with tempfile.TemporaryDirectory(prefix="tal-infrastructure-") as directory:
            scratch = Path(directory)
            executable = prepare_binary(args, scratch, report)
            Probe(executable, scratch, report, termination).verify()
        report["status"] = "passed"
    except (Exception, KeyboardInterrupt) as error:
        report["status"] = "failed"
        report["error"] = f"{type(error).__name__}: {error}"
        if isinstance(error, TerminationRequested):
            report["termination_signal"] = error.signum
    finally:
        report["finished_at"] = now()
        report["cleanup"]["temporary_directory_removed"] = scratch is None or not scratch.exists()
        signal.signal(signal.SIGTERM, previous_term_handler)
    if args.report:
        try:
            args.report.write_text(json.dumps(report, indent=2) + "\n")
        except OSError as error:
            report["status"] = "failed"
            report["report_write_error"] = str(error)
            print(json.dumps(report, indent=2))
        else:
            print(json.dumps({"status": report["status"], "passed_checks": len(report["checks"]), "report": str(args.report.resolve()), "cleanup": report["cleanup"], "error": report.get("error")}))
    else:
        print(json.dumps(report, indent=2))
    if "termination_signal" in report:
        return 128 + report["termination_signal"]
    return 0 if report["status"] == "passed" else 1


if __name__ == "__main__":
    sys.exit(main())
