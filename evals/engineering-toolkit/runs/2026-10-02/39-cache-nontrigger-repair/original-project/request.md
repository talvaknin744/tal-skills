# Small label edit

This utility formats labels from supplied immutable strings and integers. It has
no shared mutable state, cache, datastore, worker, network or concurrent callers.

Change only `labels.py` so `format_label("Ada", 7)` produces `Ada (v7)`: use
parentheses and the letter `v` immediately before the revision. Preserve the
function signature, name and revision values, and leave the verifier unchanged.
Run `python3 -B verify.py` and report its actual result. No packages or external
services are needed.
