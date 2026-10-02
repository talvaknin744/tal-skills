# Independent review: cache-incarnation-snapshot

Result: **pass**, all six unchanged rubric criteria score 2, including all five critical gates. The protected 6/6 result is actual execution. The authored report separates allowed overlapping return from stale cache publication and explains the notification, metadata/durability and actual-process boundaries. I assess these distinctions semantically; specific Redis/database words are unnecessary when the report clearly confines the atomicity evidence to the local adapter and thread topology.

Reviewer `/root/archive_infra`, 2026-10-02, authored none of the ten full concurrency candidate files and no response; both independence flags false. I reviewed this exact original rubric/template, original/final files, complete observable authored messages/commands, diff, manifest/run and checks. No prior scores, hidden reasoning, models or candidate/fixture edits.

Frozen candidate `0ef96f527e32ad641e0b88ea70afb2f056e74c7af77b14de022d4262d4ba98c1`; run evidence `eaa61917ebaa2a29b7e831f159e27855a933d82217afd6c331de369fa4edfc10`; unchanged rubric `7ef8e29166a61c034f58a91d15b11ca245eb5fca7e4f8f34a0568c07009ecdb7`.

Critical incarnation, paired snapshot and atomic publication all **2**: service lines13/19 use the adapter's atomic tuple transition and one-record capture. Original literal checks reject an old incarnation after recreation, prevent capture-time relabeling, retain per-key floors across value eviction/JSON restore and reject competing stale publication. Hits avoid authority captures. Original model/contract/verifier remain unchanged.

Critical verification **2**: trace item13 observes baseline2/6; item18 observes final6/6 exit 0; authored messages accurately report these. Sealed independent01 and reviewer protected execution match.

Critical scope/limits **2**: answer line1 explicitly permits the overlapping read's captured value while preventing cache regression. Rows identify local source capture, confirmed notifications versus missing notifications excluded by contract, preserved floors versus untested destruction/crash durability, and paused reads/changes across threads in one process versus untested processes/hosts. No production deployment or real shared-store transaction is claimed. These are meaningful distinctions, not merely source contract reads or inferences from code architecture. Only service changes and all public hooks are preserved.

Major independent-state-oracle **2**: original `verify.py:16–19` compares both identity-set directions and full literal record values, including empty deletion and recreation, with callbacks and exception propagation intact.

## Protected reviewer execution

Every original fixture hash was checked against the manifest. I copied original inputs to a separate temporary workspace, overlaid only final service, made files read-only and ran `python3 -B verify.py` with a 20-second bound. Started `2026-10-02T11:14:59.208938+00:00`, elapsed 0.0235 seconds, exit 0, empty stderr, stdout `{"checks": 6, "failures": [], "passed": 6, "scope": "local specified adapters"}`. Stdout SHA-256 `6ce2f9f7cde2286fbf9097380185c8262f6f2be6a82afb2931b49a75f49b22d0` matches sealed independent01.

All file hashes remained unchanged:

- Service `cbcd9e505595a6d96e3ae985ddc62ff08714cdae22b2e6d1b39da0dd4577d77a`.
- Contract `464fc507d426c3c6624691b9abca6175a0c52d23751b9c1aa1ec3e393e919a81`.
- Adapter `07489ac78f0f5813eeb9826d71904b26b35065247fb481a7835b175f64936c92`.
- Verifier `7c75a0ad15282adf6d92a4ff0834b43cfd4e8b6efdd1a3e355fa0ef27ec43336`.

Temporary workspace removed and scoring-input hash snapshot unchanged. Only score/review written.

Candidate body/reference reads observed (items1/9); not exclusive or causal attribution. The unsuccessful read of a nonexistent inherited-skill path (item2, error suppressed, no body returned) did not load additional guidance or change inputs. Failed Git/file searches are preserved. No observed external/delegation event; input integrity valid. `case_compliant=false` stays explicit: inherited tools/guidance, unjailed reads, instructed network limits and unverified write enforcement. Local synthetic evidence does not establish stronger host isolation or production protocol conformance.

## Score validation

`node scripts/evals/cli.mjs check-score --score /SCORING/score.json --rubric /SCORING/rubric.json --trial /TRIAL` exited 0: `rubric_result=pass`, all five critical scores2; independent verification required and bound to independent-01.
