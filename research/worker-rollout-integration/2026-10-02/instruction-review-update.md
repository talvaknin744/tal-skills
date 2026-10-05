# Independent instruction review update — worker rollout integration

No unresolved material finding in the two schema additions or the runner fix. This update preserves [the original review](instruction-review.md) and its [JSON record](instruction-review.json); it does not rewrite their evidence or score native responses.

Reviewed 2026-10-02T08:46:22.472282+00:00. The archived schema file matches the original review hash `d591f38322588026a4901e77cda1f3c0ef86ec51cbf9dd45f3e5eb8f3598e1a1`. The final source file matches freeze02 `a2d2a541e6ce59bd86d0a592425de5426828cb75745ec519c8c286d4d1d5887d` and infrastructure candidate tree `25300ed6da72e8c684fdadedfe978d314a512dfa350975b11495cbadcdc76c43`.

## Schema instruction assessment

- **Writer-generation evidence, lines 35–40:** technically valid and appropriately scoped. The new gate requires evidence for every writer generation, including old-only writers during fallback, and records when write eligibility ends. Unknown revision maintenance blocks the revision guard and equality-based reads. A later admission closure does not excuse unsafe overlap. This makes the existing atomic-maintenance prerequisite observable without changing its doctrine or prescribing a new migration protocol.
- **Value/revision oracle, lines 79–82:** technically valid and observable. The reviewer must give an independently expected mapping and the complete value/revision comparison at the supplied cut. Keys/counts and a proposed future check cannot establish observed value correctness. The surrounding independent ledger, reconciled unknown outcomes, and bidirectional expected/actual sets remain applicable. Insufficient evidence stays explicitly unresolved.

Only `references/schema-evolution.md` differs from the archived infrastructure package. Its sources and other package files are byte-identical. All other 22 instruction/context hashes in the original review still match. Case, prompt, rubric, and fixture identities are unchanged between freeze01 and freeze02. `validateFreeze` accepted freeze02; scoped whitespace checks passed.

## Runner supplement closure

The original nonblocking pre-dispatch observation is **closed**. At `scripts/evals/lib.mjs:308–310`, either run or control carrying a suite now triggers `loadControlledCase` before slot acquisition or host launch. Its existing check rejects mismatched suite, case, or freeze bindings.

I ran this focused local regression:

```sh
node --test --test-name-pattern='staging keeps private rubric outside the raw project and binds controls' tests/worker-rollout-integration/runner.test.mjs
```

Result: exit 0; one test passed, zero failed. The test deletes the control suite, requests execution with a missing host, and receives the suite-binding error before dispatch. No native host or model was launched. This local runner result is separate from schema-instruction quality and model behavior.

## Reviewed hashes

| File | SHA-256 |
| --- | --- |
| `skills/infrastructure/infrastructure-change-safety/references/schema-evolution.md` | `24567fedefb25a10c5f18f521f713fb01ee02de1bf72c55984da9feb9486ded3` |
| `scripts/evals/cli.mjs` | `7d58ac400540150fef613e265781388d1f5e2af7fb93da490a068e553b9684aa` |
| `scripts/evals/lib.mjs` | `be03568745fe5050d79f0d12c1b87d182e9dd69e32b98cb7f967cb901756ebc5` |
| `tests/worker-rollout-integration/runner.test.mjs` | `971ca5357fbbe648aacbbd7c49db564ba3e8d88d85c251247fcf57122427691c` |

The [machine-readable update](instruction-review-update.json) binds the original review, archived candidate, current freeze and focused check.

## Limits

This review did not inspect or score native responses, rerun the broad runner suite, or exercise database, broker, rollout, clock or cleanup behavior. The schema change improves the precision of completion criteria; that does not establish improved model adherence or a correct deployment. The original review remains a historical record of its own frozen bytes.
