"""Candidate successor that dropped retained v1 support; claims must be blocked."""
import runtime


if __name__ == "__main__":
    runtime.main("incompatible", {(2, 2, "sum-v2")}, lambda state, step: state["manifest"][step]["amount"])
