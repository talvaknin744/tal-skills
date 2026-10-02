"""Old binary: retained integer inputs and checkpoint v1."""
import runtime

SUPPORTED = {(1, 1, "sum-v1")}


def amount(state, step):
    return state["manifest"][step]


if __name__ == "__main__":
    runtime.main("v1", SUPPORTED, amount)
