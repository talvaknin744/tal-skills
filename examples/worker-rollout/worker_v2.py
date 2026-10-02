"""New binary: preserves v1 interpretation while adding structured v2 inputs."""
import runtime

SUPPORTED = {(1, 1, "sum-v1"), (2, 2, "sum-v2")}


def amount(state, step):
    # Keep old receipt identity and amount interpretation on retained v1 jobs.
    record = state["manifest"][step]
    return int(record) if state["input_schema"] == 1 else record["amount"]


if __name__ == "__main__":
    runtime.main("v2", SUPPORTED, amount)
