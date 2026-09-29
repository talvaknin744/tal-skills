# Execution boundaries

## Checkpoint what needs independent recovery

Trace the actual integration, including decorators and plugin registration. A plain Activity containing an entire agent graph has one Temporal completion boundary: a later failure can repeat earlier inner model calls and effects. Split independently recoverable steps, or inspect an existing graph checkpoint store and prove its resume semantics. Temporal-aware integrations may create finer boundaries automatically; verify the installed integration rather than applying the plain-Activity rule to its public API. [Activity execution](https://docs.temporal.io/activities), [Strands integration](https://docs.temporal.io/develop/python/integrations/strands-agents).

Inspect tools as well as model calls. For example, the Python OpenAI Agents plugin routes model calls through Activities, but ordinary `@function_tool` functions execute in Workflow context; effectful tools need the supported Activity or Nexus wrapper. LangGraph's Temporal integration distinguishes Activity nodes from deterministic Workflow nodes and edges. Its retried Activity nodes can republish stream chunks: treat streaming as provisional or deduplicate it, and use the final durable result for business completion. [OpenAI Agents integration](https://docs.temporal.io/develop/python/integrations/openai-agents), [LangGraph integration](https://docs.temporal.io/develop/python/integrations/langgraph).

Choose boundaries by failure and recovery cost. Child Workflows can own separate histories and lifecycles, but using them does not isolate memory, CPU, credentials, or provider quotas. Keep a small bounded pipeline in one Workflow when its existing Activities provide sufficient recovery. [Child Workflows](https://docs.temporal.io/child-workflows).

## Classify model outcomes

Distinguish transport failure, invalid structured output, rejected business intent, and tool execution failure. Implement the validator and its failure mapping explicitly; Temporal cannot infer whether an answer is useful or authorized. A recorded but invalid response can drive a bounded repair step; an Activity can instead validate before returning and use a deliberate retry policy. Choose one owner for regeneration so nested framework/provider/Activity retries do not multiply attempts. SDK exception classes determine whether a failure retries a task, fails an Activity, or closes the Workflow. [Python failure handling](https://docs.temporal.io/develop/python/best-practices/error-handling).

Give permanent input/configuration failures a terminal or repair path. Give temporary outages a bounded retry window and provider-aware backoff. Track attempts that consume money even when the response is lost. A Workflow counter around one Activity sees its final result, not every internal attempt; enforce a hard spending ceiling where calls are made, or reserve a conservative upper bound before dispatch. If the provider cannot report uncertain usage, expose that uncertainty in the remaining budget.

Check the effective retry configuration rather than assuming a small default. Standard Activity retries default to unlimited attempts; a Schedule-to-Close timeout bounds elapsed execution, while an explicit attempt policy bounds invocations. A repair that needs a new model sample must schedule one; replaying a recorded completion only returns the recorded answer. [Retry policies](https://docs.temporal.io/encyclopedia/retry-policies).

## Preserve business identity through tool execution

Bind each intended effect to a stable business operation ID plus immutable parameters and scope. The identity must survive the retries and replacement Runs that can repeat that operation; a new model tool-call ID or Run ID is insufficient when the business action is unchanged. Enforce deduplication at the effect owner and reject reuse with changed intent. Temporal's recorded Activity result is separate from the external service's commit. [Activity idempotency](https://docs.temporal.io/develop/python/best-practices/error-handling#make-activities-idempotent).

After acceptance followed by timeout, return or retain an unknown outcome until a provider idempotency contract or reconciliation proves what happened. Persisting an email before sending preserves its content; duplicate-free delivery still requires a send protocol. Compensation is a separate authorized effect with its own identity and failure handling. Preserve successful tool results when repairing an answer; rephrasing the response must not repeat the purchase, refund, or message.

## Control resource lifecycles

For disposable execution sandboxes, retain a stable resource identity and reconcile create/status/delete after uncertain results. If resource-heavy tool execution can kill its controller, separate their worker resources within the requested scope. Stopping orchestration does not establish that an external command stopped: define cancellation acknowledgement, cleanup ownership, and how a stale process is prevented from committing further effects. A unique running Workflow ID alone does not enforce one live external process.

Use per-attempt and overall Activity timeouts appropriate to the provider. Long operations need supported heartbeats/checkpoints and cooperative cancellation where available. Test a Worker dying after an external acceptance as well as before it; a mock throwing before any effect misses the duplicate window.
