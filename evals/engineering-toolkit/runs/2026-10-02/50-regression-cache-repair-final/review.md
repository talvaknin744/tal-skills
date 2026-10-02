# Independent review: cache-fill-invalidation

Result: **pass**, all five original criteria 2, including all three critical gates. Final local execution 5/5; authored report explicitly permits captured overlapping reads and requires acknowledged revisions for subsequently invoked reads. Scope is assessed semantically, without exact wording/format requirements.

Reviewer `/root/archive_infra`, 2026-10-02, authored neither any of the ten complete concurrency candidate files nor the response. Both independence flags false. Exact original rubric/template, original/final code, complete observable messages/commands, diff, manifest/run/checks were reviewed. No prior score files, hidden reasoning, models or candidate/fixture edits.

Frozen candidate `477470e2c65567e814850c84f7d0dd913b4627e91380d7f3cc3882331c5b1644`; run evidence `75e4fac6d7fe7a4c0b92c5f9d706ffa505024822a267decfc040fc85b891898b`; unchanged rubric `89c0954461770d4cedf7a010faf4bd2659d3b1dc247fa2d94dcc9fd15a08ff1b`.

Critical observable-contract/ordering/scope all **2**. Actual trace item14 executes all 5 checks, unchanged protected verifier/adapter hashes. `service.mjs:11,17` invokes shared atomic publication, which retains/raises floors and rejects older completion. Both write publication and read filling follow the same supplied transition. A rejected older writer already leaves a newer floor intact; item16 tests that ordering and eviction explicitly. Cache hits/independent keys remain supported; only two calls in service change.

Major overlap **2**: final answer line5 explicitly separates after-success invocation from already-overlapping captured snapshots and does not claim latest-at-response. Major limits **2**: the same paragraph conditions results on supplied adapters, authoritative invocation captures and retained shared floors, and excludes crash recovery, replicas and production multi-process behavior. This meaningfully confines local atomicity to the provided successful model; retention is an assumption, not an arbitrary marker-lifetime guarantee. No specific Redis/database terminology is required to convey that distinction.

## Protected reviewer execution

I verified original manifest hashes, copied original inputs to a separate temporary workspace, overlaid only final service, made files read-only and ran `node verify.mjs` with a 20-second bound. Started `2026-10-02T11:25:52.567464+00:00`, elapsed 0.0619 seconds, exit 0, empty stderr, all 5 passed. Stdout SHA `93b9712885d1934de7cf836eae979b7111078ebf46e91423001c92e5153f563b` matches sealed independent01. Hashes remained unchanged:

- Final service `1814180a5cc79f4be9b8306b444f1f26ee0e0048909627876940175f50818b0c`.
- Original requirements `d50283cd3ffeea2b15721e3a23416c91679cf4b1fa0fa5d3fbec24d801973989`.
- Original adapter `d5bd82f94c209c710c3a287d0626eb347cb9c80d9b87c3ed91adf57a7fe97bf2`.
- Original verifier `012d69a6aca4e76c31ce53f75d9f87479750d8f7baeff8d127f9a8279ccad333`.

Temporary workspace removed, complete pre/post scoring-input hashes unchanged. Only score/review written. Failed Git status and diff-from-empty exit codes are preserved and do not invalidate the successful final command.

Recorded candidate body/reference reads (items1/6) establish activation, not exclusive or causal attribution. No external/delegation events observed; input integrity valid. `case_compliant=false` remains: inherited guidance/tools, unjailed reads, instructed network limits and unverified write enforcement. Local checks establish supplied-adapter behavior, not production protocol or stronger host isolation.

Score validation: `node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0: pass, all critical scores2, required bound independent-01 accepted.
