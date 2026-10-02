"""Local arithmetic observation; exit zero is not a correctness assertion."""
import json
from pathlib import Path


def records_by_id(records):
    return {record["operation_id"]: record for record in records}


if __name__ == "__main__":
    history = json.loads(Path("observations.json").read_text())
    left = records_by_id(history["region_a_operations"])
    right = records_by_id(history["region_b_operations"])
    catalog = {**left, **right}
    for operation_id in history["deliveries_to_a"]:
        left[operation_id] = catalog[operation_id]
    for operation_id in history["deliveries_to_b"]:
        right[operation_id] = catalog[operation_id]
    remaining = history["initial_units"] - sum(record["quantity"] for record in left.values())
    print(json.dumps({"left_ids": sorted(left), "right_ids": sorted(right),
                      "same_ids": set(left) == set(right), "remaining_units": remaining,
                      "scope": "finite authored set arithmetic, not a release verifier"},
                     sort_keys=True))
