# Agent orchestration and developer workflows

Research date: 2026-09-29. This lane verifies ten publishers and deeply extracts four technical articles from four companies. The [structured record](agents.json) contains canonical URLs, access notes, exact reading scope and a six-part practice record per article. The other six candidate articles were screened; this is not a claim to have reviewed their publishers' archives.

## Changes to prioritize

1. **Make the coordinator choose a small relevant team.** Define ownership before spawning workers, including the files each may change and the artifact expected back. Treat tightly coupled changes as one implementation assignment. Keep independent review separate from implementation. This applies the delegation boundaries discussed in [Anthropic's research-system account](https://www.anthropic.com/engineering/multi-agent-research-system).
2. **Make evidence part of the handoff.** Preserve task constraints, decisions, unresolved failures and links to source artifacts across continuation. Reference large artifacts instead of repeatedly copying them. Evaluate whether the next worker can recover the necessary context; shortness alone is not success. [LangChain's context-engineering taxonomy](https://www.langchain.com/blog/context-engineering-for-agents) supplies the organizing vocabulary.
3. **Grade behavior as well as the final answer.** Add explicit invocation, natural invocation and adjacent nontrigger cases. Keep the candidate hash, environment, trace and resulting diff together. A successful command must be distinguished from its invocation. This is the practical contribution of [OpenAI's skill-evaluation guide](https://developers.openai.com/blog/eval-skills).
4. **Require evidence before adding or removing tool wrappers.** A cleanup review should identify the actual ambiguity or maintenance burden, propose a smaller interface, and compare task behavior. [Vercel's tool-reduction experiment](https://vercel.com/blog/we-removed-80-percent-of-our-agents-tools) supports testing simplification; its five-query result does not justify removing authorization or validation.

These are proposed repository policies, not verbatim vendor instructions. The canonical role definitions should express responsibilities and output requirements; reusable technical procedures belong in the existing or new skills. A coordinator role is not a new durable runtime, transaction manager or security boundary.

## Publisher survey

| Publisher | Why keep it in the reading path | Access / attribution note |
|---|---|---|
| [OpenAI](https://developers.openai.com/blog) | Agent harnesses, skills, evaluation | Official developer blog; distinguish experience posts from current runtime documentation. |
| [Anthropic](https://www.anthropic.com/engineering) | Delegation, context and tool ergonomics | Official engineering archive; internal results need their workload and model context. |
| [Hugging Face](https://huggingface.co/blog) | Agent-facing library design and reproducible tooling experiments | Official editorial and community contributions coexist; check each byline. |
| [LangChain](https://www.langchain.com/blog) | Agent state, retrieval and tracing | Legacy blog subdomain redirects; framework promotion is not comparative proof. |
| [Vercel](https://vercel.com/blog/category/engineering) | Tool design, backend execution and developer workflows | Engineering category plus company-authored technical posts. |
| [Databricks](https://www.databricks.com/blog/category/engineering) | Data engineering and isolated database-backed development | Candidate Consort is an open-source Field Engineering project, not a platform SLA. |
| [Snowflake](https://www.snowflake.com/en/blog/engineering/) | Semantic data interfaces and governed routing | Historical implementation posts require current API cross-checks. |
| [NVIDIA](https://developer.nvidia.com/blog/) | Inference infrastructure and agent evaluation | Read the technical body; pages may also include labeled generated summaries. |
| [Pinterest](https://medium.com/pinterest-engineering) | Infrastructure debugging and backend migrations | Ownership confirmed by the official careers footer; Medium index extraction omits some listings. |
| [Twilio](https://www.twilio.com/en-us/blog/developers) | Messaging/voice integration and task-specific evaluation | Employee and contributor posts are labeled separately; tutorials are not protocol specifications. |

## Runtime and protocol boundary

Current [official Codex subagent documentation](https://learn.chatgpt.com/docs/agent-configuration/subagents) specifies project-local standalone `.codex/agents/*.toml` files with `name`, `description` and `developer_instructions`. Omitted model settings inherit. The current global cap is `agents.max_concurrent_threads_per_session`; `max_threads` remains a legacy alias. Validate the installed client before generating an adapter. Do not copy model names or permission defaults from examples.

This lane's blogs provide experience, not normative MCP/A2A contracts. Protocol skills must pin the official specification and SDK version separately. A role description does not enforce permissions, make retries idempotent, or prove cancellation. In-process workers, native host subagents and remote A2A agents have different failure and trust boundaries.

## Proposed evaluation scenarios

- Two reviewers need the same source files: both may read, but only the assigned owner edits.
- A small fix activates one owner rather than the entire specialist roster.
- A tool succeeds remotely and the local response is lost: report uncertainty and use the business operation identity before retrying.
- A long task resumes after compaction: preserve the original acceptance criteria and unresolved failure, with retrievable evidence.
- A skill is installed but a nearby request is outside its scope: avoid unnecessary process or scaffolding.
- A simplified tool interface reduces steps while a hidden write-side effect appears: reject the simplification despite better latency.
- A test command was started but failed: the result must not be reported as a passing verification.

The last three checks should be enforced using captured artifacts or tool outcomes when available. A grader's favorable prose alone is insufficient. The existing idempotency, draining, concurrency and Temporal AI skills already cover many runtime concerns; extend their references only where new evidence changes an instruction.

## Limits

No blog's model-specific speedup or success rate is adopted as a repository guarantee. Four complete articles were read, while other candidates were inspected only for fit and access. No vendor example was executed during this research lane. Publisher selection is a curated coverage sample, not a measured top-ten ranking.
