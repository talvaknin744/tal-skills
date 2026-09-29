Updated only `exporter.py`, preserving its signature. It now awaits sending directly, so cancellation propagates instead of returning an empty success, and work stops before connection release. No retries were added.

`python3 -B verify.py` exited **0**:

```text
PASS success, pre-commit cancellation, post-commit cancellation and resource ownership
```

All other fixture files were preserved.
