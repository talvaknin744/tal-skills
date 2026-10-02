# Independent review: backfill-recreated-identity

The saved result is **partial, 7/8**: coherent-source-observation, incarnation-and-revision-guard and mapping-and-retry pass at 2/2; scope-and-independent-evidence is **1/2, critical**. The local implementation and all four protected checks pass. The remaining criterion gap is in the response's required evidence and deployment explanation, not an observed code failure.

Reviewer: /root/archive_agents. I authored none of the full selected infrastructure-change-safety package (including its configuration-distribution reference), this case, or this response. I graded the actual sealed files and visible answer/command events against the exact unchanged rubric, without consulting other grades or hidden reasoning.

| Criterion | Severity | Score | Observable locator |
| --- | --- | --- | --- |
| coherent-source-observation | critical | 2/2 | final-project/migration.py: lines 4–11; model.py lines 7–14, 55–57 |
| incarnation-and-revision-guard | critical | 2/2 | final-project/migration.py: line 11; model.py lines 67–73; verify.py lines 50–68 |
| mapping-and-retry | major | 2/2 | final-project/migration.py: lines 5–11; verify.py lines 42–76 |
| scope-and-independent-evidence | critical | 1/2 | evidence/answer.md: lines 1–5; trace.jsonl lines 27–37; workspace-changes.json; final-project/verify.py lines 10–16 |

migration.py reads one frozen Row snapshot before the first checkpoint and derives both mapping and identity/revision tokens from it. The two required checkpoint calls remain in order. map_if_current publishes only under the protected authority's atomic equality predicate on both incarnation and source_rev. This rejects an intervening update and a delete/recreate whose revision resets to one without comparing arbitrary incarnation strings. Pending maps to zero and paid to one; missing/stale attempts return False and fresh updated/replacement retries succeed. Publication changes only derived code/mapped revision; protected literal row sets retain source and unrelated fields.

The final response (lines 1–5) accurately states the snapshot/guard fix, four-check pass, before-fix failures and local in-memory limits. Visible commentary explains the original mixed-read and reused-revision failure mechanism. Neither supplies the criterion's explicit explanation of **independent expected row sets including missing/extra rows**, or of the **actual database primitive and foreground writer-maintenance contract** required for deployment. Reading a verifier that contains the oracle is not explaining that oracle. This omission prevents a full critical score despite the functional pass.

The actionable remaining gate is an explanation that verify.py uses literal expected full tuples independent of migration.py's status mapping, compares complete actual/expected sets in both directions for missing and extra rows, and includes retained unrelated rows. For deployment, the coherent source read and incarnation/revision conditional publication need actual database semantics, while every foreground source update must atomically advance its revision and each recreation must receive a non-reused identity. The response's general list of unvalidated database/isolation features does not state that maintenance contract. No fixture or criterion was relaxed.

Independent verifier execution used a disposable copy of all four final-project files with PYTHONDONTWRITEBYTECODE=1 and python3 -B verify.py. It exited zero with:

    {"checks": 4, "failures": [], "runtime": "local in-memory authority"}

stdout SHA-256 d0845e69b96743437abff7359cbbcdcb3ea6daa7992f0355537de3c2d85272a7; empty stderr SHA-256 e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855. All four copied files were unchanged and the owned temporary workspace was removed. The protected schedules cover unchanged mapping/replay, update after read, delete/recreate before apply with reused numeric revision, deletion/missing source, fresh retries and unrelated-row preservation. This is local deterministic in-memory evidence, not database, distributed, process-failure or production validation. The source's existing independent-01 record and command streams remain intact.

The workspace audit records only project/migration.py changed, no forbidden edits, and baseline_unchanged=true/allowed_changes_only=true. Candidate body reading and schema reference reading are visible; inherited diagnosing-bugs guidance was also read. The source remains **case_compliant=false**. Filesystem reads were not jailed, sandbox/write enforcement was not verified, inherited guidance remained available, and external-service restrictions were not enforced across every inherited network-capable tool. No external service mutation or additional model request is visible in the recorded commands; no exclusive-guidance or fully isolated-host claim is made.

Bindings: infrastructure tree c67c326ddb1c2829a2d09225eb20333b88d577d600acd04470c4e35d3fc4178f; exact rubric-content SHA-256 d23c31bb9149fd6aa5fad0a56983ce54f9c9f25ba17b51356e4acacb9a00e01a; run evidence f11c51b5e49c2b8e87bc02270cebfc00c015c6d1d1b2ce8379fb388c9dbed2f1; final workspace 9c6265d61dbe20f5d4f098b76a2de7a385cee93a4d2eec267fb69acbd4ca9f8e. The source evidence seal passed and staged original/final projects and evidence match source inventory bytes/hashes/modes. check-score is run against /TRIAL with the exact staged rubric; it completed successfully with rubric_result=partial and critical scores 2,2,1.

Only assigned score/review outputs and the authorized grader-instruction copy were written. Generic staged REVIEW.md collides with review.md on this case-insensitive host; original bytes were preserved before replacement as grader-instructions.original.txt, SHA-256 de7b25c04a2639056d47929850da9cde5bb29ac4043a71317ce1cd58c3665bed. Original/final input files, rubric/template, source trial and verifier evidence remain unchanged.

| Reviewed artifact | SHA-256 |
| --- | --- |
| `rubric.json` | `95e74746c50743f44cc90a9d2b5d501205b6edf5333c3ab06cf0382b77bab670` |
| `score-template.json` | `5f40d4fea39e2e7902a83d6f3f7a6393a88f337d89171166f473dfb06286d7bb` |
| `evidence/run.json` | `cb7ab779a932fee5baa51d4fd44e687e4ba471f421276ccb81ccb08567162f31` |
| `evidence/manifest.json` | `f534f631a675a193fd1850331601dd2f26f0d9065400c2568ce43c01479f3d1d` |
| `evidence/answer.md` | `dba39fc7a3d4183df992e2ac178bbc97e05dd7130cdc0e5cae7cc59c474e5ddc` |
| `evidence/trace.jsonl` | `9b4278f2b359080e3ff978ad6f6ebd2a12f4063a4a7ada1582242eebcb81dbe6` |
| `evidence/workspace-changes.json` | `ecac201e258c59e543f03c0551b94c25e843fa0077ff6abdf8de01f7e33e6cd3` |
| `evidence/workspace.patch` | `f1dc97b8d019d7ef89bcecf2e9a230af9234921de072a218b20db8a7464db404` |
| `evidence/checks.json` | `bd91a06207e41d5afef542cb07515ff290c3c2756778a814368d0653ac3e05ba` |
| `evidence/checks/independent-01.stdout.txt` | `d0845e69b96743437abff7359cbbcdcb3ea6daa7992f0355537de3c2d85272a7` |
| `final-project/migration.py` | `5addd5890ac79919e97d9d3014e7996ce1963b457eaaa78c4089c627a250f820` |
| `final-project/model.py` | `dc1be8d66fe23b5fc2c273f084d8d420c6a9cff85f12347412e72caa8aaa6245` |
| `final-project/verify.py` | `50a0bd8db92bfec9323a143ac77bb138e653bd849bbe3a0245b3f50ab6b0baf1` |
| `original-project/contract.md` | `6e5d410a4b11e83e272ea4eb804ce46620c53e981be439c7e70c8046dafadca6` |
