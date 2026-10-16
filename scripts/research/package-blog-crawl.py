#!/usr/bin/env python3
"""Retain readable crawl evidence and declare unavailable receipt objects."""
import argparse
import datetime as dt
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile

REPOSITORY = Path(__file__).resolve().parents[2]
RECEIPT_FILES = {"attempts.jsonl", "body-events.jsonl", "discovery-events.jsonl", "article-state.jsonl",
                 "source-state.jsonl", "runs.jsonl", "summary.json"}


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat()


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def open_binary(path):
    return Path(path).open("rb")


def error_record(error):
    return {"error_type": type(error).__name__, "errno": getattr(error, "errno", None)}


def file_digest(path):
    sha = hashlib.sha256()
    size = 0
    with open_binary(path) as handle:
        while chunk := handle.read(1024 * 1024):
            sha.update(chunk)
            size += len(chunk)
    return sha.hexdigest(), size


def inspect_source(root):
    inventory = []
    def walk_error(error):
        path = Path(error.filename)
        inventory.append({"path": path.relative_to(root).as_posix(), "status": "directory_unavailable", **error_record(error)})
    for directory, directories, files in os.walk(root, followlinks=False, onerror=walk_error):
        directories.sort()
        files.sort()
        for name in list(directories):
            path = Path(directory) / name
            if path.is_symlink():
                directories.remove(name)
                inventory.append({"path": path.relative_to(root).as_posix(), "status": "symlink_skipped", "link_target": os.readlink(path)})
        for name in files:
            path = Path(directory) / name
            relative = path.relative_to(root).as_posix()
            if relative.startswith("archive-evidence/"):
                raise ValueError("Reserved archive evidence path already exists in source")
            if path.is_symlink():
                inventory.append({"path": relative, "status": "symlink_skipped", "link_target": os.readlink(path)})
                continue
            try:
                before = path.stat()
                if not path.is_file():
                    inventory.append({"path": relative, "status": "special_file_skipped"})
                    continue
                sha, size = file_digest(path)
                after = path.stat()
                if size != before.st_size or before.st_size != after.st_size or before.st_mtime_ns != after.st_mtime_ns:
                    raise ValueError("Source changed during inspection: " + relative)
                inventory.append({"path": relative, "status": "included", "bytes": size, "sha256": sha,
                                  "mtime_ns": before.st_mtime_ns, "mode": before.st_mode & 0o777})
            except OSError as error:
                inventory.append({"path": relative, "status": "unavailable", **error_record(error)})
            if len(inventory) % 5000 == 0:
                print(json.dumps({"phase": "inspect", "source_entries_inspected": len(inventory)}), flush=True)
    return sorted(inventory, key=lambda row: row["path"])


def receipt_object_gaps(root, inventory):
    by_path = {row["path"]: row for row in inventory}
    references = {}
    for row in inventory:
        path = Path(row["path"])
        if len(path.parts) != 3 or path.parts[0] != "publishers" or path.name not in RECEIPT_FILES:
            continue
        if row["status"] != "included":
            continue
        publisher = path.parts[1]
        def walk(node, origin):
            if isinstance(node, dict):
                relative, sha = node.get("object_path"), node.get("sha256")
                if isinstance(relative, str) and isinstance(sha, str) and re.fullmatch(r"[a-f0-9]{64}", sha):
                    candidate = (root / "publishers" / publisher / relative).resolve()
                    if root not in candidate.parents:
                        raise ValueError("Unsafe receipt object path: " + relative)
                    archive_path = candidate.relative_to(root).as_posix()
                    entry = references.setdefault((archive_path, sha), {"path": archive_path, "expected_sha256": sha, "references": []})
                    entry["references"].append(origin)
                    if node.get("bytes") is not None:
                        entry.setdefault("declared_byte_counts", set()).add(node["bytes"])
                for value in node.values():
                    walk(value, origin)
            elif isinstance(node, list):
                for value in node:
                    walk(value, origin)
        with (root / path).open(encoding="utf-8") as handle:
            if path.suffix == ".jsonl":
                for number, line in enumerate(handle, 1):
                    if line.strip():
                        walk(json.loads(line), {"file": path.as_posix(), "line": number})
            else:
                walk(json.load(handle), {"file": path.as_posix()})
    gaps = []
    for key, ref in sorted(references.items()):
        actual = by_path.get(ref["path"])
        if actual and actual["status"] == "included":
            if actual["sha256"] != ref["expected_sha256"]:
                raise ValueError("Receipt object hash mismatch: " + ref["path"])
            counts = ref.get("declared_byte_counts", set())
            if any(count != actual["bytes"] for count in counts):
                raise ValueError("Receipt object byte count mismatch: " + ref["path"])
        else:
            ref["status"] = "missing" if actual is None else actual["status"]
            if ref.get("declared_byte_counts"):
                ref["declared_byte_counts"] = sorted(ref["declared_byte_counts"])
            gaps.append(ref)
    return gaps


