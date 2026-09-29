# Consumer evidence

Use this branch when usage can escape a closed local caller search. Keep a compact
record for each consumer group: evidence location and revision/time, required
behavior, migration owner, replacement status, and remaining uncertainty.

Choose evidence from the actual exposure:

| Exposure | Evidence to inspect | What it cannot establish alone |
| --- | --- | --- |
| Source dependency | Imports, exports, aliases, build/dependency graph, generated clients | Unavailable repositories or dynamically selected targets |
| Runtime selection | Registries, configuration, plugins, scheduled jobs, fallback paths | An unexecuted branch's absence |
| Deployed clients | Supported versions, release inventory, identified usage | Offline or infrequent callers outside the observation interval |
| Retained inputs | Stored configuration, serialized names, queued work, replay tooling | Compatibility with history that was never sampled |

Label evidence as observed use, covered absence, or unknown. Record which
environments, versions, paths, and time interval were observed. Match an observation
window to the relevant usage cadence; an arbitrary quiet interval cannot rule out
a periodic job. State unavailable consumer access instead of inventing a complete
inventory. Consumer acknowledgement helps locate responsibility but does not
replace a compatibility check.

Select a representative case from each materially different required behavior,
including a fallback or error outcome when migration changes it. Keep equivalent
behavior separate from an authorized product decision to withdraw behavior.
For effectful calls, compare in an isolated fixture or through an explicitly safe
observation path; invoking both implementations against a live target can duplicate
the operation. These evidence categories and checks are repository applications,
not a claim that any one search technique proves every consumer absent.
