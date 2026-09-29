"""Local, read-only reconciliation around the supplied copy/parse restore."""

from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import platform
import subprocess
import sys
import time
import uuid


ROOT = Path(__file__).resolve().parent.parent
SOURCES = (
    "backup.json", "accepted-manifest.json", "effects.json",
    "recovery-contract.md", "restore.py", "prompt.md",
)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_digests():
    return {name: digest(ROOT / name) for name in SOURCES}


def read_json(path):
    return json.loads(path.read_text())


started_utc = datetime.now(timezone.utc)
started_ns = time.perf_counter_ns()
target = ROOT / "scratch" / (
    "rehearsal-" + started_utc.strftime("%Y%m%dT%H%M%S%fZ")
    + "-" + uuid.uuid4().hex[:8]
)
assert not target.exists(), "Restore destination must be new"
before = source_digests()
command = [sys.executable, "-B", "restore.py", "backup.json", str(target)]
import_started_ns = time.perf_counter_ns()
result = subprocess.run(
    command, cwd=ROOT, capture_output=True, text=True, timeout=30, check=False,
)
import_finished_ns = time.perf_counter_ns()
if result.returncode != 0:
    raise SystemExit(f"Restore failed: {result.returncode}: {result.stderr}")

manifest = read_json(ROOT / "accepted-manifest.json")
ledger = read_json(target / "ledger.json")
effects = read_json(ROOT / "effects.json")["effects"]
accepted = {row["id"]: row for row in manifest["orders"]}
restored = {row["id"]: row for row in ledger["orders"]}
accepted_ids, restored_ids = set(accepted), set(restored)
missing = sorted(accepted_ids - restored_ids)
unexpected = sorted(restored_ids - accepted_ids)
fields = ("payload_version", "amount", "effect_id")
mismatches = {
    order_id: {
        field: {"expected": accepted[order_id][field], "observed": restored[order_id][field]}
        for field in fields if accepted[order_id][field] != restored[order_id][field]
    }
    for order_id in sorted(accepted_ids & restored_ids)
}
mismatches = {key: value for key, value in mismatches.items() if value}
exact_matches = sorted((accepted_ids & restored_ids) - set(mismatches))
duplicate_accepted_ids = {k: v for k, v in Counter(row["id"] for row in manifest["orders"]).items() if v > 1}
duplicate_restored_ids = {k: v for k, v in Counter(row["id"] for row in ledger["orders"]).items() if v > 1}
effect_comparisons = {}
for order_id, expected in accepted.items():
    related = [e for e in effects if e["order_id"] == order_id or e["effect_id"] == expected["effect_id"]]
    matching = [e for e in related if (e["order_id"], e["effect_id"], e["amount"]) == (order_id, expected["effect_id"], expected["amount"])]
    effect_comparisons[order_id] = {
        "expected_effect_id": expected["effect_id"], "expected_amount": expected["amount"],
        "expected_receipts": 1, "observed_receipts": len(related),
        "matching_receipts": len(matching), "receipts": related,
        "valid": len(related) == len(matching) == 1,
    }
