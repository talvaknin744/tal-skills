Updated only `policies.py` and `setup.md`: removed the unused wrapper, kept both policies independent at 30 days, and consolidated setup while preserving `TOOL_API_MODE=local`.

`python3 -B verify.py` exited 0:
> PASS public policy outputs and local demo execution; documentation clarity and independent ownership require separate review

Executed the newcomer instructions with the variable initially unset; output matched `sales=30 support=30`. All other files remained unchanged. No external services or packages were used.
