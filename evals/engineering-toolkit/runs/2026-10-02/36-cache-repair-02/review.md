# Independent review: cache-incarnation-snapshot

Result: **partial**. Five criteria score 2; critical `scope-and-limits` scores 1. The implementation passes the six supplied local checks. The final report explicitly covers captured overlapping reads, local adapter/restoration scope, production store/cache atomicity, crash durability, and notification/metadata loss, but omits the required multi-process execution boundary. This is a reporting gap, not an observed failure of the scoped implementation. The critical partial cannot be averaged into a pass.

Reviewer: `/root/archive_infra`, 2026-10-02. I authored neither any of the ten files in the full concurrency-correctness candidate manifest nor the trial response. My operations/overload authorship is outside this candidate. Both independence flags are false. I graded the exact staged rubric, template, original/final project, complete observable messages and command trace, hashes, and sealed check evidence. I did not read prior score files, modify fixtures/candidate or run a model.

Candidate tree: `5f89a6515064c2bbaa739b4916ae883787bcedac2eef014475efebe3cd6a58b7`. Run evidence: `ff47f2561378218ba88b53d48824d7f242ae95b40fa44a0dc3fb3a6a4dd44e55`. Exact criterion evidence is recorded in `score.json`.

## Critical results

- Incarnation ordering: **2**. `final-project/service.py:13` uses the adapter's atomic tuple comparison; protected recreation and restart outcomes pass.
- Paired snapshot: **2**. `service.py:19` captures all fields together; miss/hit counters and capture-callback mutation checks pass.
- Atomic publication: **2**. The floor-read/unchecked-write sequence is removed; protected update/delete/recreate, retained-floor and JSON-restore checks pass.
- Executed verification: **2**. Trace `item_13` reports 6/6 exit 0, matching sealed `independent-01` and reviewer execution.
- Scope and limits: **1**. Answer lines 1–3 preserve overlap permission and several explicit limits, but no authored message addresses multi-process execution. `contract.md:44–50` already marks it outside the fixture; reading that input does not supply the missing report distinction.

Major independent-state-oracle: **2**. Original `verify.py:16–19` checks both identity-set directions and full record values against literal expected state. Protected files remain unchanged and callbacks were not bypassed.

## Reviewer execution

I copied `original-project` into a separate temporary directory, checked every original fixture hash against the manifest, overlaid only final `service.py`, made all files read-only, and ran `python3 -B verify.py` with a 20-second bound. The command started at `2026-10-02T10:44:08.599401+00:00`, finished in 0.0229 seconds, exit 0, empty stderr. Stdout was:

```json
{"checks": 6, "failures": [], "passed": 6, "scope": "local specified adapters"}
```

Stdout SHA-256: `6ce2f9f7cde2286fbf9097380185c8262f6f2be6a82afb2931b49a75f49b22d0`. The file hashes were unchanged after execution:

- Final service: `cbcd9e505595a6d96e3ae985ddc62ff08714cdae22b2e6d1b39da0dd4577d77a`.
- Original contract: `464fc507d426c3c6624691b9abca6175a0c52d23751b9c1aa1ec3e393e919a81`.
- Original adapters: `07489ac78f0f5813eeb9826d71904b26b35065247fb481a7835b175f64936c92`.
- Original verifier: `7c75a0ad15282adf6d92a4ff0834b43cfd4e8b6efdd1a3e355fa0ef27ec43336`.

The temporary workspace was removed. A pre/post hash snapshot confirmed all sealed scoring inputs unchanged; only this review and score are newly written.

## Activation and host boundaries

Metadata discovery found the candidate among 54 skills; trace `item_1` records a successful candidate body read and `item_7` a successful cache-coherence reference read. This establishes observed activation, not exclusive or causal attribution. No observed external/delegation event is recorded. The only workspace change is `project/service.py`; baseline and allowed-scope integrity are true. The unsuccessful initial `git status` (item_2, exit 128) did not prevent the final scoped verification.

The preserved run reports `case_compliant=false`: inherited guidance/tools, no filesystem read isolation, instructed network limits without universal tool disabling, and unverified write enforcement remain host deviations. Process completion and 6/6 synthetic checks do not establish deployment/Redis/database conformance or remove those host limits.

## Score validation

`node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0. The bound score is valid and the result is `partial`: four critical scores 2 and `scope-and-limits` 1. The major criterion is 2.
