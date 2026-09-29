Changed only `policies.py` and `setup.md`: removed the unused wrapper, kept both policies independently defined at 30 days, and consolidated setup while preserving `TOOL_API_MODE=local`.

`python3 -B verify.py` exited 0:
> PASS public policy outputs and local demo execution; documentation clarity and independent ownership require separate review

Executed the newcomer instructions with no inherited local-mode setting; output was `sales=30 support=30`. Confirmed documented errors and that all other files remained unchanged.