def jsonl_bytes(rows):
    return "".join(json.dumps(row, sort_keys=True) + "\n" for row in rows).encode()


def verify_archive(path, expected, compression="zstd"):
    process = None
    if compression == "zstd":
        process = subprocess.Popen(["zstd", "--decompress", "--stdout", "--quiet", str(path)], stdout=subprocess.PIPE)
        stream = process.stdout
    else:
        stream = Path(path).open("rb")
    remaining = {row["path"]: row for row in expected}
    verified = 0
    failure = None
    try:
        with tarfile.open(fileobj=stream, mode="r|") as archive:
            for member in archive:
                if not member.isfile() or member.name not in remaining:
                    raise ValueError("Unexpected or duplicate archive member: " + member.name)
                row = remaining.pop(member.name)
                sha = hashlib.sha256()
                size = 0
                with archive.extractfile(member) as handle:
                    while chunk := handle.read(1024 * 1024):
                        sha.update(chunk)
                        size += len(chunk)
                if size != row["bytes"] or sha.hexdigest() != row["sha256"]:
                    raise ValueError("Archive member content mismatch: " + member.name)
                verified += 1
        if remaining:
            raise ValueError("Archive members missing: " + str(len(remaining)))
        while stream.read(1024 * 1024):
            pass
    except BaseException as error:
        failure = error
        raise
    finally:
        stream.close()
        if process:
            if failure and process.poll() is None:
                process.terminate()
            code = process.wait()
            if code and failure is None:
                raise ValueError("Archive decompressor failed: " + str(code))
    return verified


