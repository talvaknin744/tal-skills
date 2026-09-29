#!/usr/bin/env python3
"""Explicit, deterministic verification; no network, dependencies, or services."""

import argparse
import hashlib
import itertools
import json
import platform
import sys
from pathlib import Path
from types import ModuleType


ROOT = Path(__file__).resolve().parent


class ContractMismatch(AssertionError):
    """Only these failures count as a detected behavioral defect."""


def require_equal(observed, expected, context):
    # This contract is JSON-valued. JSON distinguishes integer/float/bool values
    # that Python's ordinary equality conflates; object ordering is immaterial.
    if json.dumps(observed, sort_keys=True) != json.dumps(expected, sort_keys=True):
        raise ContractMismatch(
            f"{context}: expected {expected!r}; observed {observed!r}"
        )


def load_candidate(label, source):
    module = ModuleType(label)
    exec(compile(source, f"<{label}>", "exec"), module.__dict__)
    return module


def execute(module, steps):
    ledger = module.CreditLedger()
    outcomes = []
    for step in steps:
        try:
            outcomes.append({"ok": ledger.credit(*step)})
        except (module.InvalidCredit, module.RequestConflict, module.TransportFailure) as error:
            outcomes.append({"error": type(error).__name__, "message": str(error)})
    # Other exceptions propagate as harness/setup failures, never as defect evidence.
    return {"outcomes": outcomes, "state": ledger.snapshot()}


def verify_golden(module, cases):
    for case in cases:
        require_equal(
            execute(module, case["steps"]),
            {"outcomes": case["outcomes"], "state": case["state"]},
            case["name"],
        )


def verify_schedules(module):
    # The final successful retry makes this fixed expectation valid for every
    # generated schedule. This does not duplicate the handler's state machine.
    expected_state = {
        "balance": 50,
        "journal": [["a", "support", 50, "credit-1"]],
        "requests": {"a": {"policy": "support", "amount": 50, "receipt": "credit-1"}},
    }
    observations = []
    for faults in itertools.product(("none", "before_commit", "after_commit"), repeat=3):
        steps = [["a", "support", 50, fault] for fault in (*faults, "none")]
        result = execute(module, steps)
        require_equal(result["state"], expected_state, f"recovery schedule {faults}")
        require_equal(result["outcomes"][-1], {"ok": "credit-1"}, "final retry receipt")
        for step, outcome in zip(steps, result["outcomes"]):
            allowed = [{"ok": "credit-1"}]
            if step[3] == "before_commit":
                allowed.append({"error": "TransportFailure", "message": "before commit"})
            if step[3] == "after_commit":
                allowed.append({"error": "TransportFailure", "message": "response lost after commit"})
            if outcome not in allowed:
                raise ContractMismatch(f"unexpected observation for {step}: {outcome}")
        observations.append(result)
    return observations


def has_lost_response_retry(steps):
    lost = ["a", "support", 50, "after_commit"]
    retry = ["a", "support", 50, "none"]
    return any(step == lost and retry in steps[index + 1:] for index, step in enumerate(steps))


def violates_single_effect(module, steps):
    if not has_lost_response_retry(steps):
        return False
    result = execute(module, steps)
    count = sum(row[0] == "a" for row in result["state"]["journal"])
    return count > 1


def shrink_by_deletion(module, steps):
    """Return a deletion-minimal history preserving the named failure scenario."""
    while True:
        for index in range(len(steps)):
            candidate = steps[:index] + steps[index + 1:]
            if violates_single_effect(module, candidate):
                steps = candidate
                break
        else:
            return steps


