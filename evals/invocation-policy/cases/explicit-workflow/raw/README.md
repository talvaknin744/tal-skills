# Local fixture CLI

Prerequisite: Python 3.10 or newer. Run commands from this directory.

To check setup:

```sh
python3 -B cli.py --mode legacy
```

Keep `--mode legacy` when checking compatibility with the retained version-1
consumer. The flag controls its output format, not performance.

For a quick setup check, run the same command:

```sh
python3 -B cli.py --mode legacy
```

Success prints `ready (legacy)` and exits zero.
