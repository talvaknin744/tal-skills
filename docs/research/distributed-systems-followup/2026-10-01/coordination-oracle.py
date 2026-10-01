"""Finite examples, not a distributed protocol or a proof over unbounded executions."""

import itertools
import json
import math


def main():
    facts = ("sale-a", "sale-b", "sale-c")
    subsets = tuple(
        frozenset(combo)
        for size in range(len(facts) + 1)
        for combo in itertools.combinations(facts, size)
    )
    for left in subsets:
        assert left | left == left
        for right in subsets:
            assert left | right == right | left
            for third in subsets:
                assert (left | right) | third == left | (right | third)

    schedules = 0
    for size in range(5):
        for delivery in itertools.product(facts, repeat=size):
            state = frozenset()
            for fact in delivery:
                state = state | {fact}
            assert state == frozenset(delivery)
            schedules += 1

    # Equal eventual knowledge does not mean every intermediate read is fresh.
    lagging = frozenset({"sale-a"})
    caught_up = frozenset({"sale-a", "sale-b"})
    assert lagging != caught_up
    assert lagging | caught_up == caught_up

    # Each replica admits a sale against its own stock=1 snapshot.
    stock = 1
    left = frozenset({"sale-a"})
    right = frozenset({"sale-b"})
    assert stock - len(left) >= 0 and stock - len(right) >= 0
    merged = left | right
    assert stock - len(merged) == -1

    # An atomic reservation authority admits only one of these two sales.
    serialized_outcomes = []
    for requests in itertools.permutations(("sale-a", "sale-b")):
        remaining = stock
        accepted = []
        for request in requests:
            if remaining > 0:
                remaining -= 1
                accepted.append(request)
        assert remaining == 0 and len(accepted) == 1
        serialized_outcomes.append(accepted)

    # Deduplicated state does not deduplicate independently executed effects.
    deliveries = ("charge-a", "charge-a")
    receipt_effects = len(set(deliveries))
    naive_effects = len(deliveries)
    assert receipt_effects == 1 and naive_effects == 2

    # Hypothetical independent Bernoulli disk failures: expectation != probability.
    disks, daily_probability = 1000, 0.001
    at_least_one = -math.expm1(disks * math.log1p(-daily_probability))
    expected_failures = disks * daily_probability
    assert 0.632 < at_least_one < 0.633 and expected_failures == 1

    print(json.dumps({
        "schema_version": 1,
        "kind": "finite_coordination_and_arithmetic_oracle",
        "merge_domain": {"unique_facts": len(facts), "states": len(subsets)},
        "checks": {"idempotence": 8, "commutativity": 64, "associativity": 512},
        "delivery_schedules_length_zero_through_four": schedules,
        "lagging_read_has_less_information": True,
        "locally_valid_stock_states_merge_to_negative_stock": -1,
        "atomic_reservation_accepted_orders": serialized_outcomes,
        "duplicate_effects": {"naive": naive_effects, "receipt_model": receipt_effects},
        "independent_disk_model": {
            "disks": disks,
            "daily_probability": daily_probability,
            "expected_failures": expected_failures,
            "probability_at_least_one": at_least_one,
        },
        "limitations": [
            "Finite in-memory sets and sequential authority model; no network, broker, database, crash, or multi-process execution.",
            "The receipt model assumes atomic admission and persistence; it does not demonstrate either in an implementation.",
            "The disk calculation assumes independent equal-probability trials; it is not a fleet incident forecast.",
        ],
    }, indent=2))


if __name__ == "__main__":
    main()