def verify():
    sources = {name: (ROOT / f"{name}.py").read_text() for name in ("before", "after")}
    candidates = {name: load_candidate(name, source) for name, source in sources.items()}
    cases = json.loads((ROOT / "golden.json").read_text())
    observations = {}
    for name, module in candidates.items():
        verify_golden(module, cases)
        observations[name] = verify_schedules(module)
    require_equal(observations["after"], observations["before"], "schedule preservation")

    # Each mutation edits executable production-model source. The expected failure
    # is selected from the independent requirements, not inferred from its output.
    mutations = [
        ("duplicate replay", "if key in self._receipts:",
         "if False and key in self._receipts:", "lost response then replay"),
        ("boolean accepted", "if type(amount) is not int:",
         "if not isinstance(amount, int):", "booleans rejected"),
        ("upper bound excluded", "if not 1 <= amount <= 100:",
         "if not 1 <= amount < 100:", "maximum support credit"),
        ("policy omitted from identity", "if old_payload != payload:",
         "if old_payload[1] != payload[1]:", "key binds full payload"),
        ("integer serialization changed", '"balance": sum(row[2] for row in self._journal),',
         '"balance": float(sum(row[2] for row in self._journal)),', "minimum support credit"),
    ]
    detected = []
    mutant_modules = {}
    for name, original, replacement, case_name in mutations:
        if original not in sources["after"]:
            raise RuntimeError(f"mutation setup no longer applies: {name}")
        mutated = sources["after"].replace(original, replacement)
        module = load_candidate(name, mutated)
        mutant_modules[name] = module
        case = next(case for case in cases if case["name"] == case_name)
        try:
            verify_golden(module, [case])
        except ContractMismatch as mismatch:
            detected.append({
                "defect": name,
                "contract_case": case_name,
                "source_sha256": hashlib.sha256(mutated.encode()).hexdigest(),
                "failure": str(mismatch),
            })
        else:
            raise AssertionError(f"seeded defect survived its designated oracle: {name}")

    retained = json.loads((ROOT / "counterexample.json").read_text())
    long_history = [
        ["noise", "support", 0, "none"],
        ["a", "support", 50, "before_commit"],
        ["a", "support", 50, "after_commit"],
        ["unrelated", "goodwill", 10, "before_commit"],
        ["a", "support", 50, "none"],
    ]
    duplicate = mutant_modules["duplicate replay"]
    if not violates_single_effect(duplicate, long_history):
        raise AssertionError("starting counterexample did not expose duplicate replay")
    reduced = shrink_by_deletion(duplicate, long_history)
    require_equal(reduced, retained["steps"], "retained deletion-minimal history")
    for name, module in candidates.items():
        result = execute(module, retained["steps"])
        require_equal(result["state"], retained["expected_state"], f"retained replay on {name}")
    if not violates_single_effect(duplicate, retained["steps"]):
        raise AssertionError("retained history no longer detects the seeded defect")
    for index in range(len(reduced)):
        if violates_single_effect(duplicate, reduced[:index] + reduced[index + 1:]):
            raise AssertionError("history is not deletion-minimal")

    inputs = ["before.py", "after.py", "contract.md", "golden.json", "counterexample.json", "verify.py"]
    return {
        "status": "pass",
        "runtime": sys.version,
        "platform": platform.platform(),
        "command": "python3 examples/quality/verify.py",
        "candidate_sha256": {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in inputs},
        "golden_histories_per_implementation": len(cases),
        "generated_fault_schedules_per_implementation": len(observations["after"]),
        "before_after_observations_equal": True,
        "seeded_defects_detected": detected,
        "reduction": {"original_steps": len(long_history), "retained_steps": reduced,
                      "minimality": "deletion-minimal while preserving lost-response/retry precondition"},
        "limits": ["sequential in-memory model", "no database or network", "no restart durability",
                   "no concurrent-execution proof", "finite examples and 27 schedules, not all-input equivalence",
                   "policy independence and rationale require source review"],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--report", type=Path, help="write the same JSON evidence to an explicit path")
    args = parser.parse_args()
    report = json.dumps(verify(), indent=2)
    if args.report:
        args.report.write_text(report + "\n")
    print(report)


if __name__ == "__main__":
    main()
