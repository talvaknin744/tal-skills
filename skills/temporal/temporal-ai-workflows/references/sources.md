# Sources and limits

Reviewed 2026-09-29. These are original engineering instructions informed by customer reports and official documentation. Customer topology, throughput, availability, and retry settings are examples, not product guarantees. Each recommendation below is an inference from the stated observation. Talk entries use published abstracts only; no video/transcript implementation details are claimed.

## Customer evidence

| Source | Reported observation | Lesson inferred for this skill |
| --- | --- | --- |
| [Jota](https://temporal.io/resources/case-studies/jota) | Banking operations return their outcomes to a durable conversation; confirmations can arrive later. | Correlate each tool result and approval with the actual business operation. |
| [Strada](https://temporal.io/resources/case-studies/strada) | Separates attachment failures, bounds reasoning, and serializes overlapping customer context. | Select retry boundaries and serialize shared decisions; persistence before sending alone cannot prevent duplicate sends. |
| [Maria Educação](https://temporal.io/resources/case-studies/maria-educacao) | Combines per-step Activities, controlled fan-out, and some graphs inside Activities. | Verify actual inner checkpoints; a plain graph Activity can repeat already-executed inner work. |
| [Emergent](https://temporal.io/resources/case-studies/emergent) | An agent shared a sandbox's resource failures; the later design separates orchestration and coordinates child agents. | Keep resource recovery independent of disposable execution and specify child cleanup. |
| [Retool](https://temporal.io/resources/case-studies/how-retool-built-robust-workflow-agents-products) | Specialized agent Workflows coordinate iterative state, tools, and human interaction. | Define the task lifecycle and stopping conditions. |
| [Duolingo](https://temporal.io/resources/case-studies/duolingo-temporal-nexus) | A portal exposes selected cross-Namespace operations with approvals and scoped worker permissions. | Separate invocation, application authorization, and resource permissions. The story is inconsistent about current Slack approval support. |
| [Replit](https://temporal.io/resources/case-studies/replit-uses-temporal-to-power-replit-agent-reliably-at-scale) | Session Workflows coordinate agents and use Updates for human interaction. | Stable session identity helps coordination; one running Workflow does not prove one external process or effect. |
| [Lindy](https://temporal.io/resources/case-studies/lindy-reliability-observability-ai-agents-temporal-cloud) | Replaced fragile queue orchestration with observable, recoverable agent execution. | Expose progress and actionable failure states; the article's broad Workflow terminology is not an I/O placement rule. |
| [Gradient Labs](https://temporal.io/resources/case-studies/gradient-labs-uses-ai-agents-to-resolve-complex-customer-issues) | Model requests can return successfully with unusable results. | Implement validation and bounded repair explicitly; Temporal does not evaluate answer quality automatically. |
| [Gorgias](https://temporal.io/resources/case-studies/gorgias-uses-ai-agents-to-improve-customer-service) | Action-taking agents needed API retries, compensation, asynchronous steps, and pauses. | Define side-effect contracts before composing agents; durability is not an external transaction guarantee. |
| [Spiral Scout](https://temporal.io/resources/on-demand/practical-tactical-approach-temporal-ai) — abstract | Discusses long-lived agents and external data references. | Retain immutable recovery artifacts for the required lifetime. |
| [Arc XP](https://temporal.io/resources/on-demand/arc-xp-washington-post-perceptual-ai-pipeline) — abstract | Describes an inference pipeline whose Activity boundaries were refined. | Match checkpoints to recoverable stages; the abstract supplies no configuration recipe. |
| [Juristat](https://temporal.io/resources/on-demand/building-assembly-lines-juristat) — abstract | Describes combining manual and automated stages. | Preserve proposal identity and terminal states as work moves between humans and automation. |

## Technical authority

Use the matching installed SDK and integration documentation for API details. The portable process complements [Temporal's official developer skill](https://github.com/temporalio/skill-temporal-developer/tree/b6a2c3fdbb8898db8f5bfa08eb008d393fa59af8), available as optional SDK guidance; customer stories do not override those contracts.

- [Activities](https://docs.temporal.io/activities): execution, retries, and the scope of an Activity checkpoint.
- [Workflow determinism](https://docs.temporal.io/workflow-definition): replay-compatible orchestration.
- [Python failure handling](https://docs.temporal.io/develop/python/best-practices/error-handling): application error classes and retry controls; other SDKs have their own mappings.
- [Workflow messages](https://docs.temporal.io/encyclopedia/workflow-message-passing) and [Python handlers](https://docs.temporal.io/develop/python/workflows/message-passing): message semantics and concurrent handler completion.
- [Continue-As-New](https://docs.temporal.io/develop/python/workflows/continue-as-new): fresh history and explicit state transfer.
- [Child Workflows](https://docs.temporal.io/child-workflows): lifecycle boundaries and when a child is appropriate.
- [Strands integration](https://docs.temporal.io/develop/python/integrations/strands-agents): an example of an integration providing Temporal-aware agent execution; verify the actual plugin and supported version.
- [OpenAI Agents integration](https://docs.temporal.io/develop/python/integrations/openai-agents) and [LangGraph integration](https://docs.temporal.io/develop/python/integrations/langgraph): explicit tool/node boundaries and streaming behavior.
- [Retry policies](https://docs.temporal.io/encyclopedia/retry-policies): default attempt behavior and configured bounds.
- [Payload Codec](https://docs.temporal.io/payload-codec), [Failure Converter](https://docs.temporal.io/failure-converter), and [Search Attributes](https://docs.temporal.io/search-attribute): which data can be encoded and which remains visible metadata.

Read only the sources needed for the task or a disputed claim; this is an attribution and verification index, not a mandatory reading queue.