unmapped_effects = [
    e for e in effects
    if e["order_id"] not in accepted_ids
    or e["effect_id"] not in {row["effect_id"] for row in accepted.values()}
]
duplicate_receipt_ids = {k: v for k, v in Counter(e["provider_receipt"] for e in effects).items() if v > 1}
completed = ledger["checkpoint"]["completed_order_ids"]
completed_ids = set(completed)
checkpoint = {
    "observed": ledger["checkpoint"],
    "completed_but_missing": sorted(completed_ids - restored_ids),
    "completed_but_payload_mismatched": sorted(completed_ids & set(mismatches)),
    "completed_but_effect_invalid": sorted(order_id for order_id in completed_ids if order_id not in effect_comparisons or not effect_comparisons[order_id]["valid"]),
    "completed_but_unaccepted": sorted(completed_ids - accepted_ids),
    "accepted_but_not_completed": sorted(accepted_ids - completed_ids),
    "restored_but_not_completed": sorted(restored_ids - completed_ids),
    "duplicate_completed_ids": len(completed) != len(completed_ids),
    "count_matches_manifest": ledger["checkpoint"]["accepted_count"] == len(manifest["orders"]),
    "count_matches_restored": ledger["checkpoint"]["accepted_count"] == len(ledger["orders"]),
    "completed_id_set_matches_accepted": completed_ids == accepted_ids,
}
after = source_digests()
preserved = before == after
copy_matches = digest(target / "ledger.json") == before["backup.json"]
data_valid = not (missing or unexpected or mismatches or duplicate_accepted_ids or duplicate_restored_ids)
effects_valid = all(row["valid"] for row in effect_comparisons.values()) and not (unmapped_effects or duplicate_receipt_ids)
checkpoint_valid = not any(checkpoint[key] for key in (
    "completed_but_missing", "completed_but_payload_mismatched", "completed_but_effect_invalid",
    "completed_but_unaccepted", "accepted_but_not_completed", "duplicate_completed_ids",
)) and checkpoint["count_matches_manifest"]
integrity_valid = data_valid and effects_valid and checkpoint_valid and preserved and copy_matches
finished_ns = time.perf_counter_ns()
finished_utc = datetime.now(timezone.utc)
snapshot = datetime.fromisoformat(ledger["snapshot_time"].replace("Z", "+00:00"))
reference = datetime.fromisoformat(manifest["reference_time"].replace("Z", "+00:00"))
evidence = {
    "mode": "Native local subprocess restore; offline artifact reconciliation; no external calls, replay, repairs, or write reopening",
    "target": str(target), "runtime": {"python": sys.version, "executable": sys.executable, "platform": platform.platform()},
    "command": command, "restore": {"exit_code": result.returncode, "stdout": result.stdout, "stderr": result.stderr},
    "timing": {
        "started_utc": started_utc.isoformat(), "validation_finished_utc": finished_utc.isoformat(),
        "clock": "time.perf_counter_ns", "start_boundary": "before source fingerprinting and local restore",
        "end_boundary": "after data/effect/checkpoint reconciliation and source-preservation checks; before evidence/report serialization and independent review",
        "import_seconds": (import_finished_ns - import_started_ns) / 1e9,
        "elapsed_processing_seconds": (finished_ns - started_ns) / 1e9,
        "integrity_validated_at_seconds": (finished_ns - started_ns) / 1e9 if integrity_valid else None,
        "writes_could_safely_reopen_at_seconds": None,
    },
    "source_sha256_before": before, "source_sha256_after": after,
    "sources_unchanged": preserved, "restored_ledger_sha256": digest(target / "ledger.json"),
    "restored_ledger_byte_identical_to_backup": copy_matches, "validator_sha256": digest(Path(__file__)),
    "manifest_reference_time": manifest["reference_time"], "snapshot_time": ledger["snapshot_time"],
    "snapshot_age_at_reference_seconds": (reference - snapshot).total_seconds(),
    "data": {
        "accepted_count": len(manifest["orders"]), "restored_count": len(ledger["orders"]),
        "missing_accepted_orders": missing, "unexpected_restored_orders": unexpected,
        "payload_mismatches": mismatches, "exact_accepted_matches": exact_matches,
        "duplicate_accepted_ids": duplicate_accepted_ids, "duplicate_restored_ids": duplicate_restored_ids,
        "accepted_orders": manifest["orders"], "restored_orders": ledger["orders"], "valid": data_valid,
    },
    "effects": {
        "orders": effect_comparisons, "unmapped_effects": unmapped_effects,
        "duplicate_provider_receipt_ids": duplicate_receipt_ids,
        "expected_count": len(accepted), "observed_count": len(effects),
        "expected_total_amount": sum(row["amount"] for row in accepted.values()),
        "observed_total_amount": sum(e["amount"] for e in effects), "valid": effects_valid,
    },
    "checkpoint": {**checkpoint, "valid": checkpoint_valid},
    "objectives": {
        "rpo": {"objective": "zero accepted orders or payload changes lost through manifest reference", "met": data_valid, "loss_duration_seconds": None},
        "rto": {"objective_seconds": 30, "met": False, "time_to_safe_reopening_seconds": None, "reason": "integrity did not pass; processing time is not recovery time"},
    },
    "integrity_valid": integrity_valid, "write_reopening_verdict": "BLOCKED",
    "limitations": [
        "Local JSON import and reconciliation do not establish production outage RTO or actual provider behavior.",
        "No per-order acceptance timestamps are supplied; 60-second snapshot age is not an observed temporal RPO.",
        "No application schema version, service boot, health check, consumer state, or live dependency evidence is supplied.",
        "The supplied script only copies and parses; success does not validate application integrity.",
    ],
}
(target / "evidence.json").write_text(json.dumps(evidence, indent=2) + "\n")
print(json.dumps({"target": str(target), "timing": evidence["timing"], "integrity_valid": integrity_valid, "sources_unchanged": preserved}, indent=2))
