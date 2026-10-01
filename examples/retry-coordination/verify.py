#!/usr/bin/env python3
"""Independent finite expectations for the declared local model."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import platform
import sys
from pathlib import Path
from probe import State, admitted_schedule, causal_claim, chain

ROOT = Path(__file__).resolve().parent


def equal(actual, expected, context):
    if actual != expected:
        raise AssertionError(f'{context}: expected {expected!r}, got {actual!r}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    if sys.flags.optimize:
        raise RuntimeError('Run without optimization; verification must remain active')
    started_at = datetime.now(timezone.utc).isoformat()
    scenarios = []

    def record(name, evidence):
        scenarios.append({'id': name, 'status': 'pass', 'evidence': evidence})

    independent, owned = chain(State('independent')), chain(State('owned'))
    equal(independent['calls'], [1, 2, 4, 8], 'nested attempts')
    equal(owned['calls'], [1, 1, 1, 2], 'coordinated attempts')
    record('nested-amplification', {'unsafe': independent, 'coordinated': owned})

    unconfigured = chain(State('owned', attempts=(2, 2, 1)))
    equal(unconfigured['calls'], [1, 1, 2, 2], 'configured ancestor opportunity')
    record('unconfigured-nearest-retry', unconfigured)

    dropped = chain(State('owned', context_drop=True))
    equal(dropped['calls'], [1, 1, 2, 4], 'lost causal context')
    record('context-drop-partial-protection', dropped)

    missing = chain(State('owned', missing_claim=True))
    equal(missing['calls'], [1, 1, 2, 4], 'missing metadata fallback')
    record('missing-claim-partial-adoption', missing)

    forged = chain(State('owned'), forged_claim=True)
    equal(forged['calls'], [1, 1, 1, 2], 'incoming claim ignored')
    record('caller-cannot-suppress-internal-retries', forged)

    unsafe = chain(State('owned', effects=True))
    safe = chain(State('owned', effects=True, deduplicate=True))
    equal((unsafe['status'], safe['status']), (200, 200), 'effect requests finish')
    equal((unsafe['effects'], safe['effects']), (2, 1), 'separate duplicate safety')
    record('retry-ownership-is-not-idempotency', {'unsafe': unsafe, 'deduplicated': safe})

    outcomes = [causal_claim(True, False, True), causal_claim(False, True, True)]
    equal(outcomes, [True, False], 'optional error cannot establish causal ownership')
    unsafe_claims = [True and not (False or True), False and not (True or True)]
    equal(unsafe_claims, [False, False], 'unsafe any-outbound classification')
    record('required-versus-optional-cause', {'claims': outcomes,
           'unsafe_any_outbound_failure_claims': unsafe_claims})

    by_time = admitted_schedule(5, 9, [0, 2, 3, 1])
    by_budget = admitted_schedule(50, 2, [0, 1, 1, 1])
    spread = admitted_schedule(50, 3, [0, 2, 3])
    synchronized = admitted_schedule(50, 3, [0, 0, 0])
    equal(by_time, [0, 2], 'remaining deadline')
    equal(by_budget, [0, 1], 'shared budget')
    equal((len(spread), len(synchronized)), (3, 3), 'jitter does not reduce work')
    record('deadline-budget-and-delay', {'virtual_clock': True, 'deadline': by_time,
           'budget': by_budget, 'spread': spread, 'synchronized': synchronized})

    report = {'schema_version': 1, 'status': 'pass',
              'started_at': started_at, 'completed_at': datetime.now(timezone.utc).isoformat(),
              'runtime': platform.python_version(),
              'scenarios': scenarios, 'counts': {'pass': len(scenarios), 'fail': 0},
              'source_sha256': {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest()
                                for name in ['probe.py', 'verify.py', 'README.md']},
              'limitations': ['Finite custom HTTP middleware, not Uber, Envoy, gRPC or SDK conformance.',
                              'No broker, production load, process crash, partition, or cancellation proof.',
                              'Optional-cause and deadline cases are explicit models, not network timing evidence.',
                              'Configured eligible retries are modeled; transport-transparent retries are absent.']}
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report['counts']))


if __name__ == '__main__':
    main()
