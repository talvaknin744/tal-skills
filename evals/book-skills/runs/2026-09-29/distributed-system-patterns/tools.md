Actual commands and checks for this trial

Working directory for the trial-specific commands: `/tmp/book-skill-trials-20260929/distributed-system-patterns`.

Executed through `exec_command`:

```sh
cat prompt.txt skill/SKILL.md
rg --files -g '!interrupted-*' project skill
cat project/design.md
cat skill/references/single-node.md skill/references/serving.md skill/references/sources.md
nl -ba project/design.md
```

The inventory contained only `project/design.md` as a project artifact. The distributed-system-patterns skill and its single-node, serving, and source references were applied. Ownership and batch references were not needed for this review and were not semantically read. No external source PDF or website was opened.

The following exact Python calculation ran against the supplied synthetic inputs:

```sh
python3 - <<'PY'
import math
for shards in (16, 32, 64):
    print(f'shards={shards}; balanced_GiB_per_copy={768/shards:g}; slow_at_least_one={1-0.99**shards:.9%}; all_fast={0.99**shards:.9%}; mean_all_complete_ms={40+1960*(1-0.99**shards):.6f}; two_independent_parallel_copies_slow_at_least_one={1-(1-0.01**2)**shards:.9%}')
print(f'minimum_shards={math.ceil(768/48)}; index_GiB_two_copies={2*768}; fanout_32_shards_two_parallel_copies={2*32}')
PY
```

Output:

```text
shards=16; balanced_GiB_per_copy=48; slow_at_least_one=14.854222891%; all_fast=85.145777109%; mean_all_complete_ms=331.142769; two_independent_parallel_copies_slow_at_least_one=0.159880056%
shards=32; balanced_GiB_per_copy=24; slow_at_least_one=27.501966404%; all_fast=72.498033596%; mean_all_complete_ms=579.038542; two_independent_parallel_copies_slow_at_least_one=0.319504496%
shards=64; balanced_GiB_per_copy=12; slow_at_least_one=47.440351247%; all_fast=52.559648753%; mean_all_complete_ms=969.830884; two_independent_parallel_copies_slow_at_least_one=0.637988160%
minimum_shards=16; index_GiB_two_copies=1536; fanout_32_shards_two_parallel_copies=64
```

These calculations are estimates, not latency measurements. The two-copy calculation adds independence across replicas as an explicit assumption.

A Python SHA-256 scan ran before and after answer creation over `project/` and `skill/` in the three authorized trial roots. It used `Path.rglob('*')`, excluded any path component beginning `interrupted-`, and produced sorted JSON mapping each file path to `hashlib.sha256(p.read_bytes()).hexdigest()`. The maps were compared in the tool session: zero changed files among 25 snapshots, including all 9 in this trial. The scan read otherwise unused skill files only as bytes for integrity verification.

`apply_patch` created this trial's `answer.md` and `tools.md`. No project or skill file changed. A Python check used `Path.read_text()`, `len(s.split())`, `len(s.splitlines())`, and `Path.is_file()` for the three authorized answers; this answer was present with 1,857 words and 67 lines.

Limitations: no deployments, traffic experiments, benchmark runs, vendor execution, runtime probes, fault injection, network calls, web access, or subagents. No evidence exists here for actual shard-size distribution, coordinator cost, output-size limits, readiness protocol, index-update semantics, or replica correlation. All proposed validation in the answer is explicitly unexecuted. Files named `interrupted-*` were not opened. No other repository files or evaluation rubrics were read.
