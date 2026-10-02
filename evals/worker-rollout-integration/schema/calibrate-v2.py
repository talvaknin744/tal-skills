"""Private input-oracle calibration; never staged into the candidate project."""

import argparse
import copy
import csv
import json
from pathlib import Path


ROW_FIELDS = ("key", "incarnation", "source_rev", "status_code", "mapped_rev")


def read_csv(filename):
    with filename.open(newline="", encoding="utf-8") as source:
        return list(csv.DictReader(source))


def expected_rows(commits, status_codes, cut):
    """Replay only definitive business commits, then apply the separate contract."""
    live = {}
    for commit in sorted(commits, key=lambda row: int(row["commit"])):
        if int(commit["commit"]) > cut or commit["result"] != "committed":
            continue
        key = commit["key"]
        if commit["operation"] == "delete":
            assert live[key]["incarnation"] == commit["incarnation"]
            del live[key]
        else:
            assert commit["operation"] in ("create", "update")
            if commit["operation"] == "update":
                assert live[key]["incarnation"] == commit["incarnation"]
            live[key] = commit
    return [
        {
            "key": key,
            "incarnation": commit["incarnation"],
            "source_rev": int(commit["revision"]),
            "status_code": status_codes[commit["status_text"]],
            "mapped_rev": int(commit["revision"]),
        }
        for key, commit in sorted(live.items())
    ]


def observed_rows(records):
    return [
        {field: int(row[field]) if field.endswith("rev") or field == "status_code"
         else row[field] for field in ROW_FIELDS}
        for row in records
    ]


def compare_rows(expected, actual):
    identity = lambda row: (row["key"], row["incarnation"])
    tuples = lambda rows: {tuple(row[field] for field in ROW_FIELDS) for row in rows}
    expected_by_id = {identity(row): row for row in expected}
    actual_by_id = {identity(row): row for row in actual}
    assert len(expected_by_id) == len(expected), "duplicate expected identity"
    assert len(actual_by_id) == len(actual), "duplicate observed identity"
    common = expected_by_id.keys() & actual_by_id.keys()
    differences = []
    for key in sorted(common):
        fields = [field for field in ROW_FIELDS
                  if expected_by_id[key][field] != actual_by_id[key][field]]
        if fields:
            differences.append({"identity": list(key), "fields": fields,
                                "expected": expected_by_id[key],
                                "actual": actual_by_id[key]})
    return {
        "expected_count": len(expected),
        "actual_count": len(actual),
        "same_counts": len(expected) == len(actual),
        "missing_identities": [list(key) for key in sorted(expected_by_id.keys() - actual_by_id.keys())],
        "extra_identities": [list(key) for key in sorted(actual_by_id.keys() - expected_by_id.keys())],
        "expected_minus_actual_rows": [list(row) for row in sorted(tuples(expected) - tuples(actual))],
        "actual_minus_expected_rows": [list(row) for row in sorted(tuples(actual) - tuples(expected))],
        "common_value_differences": differences,
    }


def calibrate(fixture_root):
    contract = json.loads((fixture_root / "status-code-contract.json").read_text())
    codes = contract["status_codes"]
    assert codes == {"pending": 0, "paid": 1, "refund_pending": 2}
    expected = expected_rows(read_csv(fixture_root / "commits.csv"), codes, 207)
    actual = observed_rows(read_csv(fixture_root / "derived.csv"))
    comparison = compare_rows(expected, actual)
    assert comparison["missing_identities"] == [["43", "order-c"]]
    assert comparison["extra_identities"] == [["99", "order-d"]]
    assert comparison["same_counts"] and not comparison["common_value_differences"]
    assert expected == [
        {"key": "11", "incarnation": "order-a", "source_rev": 1, "status_code": 0, "mapped_rev": 1},
        {"key": "22", "incarnation": "order-b", "source_rev": 2, "status_code": 1, "mapped_rev": 2},
        {"key": "43", "incarnation": "order-c", "source_rev": 1, "status_code": 1, "mapped_rev": 1},
    ]
    controls = []
    for field, bad_value in [("status_code", 0), ("source_rev", 1), ("mapped_rev", 1)]:
        wrong = copy.deepcopy(expected)
        wrong[1][field] = bad_value
        diff = compare_rows(expected, wrong)
        assert diff["same_counts"] and not diff["missing_identities"] and not diff["extra_identities"]
        assert diff["common_value_differences"][0]["fields"] == [field]
        assert len(diff["expected_minus_actual_rows"]) == len(diff["actual_minus_expected_rows"]) == 1
        controls.append({"changed_field": field, "same_counts": True, "detected": True})
    wrong = copy.deepcopy(expected)
    wrong[1]["incarnation"] = "different-order"
    diff = compare_rows(expected, wrong)
    assert diff["same_counts"] and diff["missing_identities"] == [["22", "order-b"]]
    assert diff["extra_identities"] == [["22", "different-order"]]
    controls.append({"changed_field": "incarnation", "same_counts": True, "detected": True})
    return {
        "kind": "local_evaluator_input_oracle_calibration",
        "case_id": "shard-publication-rollback-floor-v2",
        "cut": 207,
        "expected_authorities": ["commits.csv definitive commits/rejections", "status-code-contract.json"],
        "expected_rows": expected,
        "comparison": comparison,
        "expected_paid_identities": [[row["key"], row["incarnation"]] for row in expected if row["status_code"] == codes["paid"]],
        "observed_paid_identities": [[row["key"], row["incarnation"]] for row in actual if row["status_code"] == codes["paid"]],
        "same_count_adverse_controls": controls,
        "limits": ["Synthetic supplied ledger and complete observation only; no engine, database or migration executed.",
                   "Input-oracle calibration is not a candidate/model trial or a grade."],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--fixture-root", type=Path, default=Path(__file__).parent / "fixtures/shard-publication-rollback-floor-v2")
    arguments = parser.parse_args()
    print(json.dumps(calibrate(arguments.fixture_root), sort_keys=True))
