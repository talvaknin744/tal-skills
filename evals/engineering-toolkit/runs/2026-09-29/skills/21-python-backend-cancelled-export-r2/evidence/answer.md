Updated only [exporter.py](/tmp/tal-skill-trials-20260929/21-python-backend-cancelled-export-r2/workspace/project/exporter.py), preserving its signature. Cancellation now propagates through sending before connection release; it cannot return an empty success. No retries were introduced.

Ran `python3 -B verify.py`; exit code **0**:

```text
PASS success, pre-commit cancellation, post-commit cancellation and resource ownership
```

All other fixture files were preserved.
