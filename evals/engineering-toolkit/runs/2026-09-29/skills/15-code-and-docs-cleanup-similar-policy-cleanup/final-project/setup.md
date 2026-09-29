From the project directory, with Python 3 installed, set `TOOL_API_MODE=local`
in each fresh shell before running the example. This prerequisite keeps the
example local and avoids contacting a remote service.

```sh
export TOOL_API_MODE=local
python3 -B demo.py
```

Expected output: `sales=30 support=30`.
A `set local mode` error means the variable is missing or incorrect in the current shell.
