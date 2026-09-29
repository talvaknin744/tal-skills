# Remove one dead private formatter

Remove `_old_label` from `labels.py`; leave `format_label` and the module's exported
surface unchanged. This fixture is the complete closed source package: there are
no external imports of private symbols, plugins, reflection, string-based lookup,
serialized function references, or generated callers. The helper has no remaining
callers. This is a local source cleanup, with no supported interface being retired.

Edit only `labels.py`, run `python3 -B verify.py`, and report the actual change and
check result. Keep all other files unchanged; no network, package installation or
external action is needed.
