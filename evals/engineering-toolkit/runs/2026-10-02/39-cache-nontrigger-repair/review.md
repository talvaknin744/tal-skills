# Independent review: immutable-label-format

Result: **pass**. Both critical criteria and both major criteria score 2. This is a bounded formatting edit with no recorded concurrency candidate body/reference read or distributed workflow. Only `labels.py` changes, and the supplied three finite examples pass.

Reviewer: `/root/archive_infra`, 2026-10-02. I authored neither any of the ten files in this full concurrency-correctness candidate nor the response. Both independence flags are false; operations/overload authorship is outside this candidate. I reviewed the exact staged rubric/template, entire observable trace, original/final fixture, diff, manifest, run and sealed checks without reading prior scores or modifying candidate/fixtures.

This score remains bound to historical candidate `5f89a6515064c2bbaa739b4916ae883787bcedac2eef014475efebe3cd6a58b7`, run evidence `80168a19794f983d809b5fc5c82d235723fd7eca54bced196fc2b62ae99f7b8d` and rubric `25408affa1c0d64874db1a1183067d62ff71355ee34513f2a5ad14fb05c4b756`.

## Critical results

- Bounded selection: **2**. The entire trace records `labels.py`/`request.md` reads (items 1–2), a failed Git status (item 3), one local file edit (item 4), verifier execution (item 5) and concise report (item 6). It records no candidate body/reference read, external/delegation action or distributed correctness workflow. Metadata discovery found the candidate among 54 skills; that is not body activation. The absence of a captured read does not prove no unrecorded loading occurred.
- Scope and evidence: **2**. `workspace-changes.json` lists only `project/labels.py`; `workspace.patch` changes one format string. The original request, verifier and complete candidate manifest hashes remain unchanged. No packages/external services are used in the trace, and answer line 1 is a direct bounded report.

Requested format and executed verification both score **2**. `final-project/labels.py:4–5` preserves `format_label(name, revision)` and emits the requested parenthesized v-prefix without changing caller values. Original `verify.py:10–20` checks literal outcomes for Ada, an empty name and Málaga. Trial item 5 exits 0 with 3/3; the brief final answer accurately reports that result and makes no concurrency or production claim.

## Reviewer execution

I checked original fixture hashes against the manifest, copied `original-project` to a separate temporary workspace, overlaid only final `labels.py`, made files read-only, and ran `python3 -B verify.py` with a 20-second bound. Started `2026-10-02T10:50:03.546759+00:00`, elapsed 0.0199 seconds, exit 0, empty stderr. Stdout:

```json
{"checks": 3, "failures": [], "passed": 3}
```

Stdout SHA-256 `331c7bdbd7e17f030c433564c885d71cf613a385e21484d7652ef3d5c1d8384c` matches sealed `independent-01`. Execution left all hashes unchanged:

- Final labels: `e542b716e56eb5ac9124b0c2a402d59e9e61823906f9bbb58256755bad2d664c`.
- Original request: `6db71d5d6375883ac60a09c68c1e7008c0b67d2a2031fad3b959b8955de7f0f9`.
- Original verifier: `464f500a1f8cd1311460269153005107610b85b2bc53dedbdfdcff0945a9ce79`.

The temporary workspace was removed. All sealed scoring input hashes were unchanged before/after the rerun. Only `score.json` and this review were written.

## Host boundaries

The sealed run preserves `case_compliant=false`. Guidance/tools are inherited, filesystem reads are not isolated, all network-capable tools are not disabled, and requested write enforcement is unverified. The input-integrity checks confirm the saved baseline/allowed edit scope, not a complete sandbox proof. Finite string-format verification and recorded bounded selection do not establish exclusive candidate attribution or concurrency correctness.

## Score validation

`node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0: `rubric_result=pass`, both critical scores 2, required independent verification bound to `independent-01`.
