# Independent review: backfill-recreated-identity, second sealed trial

The actual saved result is **partial, 7/8: 2/2/2/1**. The code and protected verifier pass. The critical scope-and-independent-evidence criterion remains partial because required oracle-independence and deployment writer/primitive explanations are absent from the visible response. No requirement was waived or presumed satisfied by a candidate repair.

Reviewer: /root/archive_agents. I authored none of the full selected infrastructure-change-safety package, including configuration-distribution, this case, or this response. I graded the exact sealed response/files against the unchanged rubric, without other grades or hidden reasoning. A bounded independent read-only crosscheck by /root/archive_agents/deepchecks corroborated the actual reporting omissions; I assigned the scores.

| Criterion | Severity | Score | Observable locator |
| --- | --- | --- | --- |
| coherent-source-observation | critical | 2/2 | final-project/migration.py: lines 4–11; model.py lines 7–14, 55–57 |
| incarnation-and-revision-guard | critical | 2/2 | final-project/migration.py: line 11; model.py lines 67–73; verify.py lines 50–68 |
| mapping-and-retry | major | 2/2 | final-project/migration.py: lines 5–11; verify.py lines 42–76 |
| scope-and-independent-evidence | critical | 1/2 | evidence/answer.md: lines 1–5; trace.jsonl visible messages lines 3,18,25; workspace-changes.json |

The implementation reads one immutable snapshot before the first checkpoint, retaining payload, incarnation and revision from one source state. Both checkpoints remain. The protected authority atomically compares both incarnation and source_rev before writing derived fields, so neither a foreground update nor a recreated source with revision one can be overwritten. Both supported statuses map correctly, stale/missing attempts return False, fresh retries succeed, and unrelated/source fields are retained.

Answer line 3 reports complete-row expected-state checks for unchanged, updated, recreated and deleted-source schedules, including the unrelated row. Line 5 correctly identifies the local Store lock and denies database/deployment proof. The explicit rubric nonetheless requires an explanation that expectations are **literal and independent of migration mapping**, checking **missing/extra rows**, plus the **actual database primitive and foreground writer-maintenance contract** required for deployment. The response and its three visible commentary/final messages do not supply these. A full-row comparison statement is useful coverage but does not explain oracle independence; a general database-limit statement does not name the required writer obligations.

The remaining gate is to explain verify.py's independent literal full tuples and complete set equality/differences for missing and extra rows, without constructing expected values through the implementation under test. Deployment also needs coherent database observation and atomic incarnation/revision conditional publication; every foreground source update must atomically maintain revision with the payload, and recreation must receive a non-reused incarnation. Unsupported actual database/writer behavior may be explicitly left unresolved; it cannot be silently assumed.

The protected verifier was independently executed in an owned disposable copy of all four final-project files using PYTHONDONTWRITEBYTECODE=1 and python3 -B verify.py. Exit zero, stdout:

    {"checks": 4, "failures": [], "runtime": "local in-memory authority"}

stdout SHA-256 d0845e69b96743437abff7359cbbcdcb3ea6daa7992f0355537de3c2d85272a7; stderr empty. All four copied files were unchanged and the owned directory was removed. The original supplied verifier and fresh independent-01 source record remain untouched. The four deterministic schedules cover unchanged/replayed mapping, update after read, delete/recreate with reused numeric revision, deletion/missing row, fresh retries and unrelated-row preservation. This proves only these in-memory schedules, not production/database/distributed/process-failure behavior.

Observable guidance loading was checked independently of scoring content. trace.jsonl line 7/item_2 successfully cats frozen SKILL.md, SHA-256 945681e7d7e08864c2b7339289fa36bf40dfea136fa3af1edc948e04ef814868. Its 3,911-character command output equals the complete source text, including line 17's backfill reporting paragraph specifying the actual atomic DB boundary, every writer's maintenance contract, independent literal expectations and bidirectional missing/extra comparisons. trace line 11/item_4 successfully cats schema-evolution.md, SHA-256 00cda23c89f00e3ef253d44efaa40b99015490c7ea6e821744f8b7e36f227a27; its 7,984-character output equals the complete frozen text, including the writer matrix and expected-state guidance. This establishes captured body availability, not attention or compliance. No hidden reasoning was used.

