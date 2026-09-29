Repair the cache projection's snapshot/live handoff in `projection.py`. A snapshot
can pause before publication while a live DELETE completes. The supplied contract
also covers serialized restart and delayed baseline installation. Keep the
observation hook usable and run `python3 -B verify.py`. You may edit only
`projection.py` and optionally add `test_projection.py`; do not modify the contract
or verifier. Explain the concrete failing history, the enforcement boundary, and
what the local checks establish.
