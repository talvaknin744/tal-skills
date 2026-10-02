"""Read-only projection of supplied synthetic facts; no worker/adapters run."""
import json
from pathlib import Path

def summarize():
    d = json.loads(Path("deployment.json").read_text())
    s = json.loads(Path("observations.json").read_text())["schedules"]
    return {
        "kind": "synthetic_artifact_arithmetic_only",
        "retirement_business_counts": [e["business_failures_after"] for e in s["three_retirements"]["events"]],
        "retirement_maintenance_counts": [e["maintenance_deferrals_after"] for e in s["three_retirements"]["events"]],
        "poison_business_counts": s["poison_control"]["business_failures_after"],
        "sigterm_application_budget_seconds": d["terminationGracePeriodSeconds"] - d["preStop"]["seconds"],
        "configured_handler_wait_seconds": d["handler_wait_seconds"],
        "buffered_at_signal": len(s["signal_prefetch"]["buffered_not_started"]),
        "receive_returned_after_signal": s["signal_prefetch"]["events"][2]["delivery"],
        "confirmed_cursor_after_inspect": s["checkpoint_reply_loss"]["store_inspect"]["cursor"],
        "epoch_before_old_resume": s["pause_resume"]["current_epoch_before_step5"],
        "redelivered_final_receipt": s["final_ack_loss"]["stored_final_result_receipt"],
        "revision7_read_formats": d["image_matrix"]["7"]["reads"],
        "revision8_default_write_format": d["image_matrix"]["8"]["default_writes"]
    }

if __name__ == "__main__":
    print(json.dumps(summarize(), sort_keys=True))
