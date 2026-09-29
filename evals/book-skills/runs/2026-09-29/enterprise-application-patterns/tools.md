Actual commands and checks for this trial

Working directory: `/tmp/book-skill-trials-20260929/enterprise-application-patterns`.

Executed through `exec_command`, in this order (independent reads for the other two trials were batched separately):

```sh
pwd
cat prompt.txt skill/SKILL.md
rg --files -g '!interrupted-*' project skill
cat project/design.md
cat skill/references/domain-logic.md skill/references/persistence.md skill/references/transactions.md skill/references/sources.md
nl -ba project/design.md
```

The inventory contained only `project/design.md` as a project artifact. The enterprise-application-patterns skill and its domain-logic, persistence, transactions, and source references were applied to the design review. No referenced external PDF or website was opened.

A Python SHA-256 command ran twice: once before writing the answers and once afterward. The same command covered only the three authorized trial roots:

```sh
python3 - <<'PY'
from pathlib import Path
import hashlib,json
roots=[Path('/tmp/book-skill-trials-20260929')/n for n in ('enterprise-application-patterns','distributed-system-patterns','object-design-patterns')]
result={}
for root in roots:
    for subdir in ('project','skill'):
        for p in sorted((root/subdir).rglob('*')):
            if p.is_file() and not any(part.startswith('interrupted-') for part in p.relative_to(root).parts):
                result[str(p)]=hashlib.sha256(p.read_bytes()).hexdigest()
print(json.dumps(result,sort_keys=True))
PY
```

The first result was retained in the tool session. Comparing the before/after path-to-hash maps found zero changes among 25 snapshot files across the three trials, including all 8 files in this trial's project and skill snapshots. The checksum scan reads file bytes for integrity verification; it is not a semantic review of unused references.

`apply_patch` created `answer.md` and this `tools.md` in the trial root. No project or skill file was edited. A Python existence/length check read each trial's answer and reported this answer present, with 1,372 words and 52 lines:

```sh
python3 - <<'PY'
from pathlib import Path
for name in ('enterprise-application-patterns','distributed-system-patterns','object-design-patterns'):
    p=Path('/tmp/book-skill-trials-20260929')/name/'answer.md'
    s=p.read_text()
    print(f'{p}: {len(s.split())} words, {len(s.splitlines())} lines, present={p.is_file()}')
PY
```

Limitations: this was a read-only design review. There was no application code, schema, database configuration, or executable test suite in the supplied project snapshot. No application tests, transaction/rollback probes, concurrency schedules, query-count checks, dependency changes, web access, deployments, or subagents were used. Validation scenarios in the answer are proposed checks and not claimed runtime results. Files named `interrupted-*` were excluded from inventory/integrity scanning and were not opened. No other repository files or evaluation rubrics were read.
