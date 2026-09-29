# distributed-system-patterns evaluation cases

These original fixtures are authored evaluation inputs, not measured behavioral
results. Some proposals deliberately contain defects. Follow the repository's
[evaluation procedure](../README.md), providing only the selected prompt, its
isolated fixture directory, the candidate skill, and the stated capabilities.
Keep this guide and `cases.json` outside the evaluated agent's workspace. For
the nontrigger case, expose normal skill discovery without explicit invocation.

All cases are read-only and need no internet or external services. Record the
answer, tool trace, and workspace diff; score observable outcomes using the
separate rubric. Proposed validation must remain distinct from executed checks.

- `search-topology`: Select serving patterns and colocated helper roles under
  memory, completeness, and latency constraints.
- `batch-takeover`: Distinguish a merger from a completion barrier and protect
  ownership across pause, takeover, and reacquisition.
- `local-retry-nontrigger`: Keep a local parser cleanup outside distributed
  topology selection.

Corpus-integrity checks validate the evaluation inputs. They do not execute
an agent or establish the skill's behavioral quality.
