"""Read-only arithmetic over supplied schedules; no clock/cancellation API calls."""
import json
from pathlib import Path

def summarize():
    t = json.loads(Path("timeline.json").read_text())
    s = t["lost_reply_schedule"]
    returned = next(e for e in s["events"] if e["kind"] == "native_compression_returns")
    return {
        "kind": "synthetic_artifact_arithmetic_only",
        "application_budget_seconds": t["platform_budget_seconds"] - t["preStop_seconds"],
        "remaining_at_native_return_monotonic": t["handler_hard_deadline_monotonic"] - returned["monotonic"],
        "remaining_at_native_return_wall_naive": 1060 - returned["wall"],
        "checkpoint_timeout_seconds": 56,
        "release_timeout_if_alive_seconds": 64,
        "new_epoch_before_native_return": 13,
        "last_confirmed_cursor": s["last_confirmed_cursor"],
        "attempted_cursor": s["attempted_cursor"],
        "final_result_receipt": s["final_result_receipt"],
        "ledger_reachable": s["ledger_reachable"],
        "ledger_entry_written": s["ledger_entry_written"]
    }

if __name__ == "__main__":
    print(json.dumps(summarize(), sort_keys=True))
