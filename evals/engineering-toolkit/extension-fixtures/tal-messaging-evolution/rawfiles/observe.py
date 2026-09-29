"""Local log arithmetic only; no Kafka client or effects are executed."""
import json
from pathlib import Path

case = json.loads(Path("cutover.json").read_text())
records = case["target"]["records"]
completed = set(case["effect_receipts"])
accepted = {row["event_id"] for row in case["source"]["records"]}
start = case["proposed_target_next_offset"]
selected = [row["event_id"] for row in records if row["offset"] >= start]
checkpoint_start = case["translation_checkpoint"]["conservative_target_start"]
checkpoint_selected = [row["event_id"] for row in records if row["offset"] >= checkpoint_start]
print(json.dumps({
    "kind": "synthetic_log_observation",
    "proposal_target_next_offset": start,
    "proposal_read_ids": selected,
    "accepted_ids_without_receipt_or_selected_record": sorted(accepted - completed - set(selected)),
    "checkpoint_target_start": checkpoint_start,
    "checkpoint_read_ids": checkpoint_selected,
    "checkpoint_ids_already_receipted": sorted(set(checkpoint_selected) & completed),
    "active_target_members": case["target"]["active_members"],
    "source_fence_confirmed": case["source"]["fence_confirmed"],
    "group_sync_position_observed": case["operator_report"]["group_sync_position_observed"]
}, sort_keys=True))
