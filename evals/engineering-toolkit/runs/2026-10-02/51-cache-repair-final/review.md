# Independent review: cache-incarnation-snapshot

Result: **pass**, all six original criteria 2, including all five critical gates. Actual/protected final 6/6. Authored scope clearly separates in-memory adapter evidence from notification loss, metadata loss, crash durability, replicas and multiple processes; captured overlapping return remains permitted. Grading is semantic, without exact-word or table-format requirements.

Reviewer `/root/archive_infra`, 2026-10-02, authored none of the ten selected full concurrency candidate files and no response; both independence flags false. Only this exact rubric/template, original/final inputs, complete observable authored messages/commands, diff, manifest/run and checks were used. No previous scores, hidden reasoning, models or candidate edits.

Frozen candidate `477470e2c65567e814850c84f7d0dd913b4627e91380d7f3cc3882331c5b1644`; run evidence `9cda4e1df34a7953c92282b752c9efcd54d22590c99c327b4d3016c3685ea6cd`; original rubric `7ef8e29166a61c034f58a91d15b11ca245eb5fca7e4f8f34a0568c07009ecdb7`.

Critical incarnation/snapshot/publication each **2**: service13/19 calls the supplied atomic tuple transition and one-record capture. Protected tests cover old incarnation after recreation, payload/token capture collision, per-key floor retention, deletion and JSON restore with all expected states passing. No code bypasses hooks or caching.

Major independent oracle **2**: original verifier16–19 compares both key-set directions and full literal record dictionaries including empty deletion/recreation; verifier/adapters/contract are unchanged.

Critical verification **2**: model items11/14 execute2/6 before and6/6 after; the final statement matches. Sealed independent01 and reviewer execution match6/6.

Critical scope/limits **2**: only service changes with original interfaces/hooks intact. Answer1 permits captured overlapping result and protects cache state; answer3 identifies finite JSON-restore coverage; answer5 confines atomicity evidence to in-memory adapters/confirmed notifications and explicitly excludes missed notifications, lost metadata, crash-safe durability, replicas and multiple processes. It does not imply production shared-store guarantees. Exact Redis/database names are unnecessary for this meaningfully bounded statement.

## Protected reviewer execution

Original manifest hashes verified; original inputs copied to a separate temporary workspace with only final service overlaid, read-only files, 20-second command bound. `python3 -B verify.py` started `2026-10-02T11:25:52.567184+00:00`, elapsed 0.023 seconds, exit 0, empty stderr. Stdout `{"checks": 6, "failures": [], "passed": 6, "scope": "local specified adapters"}`, SHA `6ce2f9f7cde2286fbf9097380185c8262f6f2be6a82afb2931b49a75f49b22d0` matches sealed independent01. All hashes unchanged:

- Final service `cbcd9e505595a6d96e3ae985ddc62ff08714cdae22b2e6d1b39da0dd4577d77a`.
- Contract `464fc507d426c3c6624691b9abca6175a0c52d23751b9c1aa1ec3e393e919a81`.
- Adapter `07489ac78f0f5813eeb9826d71904b26b35065247fb481a7835b175f64936c92`.
- Verifier `7c75a0ad15282adf6d92a4ff0834b43cfd4e8b6efdd1a3e355fa0ef27ec43336`.

Temporary workspace removed; pre/post sealed scoring-input hashes unchanged. Only score/review written.

Body/reference activation observed(items1/6), not exclusive/causal attribution. Git status failure preserved, no observed external/delegation event, valid input integrity. `case_compliant=false` remains: inherited tools/guidance, unjailed reads, instructed network limits, unverified write enforcement. This passing synthetic behavior does not establish production protocol conformance or stronger host isolation.

Score validation: `node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0: pass, all critical scores2, required bound independent-01 accepted.
