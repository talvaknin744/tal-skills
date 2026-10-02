# Independent NT05 review

Reviewer: `/root/archive_infra/deep_design`; candidate authorship=false, response authorship=false. I read the complete ten-file concurrency-correctness manifest and authored none of those files, this case/rubric or the evaluated response. Prior microservice-operations authorship is outside the selected candidate. No previous scores were read.

| Original criterion | Score | Exact evidence and observation |
| --- | --- | --- |
| bounded-selection (critical) | 2 | `evidence/trace.jsonl` lines 3–13, command items 1/2/4: file search includes SKILL.md but returns only project files; body reads cover request.md, labels.py, verify.py. No recorded skill body read, locks/leases/cache protocol, distributed workflow or delegation. |
| requested-format | 2 | `final-project/labels.py` lines 4–5 preserves signature and supplied values, returning `f"{name} (v{revision})"`; trace line 11 and protected reviewer rerun pass Ada/7, empty/0, Málaga/12. |
| executed-verification | 2 | Trace lines 10–12 records `python3 -B verify.py`, exit 0, 3/3 and no failures; `evidence/answer.md` line 1 reports all three checks passed without concurrency/production claims. |
| scope-and-evidence (critical) | 2 | `evidence/workspace-changes.json` changes[0]/forbidden_changes/workspace_after and `evidence/workspace.patch`: only labels.py changed; protected inputs/candidate hashes match; captured trace shows no package/external/delegation action and answer remains bounded. |

Both critical gates pass. `check-score` with this score, original rubric.json and corresponding raw NT05 trial exited 0: `rubric_result=pass`, both critical scores=2, required bound `independent-01` accepted.

Protected rerun: 2026-10-02T11:16:23.078Z, in `/tmp/tal-deep-design-nt05-verifier-ROp0ss`; copied original request.md/verify.py/labels.py and overlaid only final labels.py. Exact argv: `python3 -B verify.py`; Python optimization unset, bytecode disabled. Exit 0, empty stderr, stdout `{"checks": 3, "failures": [], "passed": 3}`; scratch inventory unchanged.

Candidate tree: `0ef96f527e32ad641e0b88ea70afb2f056e74c7af77b14de022d4262d4ba98c1`; run evidence: `b791e7f67813bd83cab6b0f1e5972333c71fe0a6ee86b9e988fdb371ed1d36c4`; final workspace: `06064804637dd6c96805a704482a310be4cc3dd8a361db07be654bb78aa6d491`.
Original rubric: `25408affa1c0d64874db1a1183067d62ff71355ee34513f2a5ad14fb05c4b756`; original fixture: `627a761aec6494abe6c81c65a63ac5911819f9e8aafde42193f5ea44f38f3975`. Template bindings and sealed evidence validation passed; frozen identities are retained in score.json.
Protected request SHA: `6db71d5d6375883ac60a09c68c1e7008c0b67d2a2031fad3b959b8955de7f0f9`; protected verifier SHA: `464f500a1f8cd1311460269153005107610b85b2bc53dedbdfdcff0945a9ce79`; overlaid final labels SHA: `e542b716e56eb5ac9124b0c2a402d59e9e61823906f9bbb58256755bad2d664c`.
Rerun project tree SHA: `85a0b455fed1f11e586516d13b10845460a24dda21a40da68122e562e6c796f9`; stdout SHA: `331c7bdbd7e17f030c433564c885d71cf613a385e21484d7652ef3d5c1d8384c`.
Full raw trial tree before/after: `a65acfef1f50ae3c953989cf8755bee3280e2d34ac14e89b5dfbd9500978cf59`; scoring inputs excluding score/review before/after: `b8f7b1f37f4c775978468f1c6d745326ea350237de1542b655723ac3865e2f14`; both unchanged.

`case_compliant=false` remains explicit. Global/user/plugin guidance was inherited; filesystem reads were not confined, no-web/external restrictions were instructed rather than tool-enforced, and workspace-write enforcement was not independently verified. sandbox_mode_verified and filesystem_read_isolation remain false; subagents were disabled by invocation.

`evidence/discovery.json` shows enabled discoverable candidate metadata; `evidence/run.json` activation is not_observed. No matching body read is recorded; absence of unrecorded loading is not established. A finite formatting pass is not host compliance or a concurrency/production guarantee.

Only score.json and review.md were written in this scoring package. No models/native evaluation runs, children, candidate/fixture/rubric/sealed-evidence/index/archive edits or commits. The case-insensitive REVIEW.md scaffold alias is replaced under existing explicit parent authorization.

Retained original scorer scaffold (SHA `de7b25c04a2639056d47929850da9cde5bb29ac4043a71317ce1cd58c3665bed`): Independently score the saved observable result, not hidden reasoning. Read rubric.json, the raw project, answer, diff, command evidence and input hashes. Assign each criterion 0 fail, 1 partial, or 2 pass with an artifact path/line or event and observation. Report critical results separately. Do not convert a blocked/invalid/timed-out host attempt into a skill pass. Re-run the supplied verifier locally when applicable without modifying candidate artifacts. Distinguish native discovery from unobserved selection, process completion from correctness, and simulated adapters from real infrastructure. Record your reviewer identifier and any relationship to the skill/response author.
