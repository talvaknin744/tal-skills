Changed only [scenario.mjs](/tmp/tal-skill-trials-20260929/13-failure-oriented-testing-race-clean-lost-update/workspace/project/scenario.mjs).

The deterministic schedule pauses A, pauses B, releases and awaits A, then releases and awaits B—without sleeps.

The invariant is that two successful increments yield **2**. The broken model reads 0 twice and writes 1 twice, yielding **1**; the corrected model yields **2**.

`node verify.mjs` exited **0**:

```text
PASS scenario rejects broken behavior and accepts the complete update
```