The unchanged effective prompt requests repair only in migration.py, preserving function/checkpoints, running the protected verifier and explaining result/limits, with no external services. It contains no concise-output constraint. Its only visible response events are line 3/item_0, line 18/item_8 and line 25/item_12; none adds the missing explanations. The final event matches answer.md.

Source audit reports only migration.py changed, no forbidden edits and baseline_unchanged=true/allowed_changes_only=true. It retains **case_compliant=false**: filesystem reads were not confined, sandbox/write enforcement was unverified, inherited guidance remained available and all network-capable tools were not disabled. Diagnosing-bugs guidance was also read. Captured commands show local reads/verifier execution, not observed external mutation; exclusive-guidance and jailed-host guarantees are not established.

Bindings: infrastructure tree d90f92866993d60238a78995612fe3633bae9e946c959d5e2c7d1d26a258ee0a; rubric-content SHA-256 d23c31bb9149fd6aa5fad0a56983ce54f9c9f25ba17b51356e4acacb9a00e01a; run evidence d5af0a509e4e2bbdf7d49de9db655cbfe815505b482ff83ba657f7492b6f80f5; final workspace 8e809dad7411efb2c1bb7b155e1c033eca844f31bda4b483ff1d80430fa63d75. The source seal passed, and staged original/final projects plus evidence equal source inventories byte/hash/mode. check-score is run against /TRIAL and this exact rubric; it completed successfully with rubric_result=partial and critical scores 2,2,1.

Only assigned score/review outputs and the authorized original-instruction copy were written. Generic REVIEW.md collides with review.md on this case-insensitive host; original bytes were copied before replacement to grader-instructions.original.txt, SHA-256 de7b25c04a2639056d47929850da9cde5bb29ac4043a71317ce1cd58c3665bed. No candidate/case/rubric/source/evidence/archive changes were made.

| Reviewed artifact | SHA-256 |
| --- | --- |
| `rubric.json` | `95e74746c50743f44cc90a9d2b5d501205b6edf5333c3ab06cf0382b77bab670` |
| `score-template.json` | `f0e4d454a34782d83ce544eeac5b8c7019a63901a56d20abee5501cc6f0100d7` |
| `evidence/run.json` | `3421d524fb298c92bc6579547ffe967f2fd3b8fee425010ba282d0a24ae331b8` |
| `evidence/manifest.json` | `509149cfb9cf09565e21e6717b177b09230038ae70c73ff0e76f801aabc1ba1b` |
| `evidence/answer.md` | `5a24ba439172575e6d63593fbc498038aaecbf9dd3f942e88f132c3fbb580de2` |
| `evidence/trace.jsonl` | `9903865efe3f9debeffc0f1c3fec915fd0f3a93a7e71bf65cd281b0639501d72` |
| `evidence/effective-prompt.txt` | `4934c5c92e8f33691a18c50953bdae35f9af7e10423642b41c616827ce97b96d` |
| `evidence/workspace-changes.json` | `933451dfa5d410de1d5a0b0154c3d518b7f20bc6bccaeb8f6dbd0294b30ae956` |
| `evidence/workspace.patch` | `f6d22d1491a4aa1bc03b0364a9dede01d87fec5dd9df4b5faf91ace148c32120` |
| `evidence/checks.json` | `3fd6c6f6ad3a8e4a931126c6cd1e740fa09b53c5ebfbb7ee093feb087779d417` |
| `evidence/checks/independent-01.stdout.txt` | `d0845e69b96743437abff7359cbbcdcb3ea6daa7992f0355537de3c2d85272a7` |
| `final-project/migration.py` | `aa807e7bedcd776a115ca5d5bde1335e9b1459a81c3ca0bfb0f33e52051affe8` |
| `final-project/model.py` | `dc1be8d66fe23b5fc2c273f084d8d420c6a9cff85f12347412e72caa8aaa6245` |
| `final-project/verify.py` | `50a0bd8db92bfec9323a143ac77bb138e653bd849bbe3a0245b3f50ab6b0baf1` |
| `original-project/contract.md` | `6e5d410a4b11e83e272ea4eb804ce46620c53e981be439c7e70c8046dafadca6` |
