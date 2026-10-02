# Independent review: cache-fill-invalidation

Result: **pass**. All five original rubric criteria score 2; all three critical gates pass. The code uses the supplied shared publication/floor operations, preserves the cache hit path, and passes all five original protected checks. The authored report conveys the acknowledged-write boundary through raising the floor before resolution and conditional publication, allows an in-progress read's earlier snapshot, and explicitly excludes the model's failure/production cases. No particular explanatory phrase is required to communicate that boundary.

Reviewer: `/root/archive_infra`, 2026-10-02. I authored none of the ten files in the full concurrency-correctness candidate manifest and did not author this response. Both independence flags are false; my operations/overload work is outside this candidate. I reviewed the exact staged original rubric/template, original/final files, complete authored messages and observable commands, diff, run, manifest and checks. No past score files, hidden reasoning, models or edited candidate/fixtures were used.

Frozen candidate `ed25ceeb04a420f2def672d500a0e19e743349ac36c7a3579d1b3b41ffc59f41`; run evidence `7ac6ed1d3243aa4f682f86a60bfd1337f9176a5349d777257fd0f2c7589c030b`; rubric `89c0954461770d4cedf7a010faf4bd2659d3b1dc247fa2d94dcc9fd15a08ff1b`. Exact evidence for each criterion is in `score.json`.

## Critical results

- Observable contract: **2**. Trace `item_14` executes unchanged `node verify.mjs`, exits0, all 5 pass. Sealed `independent-01` and reviewer protected execution match.
- Atomic shared ordering: **2**. `final-project/service.mjs:11,17` uses `publishIfFresh` and awaits `advanceFloor` before write return. The unchanged adapter at `model.mjs:54–67` retains monotonic floors through value eviction. Verifier lines16–51 cover old fills, eviction and reordered notifications. Recorded `item_16` additionally delays an older writer's completion and checks the new floor/value without modifying protected inputs.
- Scope: **2**. Only `project/service.mjs` changes, replacing two adapter calls. Signatures, adapters, original verifier and requirements remain intact; cache hits avoid authority reads and unrelated IDs remain usable.

Major overlap and limits both score **2**. Answer lines1 and5 communicate that writes raise the shared floor before resolving, stale miss publication is rejected, and an already running read can still return its earlier snapshot. Line5 expressly leaves crashes, adapter failures, floor expiry, replica reads and production atomicity outside the successful local model. The additional controlled check is not presented as production evidence.

## Reviewer execution

I checked all original fixture hashes against the manifest, copied original inputs to a separate temporary workspace, overlaid only final `service.mjs`, made files read-only and ran `node verify.mjs` with a 20-second bound. Started `2026-10-02T11:03:28.017602+00:00`; elapsed 0.0614 seconds; exit 0, empty stderr, all 5 original checks passed. Stdout SHA-256 `93b9712885d1934de7cf836eae979b7111078ebf46e91423001c92e5153f563b` matches the sealed independent check.

All execution hashes remained unchanged:

- Requirements `d50283cd3ffeea2b15721e3a23416c91679cf4b1fa0fa5d3fbec24d801973989`.
- Original verifier `012d69a6aca4e76c31ce53f75d9f87479750d8f7baeff8d127f9a8279ccad333`.
- Final service `13c74ac996feb5585498b3ef5e6d9cfdea0d6517a0ef8de9da73349e17a99c23`.
- Original adapter `d5bd82f94c209c710c3a287d0626eb347cb9c80d9b87c3ed91adf57a7fe97bf2`.

The temporary workspace was removed. A full pre/post hash snapshot confirmed no sealed score input changed. Only this review and score were written.

## Activation and host limits

The candidate metadata was discovered; item 1 successfully read its body and item 5 its cache-coherence reference. These observations show activation, not exclusive or causal attribution. No recorded external/delegation event exists. Two failed Git status commands (items 3/9, exit 128) did not prevent the final scoped verification. Saved baseline/allowed-scope integrity is valid.

`case_compliant=false` remains preserved: the host inherits other guidance/tools, provides no filesystem read isolation, instructs rather than universally disables network access, and has unverified write enforcement. The deterministic local checks do not establish production Redis/database correctness, a sandbox guarantee or sole-candidate causality.

## Score validation

`node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0: `rubric_result=pass`, all three critical scores 2; required independent verification bound to independent-01.
