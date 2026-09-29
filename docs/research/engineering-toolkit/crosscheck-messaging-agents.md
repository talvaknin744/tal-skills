# Independent cross-check: agent orchestration research

Reviewed 2026-09-29 by the messaging research lane. Inspected `lanes/agents.md`, `lanes/agents.json`, and all four principal source articles. No implementation or native-host test was run. The conclusions below assess research applicability, not the behavior of adapters that have yet to be implemented.

## Verdict

The lane is suitable as a research basis. Its recommendations preserve the important distinction between observed vendor experience and repository guarantees. No blocking source mismatch was found. Retain its benchmark limitations and make the following acceptance details explicit during implementation.

| Source checked | Assessment |
| --- | --- |
| [Anthropic multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | The lane correctly limits the benefit to separable work and accounts for coordination cost. An internal research comparison does not establish a coding-workflow improvement. |
| [OpenAI skill evaluations](https://developers.openai.com/blog/eval-skills) | The proposed trace-plus-artifact approach is appropriate. The article's small runner tests command presence; the lane correctly calls for successful outcomes as well. |
| [LangChain context engineering](https://www.langchain.com/blog/context-engineering-for-agents) | External artifacts and selective context are a useful method. The lane correctly treats context isolation as distinct from authorization enforcement. |
| [Vercel tool reduction](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools) | The lane correctly retains the small-query-set limitation, documented semantic layer prerequisite, sandbox, and the second SQL tool shown in the code. |

## Acceptance details to carry into the workflows

**Describe enforcement honestly.** A role's “read only” instruction, ownership assignment, or request to avoid a tool is a behavioral rule. A host-enforced tool restriction or filesystem sandbox is a separate mechanism. Record the effective tools and permissions in native smoke-test evidence. A cooperative run shows observed compliance; it does not prove the restriction could not be violated. A standalone TOML or Markdown definition loading successfully proves format compatibility, not correct orchestration.

**Evaluate the smallest team.** Include a one-file backend fix that should use one implementation owner and only relevant review. Score unused roster-wide fanout as an efficiency/scope failure. Include a shared-file change where reviewers return findings and the owner performs corrections; two agents independently editing the same file fails ownership coordination even if Git can merge the result.

**Inspect persisted work before retrying a delegation.** A child may finish an edit, start a test, or invoke an external action before its final response disappears. On resumption, inspect its task status, artifacts, diff and tool outcomes. Reuse completed evidence that still matches the current candidate. A changed candidate invalidates stale test results. Resume the unresolved portion instead of redispatching the entire assignment from the original prompt.

**Keep external uncertainty visible.** If a delegated action may have committed remotely, a new child/task identifier must not become a new business-operation identity. The workflow should use authoritative status or the existing idempotency/reconciliation contract. Cancellation or missing output is not rollback evidence. For native coding tasks this is usually an instruction to inspect actual state; it is not a reason to build a new durable orchestration service.

**Score claims against observations.** Keep three results separate: structural checks passed, semantic fixtures passed, and a native host demonstrated the workflow. A grader should see the captured command outcome and resulting artifact rather than only the implementer's final narrative. Run failure injection in local fixtures or an explicitly authorized sandbox, and report the untested infrastructure surface.

## Concrete orchestration smoke tests

| Fixture | Forced schedule | Required result |
| --- | --- | --- |
| Interrupted editor | Child writes the assigned change; completion message is lost. | Coordinator inspects and continues the existing work without overwriting or duplicating it. |
| Stale review | Reviewer grades candidate A; owner changes relevant code to B. | A's result is retained as historical evidence, not reported as B's validation. |
| False command success | Test command starts and exits nonzero. | Report records the failure even when the expected command appears in the trace. |
| Overlapping work | Two specialists both identify the same file as needing an edit. | One receives write ownership; the other supplies an independent finding. |
| Uncertain effect | Tool fake commits a logical operation, then drops its response. | Retry preserves the operation identity; final effect count remains one. |
| Adjacent nontrigger | User requests a small local formatting fix. | No messaging redesign, protocol scaffolding, or full specialist fanout. |

These are independently designed repository scenarios. They are not vendor benchmark cases and were not executed during this research review.
