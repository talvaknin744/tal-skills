# Independent review: cache-fill-invalidation

Result: **partial**. All three critical criteria score 2; major limits scores 2 and overlap-contract scores 1. Actual final/protected verification is 5/5. The report states the acknowledged floor boundary but does not explain the permission for an already-overlapping read to return its earlier snapshot. This is a semantic explanation gap, not a penalty for exact wording or for a valid optional retry. The final baseline count also disagrees with the recorded command.

Reviewer `/root/archive_infra`, 2026-10-02, authored no file of the full ten-file concurrency candidate and no response; both independence flags false. I reviewed only this run's original rubric/template, original/final inputs, complete observable authored messages/commands, diff, manifest, run and checks. No past scores, hidden reasoning, models or candidate/fixture edits.

Frozen candidate `0ef96f527e32ad641e0b88ea70afb2f056e74c7af77b14de022d4262d4ba98c1`; run evidence `c8c1698e4b326f9d0a33ed83414310405e8be00ce5fbf2be383a03910cfa84c1`; unchanged rubric `89c0954461770d4cedf7a010faf4bd2659d3b1dc247fa2d94dcc9fd15a08ff1b`.

Critical observable-contract, atomic-shared-ordering and scope all **2**. `service.mjs:13,19` uses atomic shared publish/floor operations; only the service changes. Original verifier lines16–51 test late fills, retained floors and reordered notification, lines54–66 test caching/independent keys; all pass. No verifier/adapters were weakened.

Major overlap **1**: final line1 and acknowledgement row convey subsequent-read ordering, but no authored message acknowledges permitted old snapshots for reads already overlapping. Item10 says a rejected fill retries to avoid returning a stale snapshot; the stronger choice remains valid in the provided finite executions, yet does not explain the original contract's permission. No explicit latest-at-response guarantee is claimed. Under continuous updates, the unbounded retry loop has no general liveness bound; no such broader runtime guarantee was supplied or tested.

Major limits **2**: answer rows limit results to supplied snapshots/atomic adapters; exclude replica/production behavior, commit-to-floor crash/failure, floor expiry/restart, and untested processes/hosts. Scope is assessed by its meaning.

Additional accuracy observation: answer line3 reports 3/5 before repair, while trace item11 reports 2/5. The final 5/5 statement is accurate (item15). The rubric's final executed-success gate passes; the baseline discrepancy remains visible rather than being silently repaired.

## Protected reviewer execution

Original manifest hashes were verified, original inputs copied into a separate temporary workspace, only final service overlaid and files made read-only. `node verify.mjs` started `2026-10-02T11:14:59.209404+00:00`, finished in 0.0618 seconds, exit 0, empty stderr, all 5 checks passed. Stdout SHA-256 `93b9712885d1934de7cf836eae979b7111078ebf46e91423001c92e5153f563b` matches sealed independent01. File hashes remained unchanged:

- Service `add43db306de770794bd11933ea17faea45eefab23804db6863fa4e8ae14d2ca`.
- Requirements `d50283cd3ffeea2b15721e3a23416c91679cf4b1fa0fa5d3fbec24d801973989`.
- Adapter `d5bd82f94c209c710c3a287d0626eb347cb9c80d9b87c3ed91adf57a7fe97bf2`.
- Verifier `012d69a6aca4e76c31ce53f75d9f87479750d8f7baeff8d127f9a8279ccad333`.

Temporary workspace removed; pre/post scoring-input hashes unchanged. Only score/review written.

Candidate body/ref reads are observed (items1/4), not exclusive or causal attribution. No external/delegation event observed; saved input integrity valid. Failed Git status/file searches are preserved. `case_compliant=false` remains: inherited guidance/tools, unjailed reads, instructed network limits, unverified write enforcement. These synthetic checks prove scoped behavior, not production or complete host isolation.

## Score validation

`node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0: `rubric_result=partial`, all three critical scores2; major overlap-contract1 and limits2.