def package(root, output, compression="zstd", threads=4):
    root, output = Path(root).resolve(), Path(output).resolve()
    if not root.is_dir() or root == REPOSITORY or REPOSITORY in root.parents:
        raise ValueError("Source must be an external evidence directory")
    if output == root or root in output.parents:
        raise ValueError("Archive output must be outside the input tree")
    if output == REPOSITORY or REPOSITORY in output.parents:
        raise ValueError("Archive output must be outside the repository")
    if output.exists():
        raise ValueError("Existing archive is preserved; choose a fresh output")
    if compression == "zstd" and not shutil.which("zstd"):
        raise ValueError("Zstandard CLI unavailable")
    output.parent.mkdir(parents=True, exist_ok=True)
    evidence = output.parent / (output.name + ".evidence")
    evidence.mkdir(exist_ok=False)
    attempts = evidence / "attempts.jsonl"
    def event(row):
        with attempts.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps({"at": now(), **row}) + "\n")
    partial = output.with_name(output.name + ".partial")
    try:
        event({"status": "started", "source_directory": root.name, "archive_file": output.name, "compression": compression})
        inventory = inspect_source(root)
        gaps = receipt_object_gaps(root, inventory)
        members = [{key: row[key] for key in ["path", "bytes", "sha256"]} for row in inventory if row["status"] == "included"]
        unavailable = [row for row in inventory if row["status"] != "included"]
        payloads = {"source-inventory.jsonl": jsonl_bytes(inventory), "member-manifest.jsonl": jsonl_bytes(members),
                    "receipt-object-gaps.jsonl": jsonl_bytes(gaps)}
        embedded = []
        for name, data in payloads.items():
            (evidence / name).write_bytes(data)
            embedded.append({"path": "archive-evidence/" + name, "bytes": len(data), "sha256": sha256(data)})
        event({"status": "inspected", "readable_members": len(members), "unavailable_source_entries": len(unavailable), "receipt_object_gaps": len(gaps)})
        print(json.dumps({"phase": "pack", "readable_members": len(members), "declared_source_gaps": len(unavailable), "declared_receipt_gaps": len(gaps)}), flush=True)
        with partial.open("xb") as destination:
            process = subprocess.Popen(["zstd", "--quiet", "--threads=" + str(threads), "-3", "--stdout"], stdin=subprocess.PIPE, stdout=destination) if compression == "zstd" else None
            stream = process.stdin if process else destination
            try:
                with tarfile.open(fileobj=stream, mode="w|") as archive:
                    for index, row in enumerate(inventory):
                        if row["status"] != "included":
                            continue
                        path = root / row["path"]
                        stat = path.stat()
                        if stat.st_size != row["bytes"] or stat.st_mtime_ns != row["mtime_ns"]:
                            raise ValueError("Source changed before packing: " + row["path"])
                        info = tarfile.TarInfo(row["path"])
                        info.size, info.mode, info.mtime = row["bytes"], row["mode"], stat.st_mtime
                        with open_binary(path) as handle:
                            archive.addfile(info, handle)
                        if index % 5000 == 0:
                            print(json.dumps({"phase": "pack", "source_entries_processed": index, "source_entries_total": len(inventory)}), flush=True)
                    for row in embedded:
                        info = tarfile.TarInfo(row["path"])
                        info.size, info.mode = row["bytes"], 0o644
                        archive.addfile(info, io.BytesIO(payloads[Path(row["path"]).name]))
            finally:
                if process:
                    stream.close()
                    code = process.wait()
                    if code:
                        raise ValueError("Archive compressor failed: " + str(code))
        print(json.dumps({"phase": "verify", "expected_members": len(members) + len(embedded)}), flush=True)
        verified = verify_archive(partial, members + embedded, compression)
        sha, size = file_digest(partial)
        partial.replace(output)
        receipt = {"schema_version": 1, "completed_at": now(), "archive_file": output.name, "archive_bytes": size,
                   "archive_sha256": sha, "compression": compression, "source_member_count": len(members),
                   "verified_archive_member_count": verified, "structural_and_content_verification": "passed",
                   "unavailable_source_entry_count": len(unavailable), "receipt_object_gap_count": len(gaps),
                   "unavailable_source_entries": unavailable, "receipt_object_gaps": gaps,
                   "evidence_files": [{"file": name, "bytes": len(data), "sha256": sha256(data)} for name, data in payloads.items()],
                   "embedded_evidence_members": embedded,
                   "limits": ["Unavailable files and missing receipt objects are declared and excluded from readable member verification.",
                              "No permissions, encoding, path or access workaround was used.", "Historical failures and earlier report versions remain included."]}
        (evidence / "receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
        event({"status": "verified", "archive_sha256": sha, "archive_bytes": size, "verified_members": verified})
        return receipt
    except Exception as error:
        event({"status": "failed", "error_type": type(error).__name__, "error": str(error), "partial_archive_retained": partial.exists()})
        raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--compression", choices=["zstd", "none"], default="zstd")
    parser.add_argument("--threads", type=int, default=4)
    args = parser.parse_args()
    if not 1 <= args.threads <= 16:
        raise SystemExit("Compression threads must be between one and sixteen")
    print(json.dumps(package(args.source_root, args.output, args.compression, args.threads), indent=2), flush=True)
